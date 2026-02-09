/**
 * HybridAnalysisService - Intelligent router for invoice analysis
 * Hibrit yaklaşım: Rule-based + AI analyzer seçimi
 */
const IrsaliyeParserService = require('./IrsaliyeParserService');
const AIAnalyzerService = require('./AIAnalyzerService');
const StokKartiMatcherService = require('./StokKartiMatcherService');

class HybridAnalysisService {
  constructor() {
    this.parserService = new IrsaliyeParserService();
    this.aiService = new AIAnalyzerService();
    this.matcherService = new StokKartiMatcherService();

    // Configuration from environment
    this.complexityThreshold = parseFloat(process.env.HYBRID_COMPLEXITY_THRESHOLD) || 0.5;
    this.forceAI = process.env.FORCE_AI_ANALYSIS === 'true';
    this.enableAI = process.env.ENABLE_AI_ANALYSIS !== 'false'; // Default: true

    // Analysis metrics
    this.metrics = {
      totalAnalyses: 0,
      ruleBasedCount: 0,
      aiBasedCount: 0,
      fallbackCount: 0,
      avgProcessingTime: 0
    };
  }

  /**
   * Main entry point - analyzes document using hybrid approach
   * @param {Buffer} imageBuffer - Document image buffer
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analyzed irsaliye data
   */
  async analyze(imageBuffer, options = {}) {
    const startTime = Date.now();
    this.metrics.totalAnalyses++;

    try {
      // Step 1: Load context (stok kartlari, tedarikciler)
      const context = options.context || await this.loadContext();

      // Step 2: Determine analysis strategy
      const strategy = this.determineStrategy(options);

      // Step 3: Execute analysis based on strategy
      let result;
      switch (strategy) {
        case 'rule_based':
          result = await this.analyzeWithRules(imageBuffer, context);
          this.metrics.ruleBasedCount++;
          break;

        case 'ai_based':
          result = await this.analyzeWithAI(imageBuffer, context);
          this.metrics.aiBasedCount++;
          break;

        case 'hybrid':
          result = await this.analyzeHybrid(imageBuffer, context);
          break;

        default:
          throw new Error(`Bilinmeyen strateji: ${strategy}`);
      }

      // Step 4: Match with stock cards
      if (context.stokKartlari?.length > 0) {
        result = await this.matcherService.matchKalemler(result, context.stokKartlari);
      }

      // Step 5: Final validation and enrichment
      result = await this.enrichResult(result, context);

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.updateProcessingTimeMetric(processingTime);
      result.processingTime = processingTime;
      result.strategy = strategy;

      return result;
    } catch (error) {
      // Fallback to rule-based if AI fails
      if (options.strategy === 'ai_based') {
        console.warn('AI analizi başarısız, rule-based fallback:', error.message);
        this.metrics.fallbackCount++;
        return await this.analyzeWithRules(imageBuffer, await this.loadContext());
      }
      throw error;
    }
  }

  /**
   * Determine which analysis strategy to use
   */
  determineStrategy(options = {}) {
    // Explicit strategy from options
    if (options.strategy) {
      if (!['rule_based', 'ai_based', 'hybrid'].includes(options.strategy)) {
        throw new Error(`Geçersiz strateji: ${options.strategy}`);
      }
      return options.strategy;
    }

    // Force AI if configured
    if (this.forceAI && this.enableAI && this.aiService.isConfigured()) {
      return 'ai_based';
    }

    // AI disabled
    if (!this.enableAI || !this.aiService.isConfigured()) {
      return 'rule_based';
    }

    // Default: hybrid approach
    return 'hybrid';
  }

  /**
   * Analyze using rule-based parser
   */
  async analyzeWithRules(imageBuffer, context) {
    const result = await this.parserService.parseDocument(imageBuffer);

    return {
      ...result,
      metadata: {
        ...result.metadata,
        analysisMethod: 'rule_based'
      }
    };
  }

