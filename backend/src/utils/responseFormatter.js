class ResponseFormatter {
  static success(data, message = 'İşlem başarılı') {
    return {
      success: true,
      message,
      timestamp: new Date().toISOString(),
      data
    };
  }

  static error(error, statusCode = 500) {
    const response = {
      success: false,
      timestamp: new Date().toISOString(),
      error: {
        code: error.code || error.name || 'UNKNOWN_ERROR',
        message: error.message || 'Bilinmeyen bir hata oluştu',
        details: error.details || null
      }
    };

    if (process.env.NODE_ENV === 'development' && error.stack) {
      response.error.stack = error.stack;
    }

    return response;
  }

  static analysisResult(analysisData, imageData, processingMetadata) {
    const {
      partName,
      material,
      projectName,
      drawingNumber,
      revision,
      scale,
      date,
      dimensions,
      tolerances,
      standards,
      surfaceFinish,
      heatTreatment,
      confidence,
      metadata
    } = analysisData;

    return this.success({
      // Main extracted data
      parca_kodu: partName?.value || null,
      material: material?.value || null,
      projectName: projectName?.value || null,
      drawingNumber: drawingNumber?.value || null,
      revision: revision?.value || null,
      scale: scale?.value || null,
      date: date?.value || null,
      
      // Technical specifications
      dimensions: dimensions || [],
      tolerances: tolerances || [],
      standards: standards || [],
      surfaceFinish: surfaceFinish || [],
      heatTreatment: heatTreatment || [],
      
      // Processed image
      processedImage: imageData.base64Image,
      
      // Confidence scores
      confidence: {
        overall: Math.round(confidence.overall * 100) / 100,
        parca_kodu: Math.round(confidence.partName * 100) / 100,
        material: Math.round(confidence.material * 100) / 100,
        projectName: Math.round(confidence.projectName * 100) / 100,
        drawingNumber: Math.round(confidence.drawingNumber * 100) / 100,
        revision: Math.round(confidence.revision * 100) / 100
      },
      
      // Processing metadata
      metadata: {
        originalFormat: processingMetadata.originalFormat,
        processedFormat: processingMetadata.processedFormat,
        originalSize: this.formatFileSize(processingMetadata.originalSize),
        processedSize: this.formatFileSize(processingMetadata.processedSize),
        compressionRatio: processingMetadata.compressionRatio,
        dimensions: `${imageData.metadata.width}x${imageData.metadata.height}`,
        processingTime: `${processingMetadata.processingTime}ms`,
        ocrProcessingTime: `${metadata.ocrProcessingTime || 0}ms`,
        totalWords: metadata.totalWords,
        highConfidenceWords: metadata.highConfidenceWords,
        detectedLanguages: metadata.detectedLanguages,
        technicalTermsFound: metadata.technicalTermsFound?.length || 0
      },
      
      // Additional info for debugging (development only)
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          allMatches: {
            partName: partName,
            material: material,
            projectName: projectName,
            drawingNumber: drawingNumber,
            revision: revision
          },
          technicalTermsFound: metadata.technicalTermsFound
        }
      })
    }, 'Teknik resim başarıyla analiz edildi');
  }

  static interactiveAnalysisResult(interactiveAnalysisData, imageData, processingMetadata) {
    const {
      partName,
      material,
      projectName,
      drawingNumber,
      revision,
      scale,
      date,
      dimensions,
      tolerances,
      standards,
      surfaceFinish,
      heatTreatment,
      confidence,
      metadata,
      extractedTexts
    } = interactiveAnalysisData;

    return this.success({
      // Standard analysis results
      automaticResults: {
        parca_kodu: partName?.value || null,
        material: material?.value || null,
        projectName: projectName?.value || null,
        drawingNumber: drawingNumber?.value || null,
        revision: revision?.value || null,
        scale: scale?.value || null,
        date: date?.value || null,
        
        // Technical specifications
        dimensions: dimensions || [],
        tolerances: tolerances || [],
        standards: standards || [],
        surfaceFinish: surfaceFinish || [],
        heatTreatment: heatTreatment || [],
        
        // Confidence scores
        confidence: {
          overall: Math.round(confidence.overall * 100) / 100,
          parca_kodu: Math.round(confidence.partName * 100) / 100,
          material: Math.round(confidence.material * 100) / 100,
          projectName: Math.round(confidence.projectName * 100) / 100,
          drawingNumber: Math.round(confidence.drawingNumber * 100) / 100,
          revision: Math.round(confidence.revision * 100) / 100
        }
      },
      
      // Interactive text selection data
      extractedTexts: {
        candidates: extractedTexts.candidates.map(candidate => ({
          text: candidate.text,
          confidence: Math.round(candidate.confidence * 100) / 100,
          partCodeScore: Math.round(candidate.partCodeScore * 100) / 100,
          category: candidate.category,
          source: candidate.source,
          position: candidate.position
        })),
        numbers: extractedTexts.numbers.map(num => ({
          text: num.text,
          confidence: Math.round(num.confidence * 100) / 100,
          source: num.source
        })),
        words: extractedTexts.words.map(word => ({
          text: word.text,
          confidence: Math.round(word.confidence * 100) / 100,
          source: word.source
        })),
        mixed: extractedTexts.mixed.map(mixed => ({
          text: mixed.text,
          confidence: Math.round(mixed.confidence * 100) / 100,
          source: mixed.source
        })),
        totalTextsFound: extractedTexts.all
      },
      
      // Processed image
      processedImage: imageData.base64Image,
      
      // Processing metadata
      metadata: {
        originalFormat: processingMetadata.originalFormat,
        processedFormat: processingMetadata.processedFormat,
        originalSize: this.formatFileSize(processingMetadata.originalSize),
        processedSize: this.formatFileSize(processingMetadata.processedSize),
        compressionRatio: processingMetadata.compressionRatio,
        dimensions: `${imageData.metadata.width}x${imageData.metadata.height}`,
        processingTime: `${processingMetadata.processingTime}ms`,
        ocrProcessingTime: `${metadata.ocrProcessingTime || 0}ms`,
        totalWords: metadata.totalWords,
        highConfidenceWords: metadata.highConfidenceWords,
        detectedLanguages: metadata.detectedLanguages,
        technicalTermsFound: metadata.technicalTermsFound?.length || 0
      },
      
      // Additional info for debugging (development only)
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          allCategories: {
            candidates: extractedTexts.candidates.length,
            numbers: extractedTexts.numbers.length,
            words: extractedTexts.words.length,
            mixed: extractedTexts.mixed.length,
            total: extractedTexts.all
          },
          automaticMatches: {
            partName: partName,
            material: material,
            projectName: projectName,
            drawingNumber: drawingNumber,
            revision: revision
          },
          technicalTermsFound: metadata.technicalTermsFound
        }
      })
    }, 'Interactive teknik resim analizi başarıyla tamamlandı');
  }

  static healthCheck() {
    return this.success({
      service: 'TRSMParse API',
      version: '1.0.0',
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    }, 'Servis çalışıyor');
  }

  static testResponse() {
    return this.success({
      message: 'TRSMParse API test endpoint çalışıyor',
      endpoints: [
        'POST /api/teknik-resim/analiz - Ana analiz endpoint\'i',
        'GET /api/teknik-resim/test - Test endpoint\'i',
        'GET /health - Sağlık kontrolü'
      ],
      exampleRequest: {
        url: '/api/teknik-resim/analiz',
        method: 'POST',
        contentType: 'multipart/form-data',
        body: {
          teknik_resim: '[File object - PNG, JPG, JPEG]'
        }
      }
    }, 'Test endpoint başarılı');
  }

  static formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  static formatProcessingTime(startTime) {
    const endTime = Date.now();
    return endTime - startTime;
  }
}

module.exports = ResponseFormatter; 