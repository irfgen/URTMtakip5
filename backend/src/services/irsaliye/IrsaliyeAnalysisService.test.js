/**
 * İrsaliye Analysis Service - Test & Health Check Endpoint
 * Test için kullanılan basit test servisi
 */

const HybridAnalysisService = require('./HybridAnalysisService');

class IrsaliyeAnalysisService {
  /**
   * Health check for the hybrid analysis service
   */
  static async healthCheck() {
    const service = new HybridAnalysisService();
    try {
      const health = await service.healthCheck();
      await service.terminate();
      return health;
    } catch (error) {
      await service.terminate();
      throw error;
    }
  }

  /**
   * Get analysis metrics
   */
  static async getMetrics() {
    const service = new HybridAnalysisService();
    try {
      const metrics = service.getMetrics();
      await service.terminate();
      return metrics;
    } catch (error) {
      await service.terminate();
      throw error;
    }
  }

  /**
   * Test with a sample base64 image (small test image)
   */
  static async testAnalysis() {
    const service = new HybridAnalysisService();

    try {
      // Create a minimal test image (1x1 transparent PNG in base64)
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const imageBuffer = Buffer.from(testImageBase64, 'base64');

      // Run test analysis
      const result = await service.analyze(imageBuffer, {
        strategy: 'rule_based'
      });

      await service.terminate();

      return {
        success: true,
        message: 'Test analysis completed',
        result: {
          parseMethod: result.metadata?.parseMethod,
          strategy: result.strategy,
          processingTime: result.processingTime,
          complexityScore: result.complexityScore
        }
      };
    } catch (error) {
      await service.terminate();
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze an irsaliye document (main entry point)
   */
  static async analyze(imageBuffer, options = {}) {
    return HybridAnalysisService.analyze(imageBuffer, options);
  }
}

module.exports = IrsaliyeAnalysisService;