  /**
   * Analyze using AI
   */
  async analyzeWithAI(imageBuffer, context) {
    if (!this.aiService.isConfigured()) {
      throw new Error('AI servisi yapılandırılmadı');
    }

    // DEBUG: Log image info before AI analysis
    const crypto = require('crypto');
    const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
    console.log('[DEBUG HYBRID] analyzeWithAI called:', {
      imageSize: imageBuffer.length,
      imageHash: imageHash.substring(0, 16),
      contextKeys: context ? Object.keys(context) : []
    });

    const result = await this.aiService.analyzeDocument(imageBuffer, context);

    console.log('[DEBUG HYBRID] AI result:', {
      irsaliyeNo: result.irsaliyeNo,
      kalemCount: result.kalemler?.length,
      kalemler: result.kalemler?.map(k => k.malHizmetAdi)
    });

    return {
      ...result,
      metadata: {
        ...result.metadata,
        analysisMethod: 'ai_based'
      }
    };
  }

  /**
   * Analyze using hybrid approach
   * First try rule-based, then use AI if complexity is high
   */
  async analyzeHybrid(imageBuffer, context) {
    // Step 1: Quick rule-based analysis
    const ruleBasedResult = await this.parserService.parseDocument(imageBuffer);

    // Step 2: Check complexity
    const complexityScore = ruleBasedResult.complexityScore || 0;

    // Step 3: Decide if AI is needed
    if (complexityScore > this.complexityThreshold) {
      console.log(`Yüksek karmaşıklık (${complexityScore.toFixed(2)}), AI analizi kullanılıyor`);

      // Check if AI is available
      if (this.enableAI && this.aiService.isConfigured()) {
        try {
          const aiResult = await this.aiService.analyzeDocument(imageBuffer, context);

          // Merge results (AI takes precedence)
          return this.mergeResults(ruleBasedResult, aiResult, 'ai_preferred');
        } catch (error) {
          console.warn('AI analizi başarısız, rule-based sonuç kullanılıyor:', error.message);
          this.metrics.fallbackCount++;
          return ruleBasedResult;
        }
      }
    }

    // Low complexity or AI unavailable - use rule-based
    console.log(`Düşük karmaşıklık (${complexityScore.toFixed(2)}), rule-based sonuç kullanılıyor`);
    return ruleBasedResult;
  }

  /**
   * Merge results from two analysis methods
   */
  mergeResults(ruleBased, aiResult, preference) {
    const merged = {
      irsaliyeNo: aiResult.irsaliyeNo || ruleBased.irsaliyeNo,
      tedarikci: aiResult.tedarikci || ruleBased.tedarikci,
      tarih: aiResult.tarih || ruleBased.tarih,
      kalemler: this.mergeKalemler(ruleBased.kalemler || [], aiResult.kalemler || [], preference),
      toplamTutar: aiResult.toplamTutar || ruleBased.toplamTutar,
      complexityScore: ruleBased.complexityScore,
      metadata: {
        parseMethod: 'hybrid_merged',
        ruleBasedConfidence: ruleBased.metadata?.ocrConfidence || 0,
        aiConfidence: aiResult.confidence || 0,
        preference: preference,
        aiModel: aiResult.metadata?.model,
        aiProvider: aiResult.metadata?.provider
      }
    };

    return merged;
  }

  /**
   * Merge kalemler from two results
   */
  mergeKalemler(ruleBasedKalemler, aiKalemler, preference) {
    if (preference === 'ai_preferred') {
      // Use AI items, add rule-based items not in AI
      const merged = [...aiKalemler];

      for (const rbKalem of ruleBasedKalemler) {
        const exists = aiKalemler.some(ai => {
          return ai.malHizmetAdi?.toLowerCase() === rbKalem.malHizmetAdi?.toLowerCase() ||
                 ai.stokKodu?.toLowerCase() === rbKalem.stokKodu?.toLowerCase();
        });

        if (!exists && rbKalem.confidence > 0.5) {
          merged.push(rbKalem);
        }
      }

      return merged;
    }

    // Default: return all items with deduplication
    const allKalemler = [...ruleBasedKalemler, ...aiKalemler];
    return this.deduplicateKalemler(allKalemler);
  }

  /**
   * Remove duplicate kalemler
   */
  deduplicateKalemler(kalemler) {
    const seen = new Set();
    const unique = [];

    for (const kalem of kalemler) {
      const key = `${kalem.stokKodu || ''}-${kalem.malHizmetAdi || ''}-${kalem.miktar || ''}`.toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(kalem);
      } else {
        // Update existing with higher confidence
        const existing = unique.find(u => {
          const ek = `${u.stokKodu || ''}-${u.malHizmetAdi || ''}-${u.miktar || ''}`.toLowerCase();
          return ek === key;
        });
        if (existing && kalem.confidence > existing.confidence) {
          Object.assign(existing, kalem);
        }
      }
    }

