/**
 * IrsaliyeParserService - Rule-based parser for simple invoices
 * Basit irsaliyeler için template-based extraction
 */
const OCRService = require('../ocrService');
const TextAnalyzer = require('../textAnalyzer');

class IrsaliyeParserService {
  constructor() {
    this.ocrService = new OCRService();
    this.textAnalyzer = new TextAnalyzer();

    // İrsaliye-specific patterns (global flag for matchAll)
    this.patterns = {
      irsaliyeNo: [
        /irsaliye\s*no\s*[:\-]?\s*(\d+[A-Za-z0-9\/\-]*)/gi,
        /irsaliye\s*numarası\s*[:\-]?\s*(\d+[A-Za-z0-9\/\-]*)/gi,
        /belge\s*no\s*[:\-]?\s*(\d+[A-Za-z0-9\/\-]*)/gi,
        /^(\d{6,})\s*$/gm // Stand alone numbers
      ],
      tedarikci: [
        /tedarikçi\s*[:\-]?\s*([A-Za-zÇĞIİÖŞÜçğıiöşü\s\.]+?)(?=\n|satıcı|firma)/gi,
        /satıcı\s*[:\-]?\s*([A-Za-zÇĞIİÖŞÜçğıiöşü\s\.]+?)(?=\n|tel|fax)/gi,
        /firma\s*[:\-]?\s*([A-Za-zÇĞIİÖŞÜçğıiöşü\s\.]+?)(?=\n|adres)/gi,
        /^([A-Z\s\.]{5,30})\s*$/gm // Uppercase company names
      ],
      tarih: [
        /tarih\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
        /belge\s*tarihi\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
        /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g
      ],
      kalemBasliklari: [
        /stok\s*kodu|mal\w*\s*hizmet\s*adi|malzeme|parça|urun|kalem|aciklama/i
      ],
      miktarPattern: /(\d+[\.,]?\d*)\s*(adet|kg|lt|m|metre|tl|€|\$)?/i,
      birimPattern: /(adet|kg|lt|m|m\.|metre|ton|paket|koli)/i
    };
  }

  /**
   * Main parsing method - extracts structured data from document image
   * @param {Buffer} imageBuffer - Document image buffer
   * @returns {Promise<Object>} Parsed irsaliye data
   */
  async parseDocument(imageBuffer) {
    try {
      // Step 1: OCR extraction
      const ocrResult = await this.ocrService.extractTextWithRegions(imageBuffer);

      // Step 2: Extract irsaliye fields
      const parsedData = {
        irsaliyeNo: this.extractIrsaliyeNo(ocrResult.text),
        tedarikci: this.extractTedarikci(ocrResult.text),
        tarih: this.extractTarih(ocrResult.text),
        kalemler: this.extractKalemler(ocrResult),
        metadata: {
          ocrConfidence: ocrResult.confidence,
          totalWords: ocrResult.totalWords,
          highConfidenceWords: ocrResult.highConfidenceWords,
          parseMethod: 'rule_based'
        }
      };

      // Step 3: Calculate complexity score
      parsedData.complexityScore = this.calculateComplexityScore(parsedData, ocrResult);

      return parsedData;
    } catch (error) {
      throw new Error(`İrsaliye parsing hatası: ${error.message}`);
    }
  }

