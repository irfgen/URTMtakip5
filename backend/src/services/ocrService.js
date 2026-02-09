const Tesseract = require('tesseract.js');
const { OCRError } = require('../utils/errors');

class OCRService {
  constructor() {
    this.timeout = parseInt(process.env.OCR_TIMEOUT) || 30000;
    this.confidenceThreshold = parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD) || 0.5;
    this.worker = null;
  }

  async initializeWorker() {
    try {
      if (!this.worker) {
        this.worker = await Tesseract.createWorker({
          logger: m => {
            if (process.env.NODE_ENV === 'development') {
              console.log(`OCR Progress: ${m.status} ${m.progress ? `(${(m.progress * 100).toFixed(1)}%)` : ''}`);
            }
          }
        });

        await this.worker.loadLanguage('tur+eng');
        await this.worker.initialize('tur+eng');

        // Configure Tesseract parameters for technical drawings
        await this.worker.setParameters({
          tessedit_pageseg_mode: 6, // Uniform block of text
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÇĞIİÖŞÜçğıiöşü0123456789 .-_:/()',
          preserve_interword_spaces: '1'
        });
      }
      return this.worker;
    } catch (error) {
      throw new OCRError(`OCR worker başlatılamadı: ${error.message}`, 'WORKER_INIT_FAILED');
    }
  }

  async extractText(imageBuffer) {
    try {
      const worker = await this.initializeWorker();
      
      // Set timeout for OCR operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OCR timeout')), this.timeout);
      });

      const ocrPromise = worker.recognize(imageBuffer);
      
      const result = await Promise.race([ocrPromise, timeoutPromise]);

      return this.processOCRResult(result);
    } catch (error) {
      if (error.message === 'OCR timeout') {
        throw new OCRError('OCR işlemi zaman aşımına uğradı', 'OCR_TIMEOUT');
      }
      throw new OCRError(`OCR işlemi başarısız: ${error.message}`, 'OCR_FAILED');
    }
  }

  processOCRResult(result) {
    const { data } = result;
    
    // Extract text with confidence scores
    const extractedText = data.text || '';
    const confidence = data.confidence || 0;
    
    // Clean and process text
    const cleanedText = this.cleanText(extractedText);
    
    // Extract words with their confidence scores
    const words = data.words ? data.words.map(word => ({
      text: word.text,
      confidence: word.confidence,
      bbox: {
        x0: word.bbox.x0,
        y0: word.bbox.y0,
        x1: word.bbox.x1,
        y1: word.bbox.y1
      }
    })).filter(word => word.confidence > this.confidenceThreshold * 100) : [];

    // Extract lines for better structure
    const lines = data.lines ? data.lines.map(line => ({
      text: line.text,
      confidence: line.confidence,
      bbox: {
        x0: line.bbox.x0,
        y0: line.bbox.y0,
        x1: line.bbox.x1,
        y1: line.bbox.y1
      }
    })).filter(line => line.confidence > this.confidenceThreshold * 100) : [];

    return {
      text: cleanedText,
      confidence: confidence / 100, // Convert to 0-1 scale
      words: words,
      lines: lines,
      totalWords: words.length,
      highConfidenceWords: words.filter(w => w.confidence > 80).length,
      processingTime: data.processingTime || 0
    };
  }

  cleanText(text) {
    if (!text) return '';
    
    return text
      // Fix common OCR errors for Turkish characters
      .replace(/\|/g, 'I')
      .replace(/0/g, 'O')
      .replace(/1/g, 'I')
      .replace(/5/g, 'S')
      .replace(/\?/g, '')
      
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      
      // Fix common technical drawing terms
      .replace(/MALZ[E3]M[E3]/gi, 'MALZEME')
      .replace(/PAR[C Ç][A a]/gi, 'PARÇA')
      .replace(/PR0J[E3]/gi, 'PROJE')
      .replace(/M0NTAJ/gi, 'MONTAJ')
      .replace(/[Ç C][I i]Z[I i]M/gi, 'ÇİZİM')
      
      // Remove excessive punctuation
      .replace(/[.,;:!?]{2,}/g, '.')
      .trim();
  }

  async recognizeWithMultiplePSM(imageBuffer) {
    const psmModes = [6, 7, 8, 3]; // Try different page segmentation modes
    let bestResult = null;
    let bestConfidence = 0;

    for (const psm of psmModes) {
      try {
        const worker = await this.initializeWorker();
        await worker.setParameters({ tessedit_pageseg_mode: psm });
        
        const result = await worker.recognize(imageBuffer);
        const processed = this.processOCRResult(result);
        
        if (processed.confidence > bestConfidence) {
          bestConfidence = processed.confidence;
          bestResult = processed;
        }
      } catch (error) {
        console.warn(`PSM ${psm} failed:`, error.message);
      }
    }

    return bestResult || { text: '', confidence: 0, words: [], lines: [], totalWords: 0, highConfidenceWords: 0, processingTime: 0 };
  }

  async extractTextWithRegions(imageBuffer) {
    try {
      // First, try standard OCR
      let result = await this.extractText(imageBuffer);
      
      // If confidence is low, try multiple PSM modes
      if (result.confidence < this.confidenceThreshold) {
        console.log('Low confidence, trying multiple PSM modes...');
        result = await this.recognizeWithMultiplePSM(imageBuffer);
      }

      return result;
    } catch (error) {
      throw new OCRError(`Metin çıkarma hatası: ${error.message}`, 'TEXT_EXTRACTION_FAILED');
    }
  }

  async terminate() {
    if (this.worker) {
      try {
        await this.worker.terminate();
        this.worker = null;
      } catch (error) {
        console.warn('Worker termination warning:', error.message);
      }
    }
  }

  // Static method for quick text extraction
  static async quickExtract(imageBuffer) {
    const service = new OCRService();
    try {
      const result = await service.extractTextWithRegions(imageBuffer);
      await service.terminate();
      return result;
    } catch (error) {
      await service.terminate();
      throw error;
    }
  }
}

module.exports = OCRService; 