    return unique;
  }

  /**
   * Load context data from database
   */
  async loadContext() {
    // This will be implemented to load from database
    // For now, return empty context
    try {
      const { StokKarti } = require('../../models');
      const { Firma } = require('../../models');

      const stokKartlari = await StokKarti.findAll({
        attributes: ['id', 'stok_kodu', 'stok_adi'],
        limit: 100,
        order: [['updated_at', 'DESC']]
      });

      const tedarikciler = await Firma.findAll({
        attributes: ['id', 'firma_adi'],
        where: { firma_tipi: 'tedarikci' },
        limit: 50
      });

      return {
        stokKartlari: stokKartlari.map(sk => sk.toJSON()),
        tedarikciler: tedarikciler.map(t => t.toJSON())
      };
    } catch (error) {
      console.warn('Context yüklenemedi, boş context kullanılıyor:', error.message);
      return { stokKartlari: [], tedarikciler: [] };
    }
  }

  /**
   * Enrich result with additional data
   */
  async enrichResult(result, context) {
    // Add analysis metadata
    result.metadata = result.metadata || {};
    result.metadata.enrichedAt = new Date().toISOString();
    result.metadata.kalemCount = result.kalemler?.length || 0;
    result.metadata.hasToplamTutar = !!result.toplamTutar;

    // Validate result
    result.validation = this.validateResult(result);

    return result;
  }

  /**
   * Validate analysis result
   */
  validateResult(result) {
    const validation = {
      isValid: true,
      warnings: [],
      errors: []
    };

    // Check required fields
    if (!result.irsaliyeNo?.value && !result.irsaliyeNo) {
      validation.warnings.push('İrsaliye numarası bulunamadı');
    }

    if (!result.tedarikci?.value && !result.tedarikci) {
      validation.warnings.push('Tedarikçi bulunamadı');
    }

    if (!result.tarih?.value && !result.tarih) {
      validation.warnings.push('Tarih bulunamadı');
    }

    // Check kalemler
    if (!result.kalemler || result.kalemler.length === 0) {
      validation.errors.push('Kalem bulunamadı');
      validation.isValid = false;
    } else {
      // Check for low confidence items
      const lowConfidenceItems = result.kalemler.filter(k => (k.confidence || 0) < 0.5);
      if (lowConfidenceItems.length > 0) {
        validation.warnings.push(`${lowConfidenceItems.length} kalem düşük güvenilirlikta`);
      }
    }

    return validation;
  }

  /**
   * Update processing time metric
   */
  updateProcessingTimeMetric(time) {
    const count = this.metrics.totalAnalyses;
    this.metrics.avgProcessingTime =
      ((this.metrics.avgProcessingTime * (count - 1)) + time) / count;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      ruleBasedRate: this.metrics.totalAnalyses > 0
        ? this.metrics.ruleBasedCount / this.metrics.totalAnalyses
        : 0,
      aiBasedRate: this.metrics.totalAnalyses > 0
        ? this.metrics.aiBasedCount / this.metrics.totalAnalyses
        : 0,
      fallbackRate: this.metrics.totalAnalyses > 0
        ? this.metrics.fallbackCount / this.metrics.totalAnalyses
        : 0
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalAnalyses: 0,
      ruleBasedCount: 0,
      aiBasedCount: 0,
      fallbackCount: 0,
      avgProcessingTime: 0
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      components: {
        parserService: 'ok',
        aiService: this.aiService.isConfigured() ? 'configured' : 'not_configured',
        matcherService: 'ok'
      },
      metrics: this.getMetrics()
    };

    if (!this.aiService.isConfigured() && this.enableAI) {
      health.status = 'degraded';
      health.warnings = ['AI servisi yapılandırılmadı, sadece rule-based analiz çalışacak'];
    }

    return health;
  }

  /**
   * Cleanup
   */
  async terminate() {
    await this.parserService.terminate();
  }
}

module.exports = HybridAnalysisService;
