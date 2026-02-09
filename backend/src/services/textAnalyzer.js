const {
  PART_NAME_PATTERNS,
  MATERIAL_PATTERNS,
  PROJECT_NAME_PATTERNS,
  DRAWING_NUMBER_PATTERNS,
  REVISION_PATTERNS,
  SCALE_PATTERNS,
  DATE_PATTERNS,
  DIMENSION_PATTERNS,
  TOLERANCE_PATTERNS,
  STANDARD_PATTERNS,
  SURFACE_PATTERNS,
  HEAT_TREATMENT_PATTERNS
} = require('../utils/textPatterns');

class TextAnalyzer {
  constructor() {
    this.technicalDictionary = this.buildTechnicalDictionary();
  }

  buildTechnicalDictionary() {
    return {
      // Turkish technical terms
      turkishTerms: [
        'PARÇA', 'MONTAJ', 'ÇİZİM', 'MALZEME', 'PROJE', 'ÖLÇEK', 'REVİZYON',
        'PLAKA', 'KAPAK', 'VİDA', 'SOMUN', 'PULS', 'CONTA', 'YATAĞ', 'MİL',
        'ÇELİK', 'ALÜMINYUM', 'BRONZ', 'PIRINÇ', 'PASLANMAZ',
        'SERTLEŞTIRME', 'TAVLAMA', 'NORMALLEME'
      ],
      
      // English technical terms
      englishTerms: [
        'PART', 'ASSEMBLY', 'DRAWING', 'MATERIAL', 'PROJECT', 'SCALE', 'REVISION',
        'PLATE', 'COVER', 'SCREW', 'NUT', 'WASHER', 'GASKET', 'BEARING', 'SHAFT',
        'STEEL', 'ALUMINUM', 'BRONZE', 'BRASS', 'STAINLESS',
        'HARDENING', 'ANNEALING', 'NORMALIZING'
      ],
      
      // Material grades
      materialGrades: [
        'St37', 'St52', 'S235', 'S355', 'AISI304', 'AISI316', 'DIN1654',
        'EN10025', 'C45', 'C60', 'SAE1020', 'SAE4140'
      ],
      
      // Common part types
      partTypes: [
        'PLAKA', 'PLATE', 'KAPAK', 'COVER', 'VİDA', 'SCREW', 'BOLT',
        'SOMUN', 'NUT', 'PULS', 'WASHER', 'CONTA', 'GASKET', 'O-RING',
        'YATAĞ', 'BEARING', 'MİL', 'SHAFT', 'KAMÇI', 'CAM', 'DİŞLİ', 'GEAR'
      ]
    };
  }

  analyzeText(ocrResult) {
    const { text, words, lines, confidence } = ocrResult;
    
    const analysis = {
      partName: this.extractPartName(text, words, lines),
      material: this.extractMaterial(text, words, lines),
      projectName: this.extractProjectName(text, words, lines),
      drawingNumber: this.extractDrawingNumber(text, words, lines),
      revision: this.extractRevision(text, words, lines),
      scale: this.extractScale(text),
      date: this.extractDate(text),
      dimensions: this.extractDimensions(text),
      tolerances: this.extractTolerances(text),
      standards: this.extractStandards(text),
      surfaceFinish: this.extractSurfaceFinish(text),
      heatTreatment: this.extractHeatTreatment(text),
      confidence: {
        overall: confidence,
        partName: 0,
        material: 0,
        projectName: 0
      },
      metadata: {
        totalWords: words.length,
        highConfidenceWords: words.filter(w => w.confidence > 80).length,
        detectedLanguages: this.detectLanguages(text),
        technicalTermsFound: this.findTechnicalTerms(text)
      }
    };

    // Calculate confidence scores for extracted data
    analysis.confidence = this.calculateConfidenceScores(analysis, words, lines);

    return analysis;
  }

  // Interactive Analysis: Get all extracted texts with categorization and scoring
  analyzeTextInteractive(ocrResult) {
    const { text, words, lines, confidence } = ocrResult;
    
    // Get standard analysis
    const standardAnalysis = this.analyzeText(ocrResult);
    
    // Get all extracted texts categorized
    const extractedTexts = this.getAllExtractedTexts(text, words, lines);
    
    return {
      ...standardAnalysis,
      extractedTexts
    };
  }

