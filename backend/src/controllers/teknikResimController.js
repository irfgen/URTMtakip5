const ImageProcessor = require('../services/imageProcessor');
const OCRService = require('../services/ocrService');
const TextAnalyzer = require('../services/textAnalyzer');
const ResponseFormatter = require('../utils/responseFormatter');
const asyncHandler = require('../utils/asyncHandler');
const { FileError, ImageProcessingError, OCRError } = require('../utils/errors');
const { uploadTeknikResim, validateTeknikResim } = require('../middleware/teknikResimUpload');
const { teknikResimUploadLimiter } = require('../middleware/rateLimiter');
const teknikResimLogger = require('../utils/teknikResimLogger');

class TeknikResimController {
  constructor() {
    this.imageProcessor = new ImageProcessor();
    this.textAnalyzer = new TextAnalyzer();
  }

  // Interactive teknik resim analiz endpoint'i - kullanıcı seçimi için tüm metinleri döndürür
  analyzeDrawingInteractive = asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    try {
      if (!req.file) {
        throw new FileError('Teknik resim dosyası yüklenmedi', 'NO_FILE_UPLOADED');
      }

      const filename = req.file.originalname;
      teknikResimLogger.info(`Interactive teknik resim analizi başlıyor: ${filename} (${req.fileMetadata.sizeFormatted})`);

      // Step 1: Process the image
      teknikResimLogger.info('Adım 1: Görüntü işleme...');
      const imageProcessingStart = Date.now();
      
      const processedImage = await this.imageProcessor.processImage(
        req.file.buffer,
        req.file.mimetype,
        filename
      );
      
      const imageProcessingTime = Date.now() - imageProcessingStart;
      teknikResimLogger.info(`Görüntü işleme tamamlandı: ${imageProcessingTime}ms`);

      // Step 2: Create OCR-optimized version
      teknikResimLogger.info('Adım 2: OCR için optimize ediliyor...');
      const ocrOptimizedBuffer = await this.imageProcessor.createOCROptimizedVersion(processedImage.buffer);

      // Step 3: Extract text using OCR
      teknikResimLogger.info('Adım 3: OCR metin çıkarımı...');
      const ocrStart = Date.now();
      
      const ocrResult = await OCRService.quickExtract(ocrOptimizedBuffer);
      
      const ocrProcessingTime = Date.now() - ocrStart;
      teknikResimLogger.ocrLogger.complete(filename, ocrResult);

      // Step 4: Interactive analysis (includes standard analysis + categorized texts)
      teknikResimLogger.info('Adım 4: Interactive metin analizi...');
      const analysisStart = Date.now();
      
      const interactiveAnalysisResult = this.textAnalyzer.analyzeTextInteractive({
        ...ocrResult,
        ocrProcessingTime
      });
      
      const analysisTime = Date.now() - analysisStart;
      teknikResimLogger.analysisLogger.result(filename, interactiveAnalysisResult);

      // Step 5: Prepare interactive response data
      teknikResimLogger.info('Adım 5: Interactive response hazırlanıyor...');
      
      const base64Image = this.imageProcessor.bufferToBase64(processedImage.buffer, 'image/png');
      
      const totalProcessingTime = Date.now() - startTime;

      const responseData = ResponseFormatter.interactiveAnalysisResult(
        interactiveAnalysisResult,
        {
          base64Image,
          metadata: processedImage.metadata
        },
        {
          ...processedImage.metadata,
          processingTime: totalProcessingTime,
          ocrProcessingTime,
          imageProcessingTime,
          analysisTime
        }
      );

      teknikResimLogger.info(`Interactive teknik resim analizi tamamlandı: ${totalProcessingTime}ms`, {
        candidatesFound: interactiveAnalysisResult.extractedTexts.candidates.length,
        totalTexts: interactiveAnalysisResult.extractedTexts.all,
        standardResult: {
          parca_kodu: interactiveAnalysisResult.partName?.value,
          material: interactiveAnalysisResult.material?.value,
          projectName: interactiveAnalysisResult.projectName?.value
        }
      });

      res.status(200).json(responseData);

    } catch (error) {
      teknikResimLogger.error('Interactive analiz hatası:', error);
      
      if (error instanceof FileError || 
          error instanceof ImageProcessingError || 
          error instanceof OCRError) {
        return res.status(error.statusCode || 400).json(ResponseFormatter.error(error));
      }
      
      // Handle unknown errors
      const unknownError = new Error('Interactive teknik resim analizi sırasında beklenmeyen bir hata oluştu');
      unknownError.code = 'INTERACTIVE_ANALYSIS_FAILED';
      unknownError.details = process.env.NODE_ENV === 'development' ? error.message : null;
      
      res.status(500).json(ResponseFormatter.error(unknownError));
    }
  });

  // Ana teknik resim analiz endpoint'i
  analyzeDrawing = asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    try {
      if (!req.file) {
        throw new FileError('Teknik resim dosyası yüklenmedi', 'NO_FILE_UPLOADED');
      }

      const filename = req.file.originalname;
      teknikResimLogger.info(`Teknik resim analizi başlıyor: ${filename} (${req.fileMetadata.sizeFormatted})`);

      // Step 1: Process the image
      teknikResimLogger.info('Adım 1: Görüntü işleme...');
      const imageProcessingStart = Date.now();
      
      const processedImage = await this.imageProcessor.processImage(
        req.file.buffer,
        req.file.mimetype,
        filename
      );
      
      const imageProcessingTime = Date.now() - imageProcessingStart;
      teknikResimLogger.info(`Görüntü işleme tamamlandı: ${imageProcessingTime}ms`);

      // Step 2: Create OCR-optimized version
      teknikResimLogger.info('Adım 2: OCR için optimize ediliyor...');
      const ocrOptimizedBuffer = await this.imageProcessor.createOCROptimizedVersion(processedImage.buffer);

      // Step 3: Extract text using OCR
      teknikResimLogger.info('Adım 3: OCR metin çıkarımı...');
      const ocrStart = Date.now();
      
      const ocrResult = await OCRService.quickExtract(ocrOptimizedBuffer);
      
      const ocrProcessingTime = Date.now() - ocrStart;
      teknikResimLogger.ocrLogger.complete(filename, ocrResult);
      
      if (process.env.NODE_ENV === 'development') {
        teknikResimLogger.info('Çıkarılan metin önizleme:', ocrResult.text.substring(0, 200) + '...');
      }

      // Step 4: Analyze extracted text
      teknikResimLogger.info('Adım 4: Metin analizi...');
      const analysisStart = Date.now();
      
      const analysisResult = this.textAnalyzer.analyzeText({
        ...ocrResult,
        ocrProcessingTime
      });
      
      const analysisTime = Date.now() - analysisStart;
      teknikResimLogger.analysisLogger.result(filename, analysisResult);

      // Check confidence and log if low
      if (analysisResult.confidence.overall < 0.7) {
        teknikResimLogger.analysisLogger.lowConfidence(filename, analysisResult.confidence.overall, 0.7);
      }

      // Step 5: Prepare response data
      teknikResimLogger.info('Adım 5: Response hazırlanıyor...');
      
      const base64Image = this.imageProcessor.bufferToBase64(processedImage.buffer, 'image/png');
      
      const totalProcessingTime = Date.now() - startTime;

      const responseData = ResponseFormatter.analysisResult(
        analysisResult,
        {
          base64Image,
          metadata: processedImage.metadata
        },
        {
          ...processedImage.metadata,
          processingTime: totalProcessingTime,
          ocrProcessingTime,
          imageProcessingTime,
          analysisTime
        }
      );

      teknikResimLogger.info(`Teknik resim analizi tamamlandı: ${totalProcessingTime}ms`, {
        parca_kodu: analysisResult.partName?.value,
        material: analysisResult.material?.value,
        projectName: analysisResult.projectName?.value,
        confidence: analysisResult.confidence.overall
      });

      res.status(200).json(responseData);

    } catch (error) {
      teknikResimLogger.error('Analiz hatası:', error);
      
      if (error instanceof FileError || 
          error instanceof ImageProcessingError || 
          error instanceof OCRError) {
        return res.status(error.statusCode || 400).json(ResponseFormatter.error(error));
      }
      
      // Handle unknown errors
      const unknownError = new Error('Teknik resim analizi sırasında beklenmeyen bir hata oluştu');
      unknownError.code = 'ANALYSIS_FAILED';
      unknownError.details = process.env.NODE_ENV === 'development' ? error.message : null;
      
      res.status(500).json(ResponseFormatter.error(unknownError));
    }
  });

  // Test endpoint
  test = asyncHandler(async (req, res) => {
    res.status(200).json(ResponseFormatter.testResponse());
  });

  // Health check endpoint
  healthCheck = asyncHandler(async (req, res) => {
    res.status(200).json(ResponseFormatter.healthCheck());
  });

  // Apply rate limiting middleware to analyze endpoint
  applyRateLimit = teknikResimUploadLimiter;

  // Apply upload middleware to analyze endpoint
  applyUpload = uploadTeknikResim('teknik_resim');

  // Apply validation middleware
  applyValidation = validateTeknikResim;
}

// Export singleton instance
module.exports = new TeknikResimController(); 