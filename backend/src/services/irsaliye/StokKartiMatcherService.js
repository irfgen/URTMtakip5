/**
 * StokKartiMatcherService - Stock card matching and validation
 * Çıkarılan ürünleri mevcut stok kartlarıyla eşleştirme
 */
class StokKartiMatcherService {
  constructor() {
    // Matching thresholds
    this.exactMatchThreshold = 1.0;
    this.highSimilarityThreshold = 0.85;
    this.mediumSimilarityThreshold = 0.70;
    this.lowSimilarityThreshold = 0.50;

    // Weight factors for scoring
    this.weights = {
      stokKoduMatch: 0.5,
      nameSimilarity: 0.3,
      normalizedCode: 0.15,
      context: 0.05
    };

    // Turkish character normalization map
    this.charMap = {
      'Ç': 'C', 'Ğ': 'G', 'I': 'I', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U',
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'i': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u'
    };
  }

  /**
   * Match all kalemler with stock cards
   * @param {Object} result - Analysis result with kalemler
   * @param {Array} stokKartlari - Stock cards from database
   * @returns {Promise<Object>} Result with matched kalemler
   */
  async matchKalemler(result, stokKartlari) {
    if (!result.kalemler || result.kalemler.length === 0) {
      return result;
    }

    if (!stokKartlari || stokKartlari.length === 0) {
      console.warn('Stok kartı bulunamadı, eşleştirme yapılamıyor');
      return result;
    }

    const matchedKalemler = [];
    const unmatchedKalemler = [];
    const matchesSummary = {
      exactMatches: 0,
      highConfidenceMatches: 0,
      mediumConfidenceMatches: 0,
      lowConfidenceMatches: 0,
      noMatches: 0
    };

    // Match each kalem
    for (const kalem of result.kalemler) {
      const match = await this.findBestMatch(kalem, stokKartlari);

      if (match) {
        const matchedKalem = {
          ...kalem,
          eslenenStokKartiId: match.stokKarti.id,
          eslenenStokKodu: match.stokKarti.stok_kodu,
          eslenenStokAdi: match.stokKarti.stok_adi,
          matchScore: match.score,
          matchConfidence: match.confidence,
          matchReason: match.reason
        };

        matchedKalemler.push(matchedKalem);

        // Update summary
        if (match.confidence === 'exact') matchesSummary.exactMatches++;
        else if (match.confidence === 'high') matchesSummary.highConfidenceMatches++;
        else if (match.confidence === 'medium') matchesSummary.mediumConfidenceMatches++;
        else matchesSummary.lowConfidenceMatches++;
      } else {
        unmatchedKalemler.push(kalem);
        matchesSummary.noMatches++;
      }
    }

    return {
      ...result,
      kalemler: matchedKalemler,
      eslesmeyenKalemler: unmatchedKalemler,
      eslesmeOzeti: matchesSummary
    };
  }

