const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { ImageProcessingError } = require('../utils/errors');

class ImageProcessor {
  constructor() {
    this.maxWidth = parseInt(process.env.MAX_IMAGE_WIDTH) || 2000;
    this.maxHeight = parseInt(process.env.MAX_IMAGE_HEIGHT) || 2000;
    this.jpegQuality = parseInt(process.env.JPEG_QUALITY) || 85;
  }

  async processImage(buffer, mimeType, filename) {
    try {
      let processedBuffer;
      let metadata;

      // Handle PDF files (temporarily disabled - not supported on this system)
      if (mimeType === 'application/pdf') {
        throw new ImageProcessingError('PDF dosyaları şu anda desteklenmiyor. Lütfen PNG, JPG veya JPEG formatında yükleyin.', 'PDF_NOT_SUPPORTED');
      } else {
        // Process regular image files
        processedBuffer = buffer;
        metadata = await this.getImageMetadata(processedBuffer);
      }

      // Optimize and standardize the image
      const optimizedBuffer = await this.optimizeImage(processedBuffer, metadata);
      const finalMetadata = await this.getImageMetadata(optimizedBuffer);

      return {
        buffer: optimizedBuffer,
        metadata: {
          ...finalMetadata,
          originalFormat: mimeType,
          processedFormat: 'image/png',
          originalSize: buffer.length,
          processedSize: optimizedBuffer.length,
          compressionRatio: ((buffer.length - optimizedBuffer.length) / buffer.length * 100).toFixed(2) + '%'
        }
      };
    } catch (error) {
      throw new ImageProcessingError(`Görüntü işleme hatası: ${error.message}`, 'IMAGE_PROCESS_FAILED');
    }
  }

  // PDF conversion temporarily disabled
  async convertPdfToImage(buffer, filename) {
    throw new ImageProcessingError('PDF dönüştürme bu sistemde desteklenmiyor', 'PDF_CONVERSION_NOT_SUPPORTED');
  }

  async getImageMetadata(buffer) {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        channels: metadata.channels,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        size: buffer.length
      };
    } catch (error) {
      throw new ImageProcessingError(`Metadata okuma hatası: ${error.message}`, 'METADATA_READ_FAILED');
    }
  }

  async optimizeImage(buffer, metadata) {
    try {
      let image = sharp(buffer);

      // Remove EXIF data for privacy
      image = image.rotate(); // Auto-rotate based on EXIF, then strip EXIF

      // Resize if too large
      if (metadata.width > this.maxWidth || metadata.height > this.maxHeight) {
        image = image.resize(this.maxWidth, this.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Enhance image for OCR
      image = image
        .sharpen(1, 1, 2) // Sharpen for better OCR
        .normalize() // Normalize histogram
        .linear(1.2, -(128 * 1.2) + 128); // Increase contrast

      // Convert to PNG for consistency
      const processedBuffer = await image
        .png({
          quality: 95,
          compressionLevel: 6,
          adaptiveFiltering: true
        })
        .toBuffer();

      return processedBuffer;
    } catch (error) {
      throw new ImageProcessingError(`Görüntü optimizasyon hatası: ${error.message}`, 'IMAGE_OPTIMIZATION_FAILED');
    }
  }

  async createOCROptimizedVersion(buffer) {
    try {
      const image = sharp(buffer);
      
      // Create grayscale version optimized for OCR
      const ocrBuffer = await image
        .greyscale()
        .normalize()
        .linear(1.5, -(128 * 1.5) + 128) // Higher contrast for OCR
        .sharpen(2, 1, 3) // More aggressive sharpening
        .png()
        .toBuffer();

      return ocrBuffer;
    } catch (error) {
      throw new ImageProcessingError(`OCR optimizasyon hatası: ${error.message}`, 'OCR_OPTIMIZATION_FAILED');
    }
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async cleanup(filePaths) {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Cleanup warning: Could not delete ${filePath}:`, error.message);
      }
    }
  }

  bufferToBase64(buffer, mimeType = 'image/png') {
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }
}

module.exports = ImageProcessor; 