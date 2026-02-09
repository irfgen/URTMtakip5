const {
  AppError,
  ValidationError,
  FileError,
  OCRError,
  ImageProcessingError
} = require('../../src/utils/errors');

describe('Error Classes', () => {
  describe('AppError', () => {
    test('should create error with message and status code', () => {
      const error = new AppError('Test error', 400);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.status).toBe('fail');
      expect(error.isOperational).toBe(true);
    });

    test('should set status to "error" for 5xx codes', () => {
      const error = new AppError('Server error', 500);

      expect(error.status).toBe('error');
    });

    test('should capture stack trace', () => {
      const error = new AppError('Test error', 400);

      expect(error.stack).toBeDefined();
    });
  });

  describe('ValidationError', () => {
    test('should create validation error with 400 status', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.status).toBe('fail');
      expect(error.name).toBe('ValidationError');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('FileError', () => {
    test('should create file error with default code', () => {
      const error = new FileError('File not found');

      expect(error.message).toBe('File not found');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('FileError');
      expect(error.code).toBe('FILE_ERROR');
    });

    test('should create file error with custom code', () => {
      const error = new FileError('Invalid file type', 'INVALID_TYPE');

      expect(error.code).toBe('INVALID_TYPE');
    });
  });

  describe('OCRError', () => {
    test('should create OCR error with 500 status', () => {
      const error = new OCRError('OCR processing failed');

      expect(error.message).toBe('OCR processing failed');
      expect(error.statusCode).toBe(500);
      expect(error.status).toBe('error');
      expect(error.name).toBe('OCRError');
      expect(error.code).toBe('OCR_ERROR');
    });

    test('should create OCR error with custom code', () => {
      const error = new OCRError('No text found', 'NO_TEXT');

      expect(error.code).toBe('NO_TEXT');
    });
  });

  describe('ImageProcessingError', () => {
    test('should create image processing error with 500 status', () => {
      const error = new ImageProcessingError('Resize failed');

      expect(error.message).toBe('Resize failed');
      expect(error.statusCode).toBe(500);
      expect(error.status).toBe('error');
      expect(error.name).toBe('ImageProcessingError');
      expect(error.code).toBe('IMAGE_PROCESSING_ERROR');
    });

    test('should create image processing error with custom code', () => {
      const error = new ImageProcessingError('Format not supported', 'UNSUPPORTED_FORMAT');

      expect(error.code).toBe('UNSUPPORTED_FORMAT');
    });
  });
});