  extractPartName(text, words = [], lines = []) {
    const results = [];
    
    // Try all part name patterns
    for (const pattern of PART_NAME_PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 2) {
          const cleanName = this.cleanExtractedText(match[1]);
          if (this.isValidPartName(cleanName)) {
            results.push({
              value: cleanName,
              confidence: this.calculateTextConfidence(cleanName, words),
              source: 'pattern_match',
              pattern: pattern.source
            });
          }
        }
      }
    }

    // Try context-based extraction
    const contextResults = this.extractByContext(text, this.technicalDictionary.partTypes);
    results.push(...contextResults.map(r => ({ ...r, source: 'context' })));

    // Return best match
    return this.selectBestMatch(results);
  }

  extractMaterial(text, words = [], lines = []) {
    const results = [];
    
    // Try material patterns
    for (const pattern of MATERIAL_PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 1) {
          const cleanMaterial = this.cleanExtractedText(match[1]);
          if (this.isValidMaterial(cleanMaterial)) {
            results.push({
              value: cleanMaterial,
              confidence: this.calculateTextConfidence(cleanMaterial, words),
              source: 'pattern_match',
              pattern: pattern.source
            });
          }
        }
      }
    }

    // Look for material grades in dictionary
    for (const grade of this.technicalDictionary.materialGrades) {
      if (text.toUpperCase().includes(grade.toUpperCase())) {
        results.push({
          value: grade,
          confidence: 0.9,
          source: 'dictionary_match'
        });
      }
    }

    return this.selectBestMatch(results);
  }

  extractProjectName(text, words = [], lines = []) {
    const results = [];
    
    for (const pattern of PROJECT_NAME_PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 2) {
          const cleanProject = this.cleanExtractedText(match[1]);
          if (this.isValidProjectName(cleanProject)) {
            results.push({
              value: cleanProject,
              confidence: this.calculateTextConfidence(cleanProject, words),
              source: 'pattern_match',
              pattern: pattern.source
            });
          }
        }
      }
    }

    return this.selectBestMatch(results);
  }

  extractDrawingNumber(text, words = [], lines = []) {
    const results = [];
    
    for (const pattern of DRAWING_NUMBER_PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 0) {
          results.push({
            value: match[1].trim(),
            confidence: 0.8,
            source: 'pattern_match'
          });
        }
      }
    }

    return this.selectBestMatch(results);
  }

  extractRevision(text, words = [], lines = []) {
    const results = [];
    
    for (const pattern of REVISION_PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 0) {
          results.push({
            value: match[1].trim(),
            confidence: 0.8,
            source: 'pattern_match'
          });
        }
      }
    }

    return this.selectBestMatch(results);
  }

  extractScale(text) {
    const results = [];
    
    for (const pattern of SCALE_PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match[1]) {
          results.push({
            value: match[1],
            confidence: 0.9,
            source: 'pattern_match'
          });
        }
      }
    }

    return this.selectBestMatch(results);
  }

  extractDate(text) {
    const results = [];
    
    for (const pattern of DATE_PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] || match[0]) {
          results.push({
            value: match[1] || match[0],
            confidence: 0.8,
            source: 'pattern_match'
          });
        }
      }
    }

    return this.selectBestMatch(results);
  }

  extractDimensions(text) {
    const dimensions = [];
    
    for (const pattern of DIMENSION_PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      dimensions.push(...matches.map(m => m[0]));
    }

    return [...new Set(dimensions)]; // Remove duplicates
  }

  extractTolerances(text) {
    const tolerances = [];
    
    for (const pattern of TOLERANCE_PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      tolerances.push(...matches.map(m => m[0]));
    }

    return [...new Set(tolerances)];
  }

  extractStandards(text) {
    const standards = [];
    
    for (const pattern of STANDARD_PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      standards.push(...matches.map(m => m[0]));
    }

    return [...new Set(standards)];
  }

  extractSurfaceFinish(text) {
    const surface = [];
    
    for (const pattern of SURFACE_PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      surface.push(...matches.map(m => m[0]));
    }

    return [...new Set(surface)];
  }

  extractHeatTreatment(text) {
    const treatments = [];
    
    for (const pattern of HEAT_TREATMENT_PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      treatments.push(...matches.map(m => m[0]));
    }

    return [...new Set(treatments)];
  }

  extractByContext(text, contextWords) {
    const results = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      for (const contextWord of contextWords) {
        if (line.toUpperCase().includes(contextWord.toUpperCase())) {
          // Extract potential value from the same line
          const words = line.split(/\s+/);
          const contextIndex = words.findIndex(w => 
            w.toUpperCase().includes(contextWord.toUpperCase())
          );
          
          if (contextIndex >= 0 && contextIndex < words.length - 1) {
            const potentialValue = words.slice(contextIndex + 1).join(' ').trim();
            if (potentialValue.length > 2) {
              results.push({
                value: this.cleanExtractedText(potentialValue),
                confidence: 0.6
              });
            }
          }
        }
      }
    }
    
    return results;
  }

  cleanExtractedText(text) {
    return text
      .replace(/[^\w\sÇĞIİÖŞÜçğıiöşü\-_\.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  isValidPartName(name) {
    return name && 
           name.length >= 2 && 
           name.length <= 50 &&
           !/^\d+$/.test(name) && // Not just numbers
           !name.includes('***') && // No OCR artifacts
           !/^[^A-ZÇĞIİÖŞÜa-zçğıiöşü]*$/.test(name); // Contains letters
  }

  isValidMaterial(material) {
    return material && 
           material.length >= 2 && 
           material.length <= 30 &&
           (material.match(/[A-ZÇĞIİÖŞÜa-zçğıiöşü]/) || material.match(/\d/));
  }

  isValidProjectName(name) {
    return name && 
           name.length >= 3 && 
           name.length <= 100 &&
           !name.includes('***');
  }

  calculateTextConfidence(text, words = []) {
    if (!words.length) return 0.5;
    
    const textWords = text.toLowerCase().split(/\s+/);
    let totalConfidence = 0;
    let matchCount = 0;
    
    for (const textWord of textWords) {
      const ocrWord = words.find(w => 
        w.text.toLowerCase().includes(textWord) || 
        textWord.includes(w.text.toLowerCase())
      );
      
      if (ocrWord) {
        totalConfidence += ocrWord.confidence;
        matchCount++;
      }
    }
    
    return matchCount > 0 ? (totalConfidence / matchCount) / 100 : 0.3;
  }

  selectBestMatch(results) {
    if (!results.length) {
      return { value: null, confidence: 0 };
    }
    
    // Sort by confidence and select best
    const sorted = results.sort((a, b) => b.confidence - a.confidence);
    return sorted[0];
  }

  calculateConfidenceScores(analysis, words, lines) {
    return {
      overall: analysis.confidence,
      partName: analysis.partName.confidence || 0,
      material: analysis.material.confidence || 0,
      projectName: analysis.projectName.confidence || 0,
      drawingNumber: analysis.drawingNumber?.confidence || 0,
      revision: analysis.revision?.confidence || 0
    };
  }

  detectLanguages(text) {
    const turkish = /[çğıiöşüÇĞIİÖŞÜ]/.test(text);
    const english = /[a-zA-Z]/.test(text);
    
    const languages = [];
    if (turkish) languages.push('Turkish');
    if (english) languages.push('English');
    
    return languages.length ? languages : ['Unknown'];
  }

  findTechnicalTerms(text) {
    const found = [];
    const upperText = text.toUpperCase();
    
    [...this.technicalDictionary.turkishTerms, ...this.technicalDictionary.englishTerms]
      .forEach(term => {
        if (upperText.includes(term.toUpperCase())) {
          found.push(term);
        }
      });
    
    return [...new Set(found)];
  }

  // NEW METHODS FOR INTERACTIVE ANALYSIS

  getAllExtractedTexts(text, words = [], lines = []) {
    // Extract all meaningful text pieces from OCR result
    const allTexts = this.extractAllTextPieces(text, words);
    
    // Categorize the texts
    const categorized = this.categorizeTexts(allTexts);
    
    // Score potential part codes
    const candidates = this.scorePartCodeCandidates(categorized.mixed.concat(categorized.alphanumeric));
    
    return {
      candidates: candidates.slice(0, 20), // Top 20 candidates
      numbers: categorized.numbers.slice(0, 10),
      words: categorized.words.slice(0, 15),
      mixed: categorized.mixed.slice(0, 15),
      all: allTexts.length
    };
  }

  extractAllTextPieces(text, words = []) {
    const textPieces = [];
    
    // Method 1: Extract from OCR words with positions
    words.forEach((word, index) => {
      if (word.text && word.text.trim().length > 0) {
        textPieces.push({
          text: word.text.trim(),
          confidence: word.confidence || 0,
          position: word.bbox || null,
          source: 'ocr_word',
          index: index
        });
      }
    });
    
    // Method 2: Extract from lines (for multi-word combinations)
    const lines = text.split('\n');
    lines.forEach((line, lineIndex) => {
      const cleanLine = line.trim();
      if (cleanLine.length > 0 && cleanLine.length <= 50) {
        // Split line into word groups
        const wordGroups = cleanLine.split(/\s+/);
        wordGroups.forEach((group, groupIndex) => {
          if (group.length > 1 && group.length <= 20) {
            textPieces.push({
              text: group,
              confidence: this.estimateTextConfidence(group, words),
              position: null,
              source: 'line_extraction',
              index: `${lineIndex}_${groupIndex}`
            });
          }
        });
      }
    });
    
    // Method 3: Extract meaningful text patterns (alphanumeric combinations)
    const patterns = [
      /([A-Za-zÇĞIİÖŞÜçğıiöşü]+\d+[A-Za-zÇĞIİÖŞÜçğıiöşü\d]*)/g,
      /(\d+[A-Za-zÇĞIİÖŞÜçğıiöşü]+[A-Za-zÇĞIİÖŞÜçğıiöşü\d]*)/g,
      /([A-Za-zÇĞIİÖŞÜçğıiöşü]{2,}\-[A-Za-zÇĞIİÖŞÜçğıiöşü\d]{2,})/g,
      /([A-Za-zÇĞIİÖŞÜçğıiöşü]{2,}_[A-Za-zÇĞIİÖŞÜçğıiöşü\d]{2,})/g
    ];
    
    patterns.forEach((pattern, patternIndex) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach((match, matchIndex) => {
        if (match[1] && match[1].length > 2 && match[1].length <= 30) {
          textPieces.push({
            text: match[1],
            confidence: this.estimateTextConfidence(match[1], words),
            position: null,
            source: 'pattern_extraction',
            index: `pattern_${patternIndex}_${matchIndex}`
          });
        }
      });
    });
    
    // Remove duplicates and clean
    const uniqueTexts = this.removeDuplicateTexts(textPieces);
    
    return uniqueTexts;
  }

  categorizeTexts(textPieces) {
    const categories = {
      numbers: [],      // Only numbers
      words: [],        // Only letters  
      mixed: [],        // Mixed alphanumeric
      alphanumeric: [], // Clear alphanumeric codes
      special: []       // Special characters, symbols etc.
    };
    
    textPieces.forEach(piece => {
      const text = piece.text.trim();
      
      if (/^\d+$/.test(text)) {
        // Only numbers
        categories.numbers.push(piece);
      } else if (/^[A-Za-zÇĞIİÖŞÜçğıiöşü]+$/.test(text)) {
        // Only letters
        categories.words.push(piece);
      } else if (/^[A-Za-zÇĞIİÖŞÜçğıiöşü\d]+$/.test(text) && 
                 /[A-Za-zÇĞIİÖŞÜçğıiöşü]/.test(text) && 
                 /\d/.test(text)) {
        // Clear alphanumeric (letters + numbers, no spaces/special chars)
        categories.alphanumeric.push(piece);
      } else if (/[A-Za-zÇĞIİÖŞÜçğıiöşü\d]/.test(text)) {
        // Mixed content (contains letters/numbers plus other characters)
        categories.mixed.push(piece);
      } else {
        // Special characters, symbols
        categories.special.push(piece);
      }
    });
    
    return categories;
  }

  scorePartCodeCandidates(candidates) {
    return candidates.map(candidate => {
      const text = candidate.text;
      let score = 0;
      
      // Length score (3-20 characters optimal for part codes)
      if (text.length >= 3 && text.length <= 20) {
        if (text.length >= 4 && text.length <= 12) {
          score += 0.3; // Optimal length
        } else {
          score += 0.2; // Good length
        }
      } else if (text.length < 3) {
        score -= 0.2; // Too short
      }
      
      // Character diversity score
      const hasLetters = /[A-Za-zÇĞIİÖŞÜçğıiöşü]/.test(text);
      const hasNumbers = /\d/.test(text);
      const hasSpecial = /[\-_\.]/.test(text);
      
      if (hasLetters && hasNumbers) {
        score += 0.4; // Letter+number combination is good for part codes
      }
      if (hasSpecial && (hasLetters || hasNumbers)) {
        score += 0.1; // Special chars with alphanumeric
      }
      
      // OCR confidence score
      score += (candidate.confidence / 100) * 0.2;
      
      // Pattern bonus (common part code patterns)
      if (/^[A-Z]{1,4}\d{2,6}$/i.test(text)) {
        score += 0.3; // ABC123 pattern
      }
      if (/^\d{3,6}[A-Z]{1,3}$/i.test(text)) {
        score += 0.25; // 12345A pattern  
      }
      if (/^[A-Z\d]{2,4}[\-_][A-Z\d]{2,4}$/i.test(text)) {
        score += 0.2; // ABC-123 pattern
      }
      
      // Technical term proximity bonus
      const textLower = text.toLowerCase();
      if (this.technicalDictionary.partTypes.some(type => 
          textLower.includes(type.toLowerCase()) || 
          type.toLowerCase().includes(textLower)
      )) {
        score += 0.1;
      }
      
      // Penalty for common non-part-code patterns
      if (/^(drawing|çizim|scale|ölçek|date|tarih)$/i.test(text)) {
        score -= 0.3;
      }
      if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(text)) {
        score -= 0.2; // Date pattern
      }
      
      return {
        ...candidate,
        partCodeScore: Math.max(0, Math.min(1, score)), // Clamp between 0-1
        category: this.determineTextCategory(text)
      };
    }).sort((a, b) => b.partCodeScore - a.partCodeScore);
  }

  determineTextCategory(text) {
    if (/^\d+$/.test(text)) return 'number';
    if (/^[A-Za-zÇĞIİÖŞÜçğıiöşü]+$/.test(text)) return 'word';
    if (/^[A-Za-zÇĞIİÖŞÜçğıiöşü\d]+$/.test(text)) return 'alphanumeric';
    return 'mixed';
  }

  estimateTextConfidence(text, words = []) {
    if (!words.length) return 0.5;
    
    // Find matching OCR words
    const matches = words.filter(word => 
      word.text.toLowerCase().includes(text.toLowerCase()) ||
      text.toLowerCase().includes(word.text.toLowerCase())
    );
    
    if (matches.length > 0) {
      return matches.reduce((sum, word) => sum + word.confidence, 0) / matches.length / 100;
    }
    
    return 0.3; // Default confidence for pattern-extracted texts
  }

  removeDuplicateTexts(textPieces) {
    const seen = new Set();
    const unique = [];
    
    // Sort by confidence first
    const sorted = textPieces.sort((a, b) => b.confidence - a.confidence);
    
    sorted.forEach(piece => {
      const normalizedText = piece.text.toLowerCase().trim();
      if (!seen.has(normalizedText) && normalizedText.length > 0) {
        seen.add(normalizedText);
        unique.push({
          ...piece,
          text: piece.text.trim() // Keep original case but trimmed
        });
      }
    });
    
    return unique;
  }
}

module.exports = TextAnalyzer; 