  /**
   * Extract irsaliye number from text
   */
  extractIrsaliyeNo(text) {
    const results = [];

    for (const pattern of this.patterns.irsaliyeNo) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] && match[1].trim()) {
          results.push({
            value: match[1].trim(),
            confidence: 0.85,
            source: 'pattern'
          });
        }
      }
    }

    return this.selectBestMatch(results);
  }

  /**
   * Extract supplier name from text
   */
  extractTedarikci(text) {
    const results = [];

    for (const pattern of this.patterns.tedarikci) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 2) {
          const cleanName = match[1].trim()
            .replace(/\s+/g, ' ')
            .substring(0, 100);

          results.push({
            value: cleanName,
            confidence: 0.75,
            source: 'pattern'
          });
        }
      }
    }

    return this.selectBestMatch(results);
  }

  /**
   * Extract document date
   */
  extractTarih(text) {
    const results = [];

    for (const pattern of this.patterns.tarih) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match[1]) {
          const normalizedDate = this.normalizeDate(match[1]);
          if (normalizedDate) {
            results.push({
              value: normalizedDate,
              confidence: 0.8,
              source: 'pattern'
            });
          }
        }
      }
    }

    return this.selectBestMatch(results);
  }

  /**
   * Extract line items (kalemler) from OCR result
   */
  extractKalemler(ocrResult) {
    const { text, lines } = ocrResult;
    const kalemler = [];

    // Find where the table/list starts (header row detection)
    let startIndex = this.findTableStartIndex(lines);

    // Extract items line by line
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].text.trim();

      // Skip empty lines and headers
      if (!line || this.isHeaderLine(line)) continue;

      // Skip totals and summary lines
      if (this.isSummaryLine(line)) continue;

      const kalem = this.parseKalemLine(line);
      if (kalem && this.isValidKalem(kalem)) {
        kalemler.push(kalem);
      }
    }

    return kalemler;
  }

  /**
   * Find the starting index of the items table
   */
  findTableStartIndex(lines) {
    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i].text.toLowerCase();
      for (const pattern of this.patterns.kalemBasliklari) {
        if (pattern.test(lineText)) {
          return i + 1; // Start from next line
        }
      }
    }
    return 0; // Default to start if no header found
  }

  /**
   * Check if line is a header
   */
  isHeaderLine(line) {
    const lowerLine = line.toLowerCase();
    return this.patterns.kalemBasliklari.some(pattern => pattern.test(lowerLine));
  }

  /**
   * Check if line is a summary/total line
   */
  isSummaryLine(line) {
    const lowerLine = line.toLowerCase();
    return /toplam|ara\s*toplam|kdv|genel|toplam\s*tutar|sum/i.test(lowerLine);
  }

  /**
   * Parse a single item line
   */
  parseKalemLine(line) {
    // Try to extract: stok kodu, mal/hizmet adi, miktar, birim
    const tokens = line.split(/\s{2,}|\t/); // Split by 2+ spaces or tab

    let kalem = {
      stokKodu: null,
      malHizmetAdi: null,
      miktar: null,
      birim: null,
      confidence: 0.5
    };

    // Pattern-based extraction
    const codeMatch = line.match(/^([A-Z]{1,4}[\-]?[\d]{2,6}[A-Z]?)/i);
    if (codeMatch) {
      kalem.stokKodu = codeMatch[1].toUpperCase();
      kalem.confidence = 0.7;
    }

    // Extract quantity and unit
    const miktarMatch = line.match(/(\d+[\.,]?\d*)\s*(adet|kg|lt|m|metre|ton|paket)?/i);
    if (miktarMatch) {
      kalem.miktar = parseFloat(miktarMatch[1].replace(',', '.'));
      kalem.birim = miktarMatch[2] || 'adet';
      kalem.confidence = Math.max(kalem.confidence, 0.75);
    }

    // Extract product name (remaining text after code and quantity)
    let nameText = line;
    if (kalem.stokKodu) {
      nameText = nameText.replace(kalem.stokKodu, '').trim();
    }
    if (kalem.miktar) {
      nameText = nameText.replace(/[\d]+[\.,]?\d*\s*(adet|kg|lt|m|metre|ton|paket)?/i, '').trim();
    }

    if (nameText.length > 2 && nameText.length < 100) {
      kalem.malHizmetAdi = nameText.substring(0, 50);
      kalem.confidence = Math.max(kalem.confidence, 0.6);
    }

    return kalem.confidence > 0.5 ? kalem : null;
  }

  /**
   * Validate if parsed kalem is reasonable
   */
  isValidKalem(kalem) {
    if (!kalem) return false;

    // Must have at least a name or code
    if (!kalem.malHizmetAdi && !kalem.stokKodu) return false;

    // Quantity must be positive if present
    if (kalem.miktar !== null && kalem.miktar <= 0) return false;

    // Name must be reasonable length
    if (kalem.malHizmetAdi) {
      if (kalem.malHizmetAdi.length < 2 || kalem.malHizmetAdi.length > 100) return false;
    }

    return true;
  }

  /**
   * Normalize date to ISO format
   */
  normalizeDate(dateStr) {
    try {
      // Parse Turkish date format
      const parts = dateStr.split(/[\/\-\.]/);
      if (parts.length === 3) {
        let [day, month, year] = parts;
        if (year.length === 2) year = '20' + year;

        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Calculate complexity score (0-1)
   * Higher score = more complex, needs AI analysis
   */
  calculateComplexityScore(parsedData, ocrResult) {
    let score = 0;

    // OCR confidence factor (lower confidence = higher complexity)
    score += (1 - ocrResult.confidence) * 0.3;

    // Missing fields increase complexity
    if (!parsedData.irsaliyeNo?.value) score += 0.15;
    if (!parsedData.tedarikci?.value) score += 0.15;
    if (!parsedData.tarih?.value) score += 0.1;

    // Too few or too many items increases complexity
    const kalemCount = parsedData.kalemler?.length || 0;
    if (kalemCount === 0) score += 0.3;
    if (kalemCount > 20) score += 0.2;

    // Low confidence in items
    const avgKalemConfidence = parsedData.kalemler?.reduce((sum, k) => sum + (k.confidence || 0), 0) / kalemCount || 0;
    if (avgKalemConfidence < 0.6) score += 0.2;

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Select best match from results
   */
  selectBestMatch(results) {
    if (!results.length) {
      return { value: null, confidence: 0 };
    }

    const sorted = results.sort((a, b) => b.confidence - a.confidence);
    return sorted[0];
  }

  /**
   * Check if this parser can handle the document (simple documents only)
   */
  canHandleDocument(complexityScore) {
    // Can handle if complexity score is below threshold
    return complexityScore < 0.5;
  }

  async terminate() {
    await this.ocrService.terminate();
  }
}

module.exports = IrsaliyeParserService;