  /**
   * Find best matching stock card for a kalem
   */
  async findBestMatch(kalem, stokKartlari) {
    let bestMatch = null;
    let bestScore = 0;

    // Strategy 1: Exact stok kodu match (highest priority)
    if (kalem.stokKodu) {
      const exactMatch = stokKartlari.find(sk => {
        return this.normalizeCode(sk.stok_kodu) === this.normalizeCode(kalem.stokKodu);
      });

      if (exactMatch) {
        return {
          stokKarti: exactMatch,
          score: 1.0,
          confidence: 'exact',
          reason: 'stok_kodu_exact_match'
        };
      }
    }

    // Strategy 2: Similarity-based matching for name
    if (kalem.malHizmetAdi) {
      for (const stokKarti of stokKartlari) {
        const score = this.calculateMatchScore(kalem, stokKarti);

        if (score > bestScore && score >= this.lowSimilarityThreshold) {
          bestScore = score;
          bestMatch = {
            stokKarti: stokKarti,
            score: score,
            confidence: this.getConfidenceLevel(score),
            reason: 'name_similarity'
          };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Calculate match score between kalem and stok kartı
   */
  calculateMatchScore(kalem, stokKarti) {
    let score = 0;
    let factors = 0;

    // Factor 1: Stock code similarity (if available)
    if (kalem.stokKodu && stokKarti.stok_kodu) {
      const codeSimilarity = this.calculateCodeSimilarity(
        kalem.stokKodu,
        stokKarti.stok_kodu
      );
      score += codeSimilarity * this.weights.stokKoduMatch;
      factors += this.weights.stokKoduMatch;
    }

    // Factor 2: Name similarity
    if (kalem.malHizmetAdi && stokKarti.stok_adi) {
      const nameSimilarity = this.calculateNameSimilarity(
        kalem.malHizmetAdi,
        stokKarti.stok_adi
      );
      score += nameSimilarity * this.weights.nameSimilarity;
      factors += this.weights.nameSimilarity;
    }

    // Factor 3: Normalized code matching
    if (kalem.stokKodu && stokKarti.stok_kodu) {
      const normalizedMatch = this.normalizedCodeMatch(
        kalem.stokKodu,
        stokKarti.stok_kodu
      );
      score += normalizedMatch * this.weights.normalizedCode;
      factors += this.weights.normalizedCode;
    }

    // Factor 4: Contextual matching (keywords, etc.)
    const contextScore = this.calculateContextScore(kalem, stokKarti);
    score += contextScore * this.weights.context;
    factors += this.weights.context;

    // Normalize score
    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate name similarity using multiple methods
   */
  calculateNameSimilarity(name1, name2) {
    // Normalize names
    const norm1 = this.normalizeText(name1);
    const norm2 = this.normalizeText(name2);

    // Method 1: Direct string similarity
    let similarity = 0;

    try {
      // Use simple similarity if stringsimilarity is not available
      similarity = this.levenshteinSimilarity(norm1, norm2);
    } catch (error) {
      similarity = this.simpleSimilarity(norm1, norm2);
    }

    // Method 2: Word-level similarity
    const words1 = norm1.split(/\s+/);
    const words2 = norm2.split(/\s+/);
    const wordSimilarity = this.wordSetSimilarity(words1, words2);

    // Method 3: Contains check
    const containsBonus = (
      norm1.includes(norm2) || norm2.includes(norm1) ||
      words1.some(w => w.length > 3 && norm2.includes(w)) ||
      words2.some(w => w.length > 3 && norm1.includes(w))
    ) ? 0.1 : 0;

    return Math.min(1, similarity * 0.6 + wordSimilarity * 0.3 + containsBonus);
  }

  /**
   * Calculate code similarity
   */
  calculateCodeSimilarity(code1, code2) {
    const norm1 = this.normalizeCode(code1);
    const norm2 = this.normalizeCode(code2);

    if (norm1 === norm2) return 1.0;
    if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.9;

    return this.levenshteinSimilarity(norm1, norm2);
  }

  /**
   * Check normalized code match (ignoring special chars, etc.)
   */
  normalizedCodeMatch(code1, code2) {
    const norm1 = this.normalizeCode(code1);
    const norm2 = this.normalizeCode(code2);

    // Remove all non-alphanumeric chars
    const clean1 = norm1.replace(/[^a-z0-9]/gi, '');
    const clean2 = norm2.replace(/[^a-z0-9]/gi, '');

    if (clean1 === clean2 && clean1.length > 0) return 1.0;

    return 0;
  }

  /**
   * Calculate contextual score
   */
  calculateContextScore(kalem, stokKarti) {
    let score = 0;

    // Common material keywords
    const materialKeywords = [
      'plak', 'çelik', 'alüminyum', 'pirinç', 'bronz',
      'steel', 'aluminum', 'brass', 'plate'
    ];

    const kalemLower = (kalem.malHizmetAdi || '').toLowerCase();
    const stokLower = (stokKarti.stok_adi || '').toLowerCase();

    // Check for shared material keywords
    const sharedKeywords = materialKeywords.filter(kw =>
      kalemLower.includes(kw) && stokLower.includes(kw)
    );

    if (sharedKeywords.length > 0) {
      score += 0.2;
    }

    // Dimension pattern matching (e.g., "5mm", "10x20")
    const dimensionPattern = /\d+(\.\d+)?\s*(mm|x|\/)/;
    const kalemDimensions = kalemLower.match(dimensionPattern);
    const stokDimensions = stokLower.match(dimensionPattern);

    if (kalemDimensions && stokDimensions && kalemDimensions[0] === stokDimensions[0]) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Word set similarity
   */
  wordSetSimilarity(words1, words2) {
    if (words1.length === 0 || words2.length === 0) return 0;

    const set1 = new Set(words1.filter(w => w.length > 2));
    const set2 = new Set(words2.filter(w => w.length > 2));

    if (set1.size === 0 || set2.size === 0) return 0;

    // Jaccard similarity
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Levenshtein-based similarity
   */
  levenshteinSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return 1 - matrix[len1][len2] / maxLen;
  }

  /**
   * Simple similarity (fallback)
   */
  simpleSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);

    if (maxLen === 0) return 1;

    // Count matching characters
    let matches = 0;
    const minLen = Math.min(len1, len2);

    for (let i = 0; i < minLen; i++) {
      if (str1[i] === str2[i]) matches++;
    }

    return matches / maxLen;
  }

  /**
   * Normalize text for comparison
   */
  normalizeText(text) {
    if (!text) return '';

    return String(text)
      .toLowerCase()
      .replace(/[çğıöşü]/g, c => this.charMap[c] || c)
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize stock code
   */
  normalizeCode(code) {
    if (!code) return '';

    return String(code)
      .toUpperCase()
      .replace(/[ÇĞIİÖŞÜ]/g, c => this.charMap[c] || c)
      .replace(/[^A-Z0-9]/g, '')
      .trim();
  }

  /**
   * Get confidence level from score
   */
  getConfidenceLevel(score) {
    if (score >= this.highSimilarityThreshold) return 'high';
    if (score >= this.mediumSimilarityThreshold) return 'medium';
    return 'low';
  }

  /**
   * Suggest new stock card creation for unmatched items
   */
  suggestNewStockCards(unmatchedKalemler) {
    return unmatchedKalemler.map(kalem => ({
      stok_kodu: kalem.stokKodu || this.generateSuggestedCode(kalem),
      stok_adi: kalem.malHizmetAdi,
      birim: kalem.birim || 'adet',
      kaynak: 'irsaliye_analizi',
      onerilen: true
    }));
  }

  /**
   * Generate suggested stock code
   */
  generateSuggestedCode(kalem) {
    // Extract initials from name
    const words = (kalem.malHizmetAdi || '').split(/\s+/);
    const initials = words
      .filter(w => w.length > 0)
      .slice(0, 3)
      .map(w => w[0].toUpperCase())
      .join('');

    // Add random number
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');

    return `${initials}${random}`;
  }
}

module.exports = StokKartiMatcherService;
