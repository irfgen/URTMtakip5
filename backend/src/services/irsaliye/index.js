/**
 * İrsaliye Analysis Services Index
 * Hibrit irsaliye analizi servisleri
 */

const IrsaliyeParserService = require('./IrsaliyeParserService');
const AIAnalyzerService = require('./AIAnalyzerService');
const HybridAnalysisService = require('./HybridAnalysisService');
const StokKartiMatcherService = require('./StokKartiMatcherService');

// Service exports
module.exports = {
  // Individual services
  IrsaliyeParserService,
  AIAnalyzerService,
  HybridAnalysisService,
  StokKartiMatcherService,

  // Convenience factory for creating service instances
  createParser: () => new IrsaliyeParserService(),
  createAIAnalyzer: () => new AIAnalyzerService(),
  createHybridAnalyzer: () => new HybridAnalysisService(),
  createMatcher: () => new StokKartiMatcherService(),

  // Main entry point (recommended)
  analyzeIrsaliye: async (imageBuffer, options = {}) => {
    const hybridAnalyzer = new HybridAnalysisService();
    try {
      const result = await hybridAnalyzer.analyze(imageBuffer, options);
      return result;
    } finally {
      await hybridAnalyzer.terminate();
    }
  },

  // Health check
  healthCheck: async () => {
    const hybridAnalyzer = new HybridAnalysisService();
    const health = await hybridAnalyzer.healthCheck();
    await hybridAnalyzer.terminate();
    return health;
  },

  // Get metrics
  getMetrics: async () => {
    const hybridAnalyzer = new HybridAnalysisService();
    const metrics = hybridAnalyzer.getMetrics();
    await hybridAnalyzer.terminate();
    return metrics;
  }
};
