class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class FileError extends AppError {
  constructor(message, code = 'FILE_ERROR') {
    super(message, 400);
    this.name = 'FileError';
    this.code = code;
  }
}

class OCRError extends AppError {
  constructor(message, code = 'OCR_ERROR') {
    super(message, 500);
    this.name = 'OCRError';
    this.code = code;
  }
}

class ImageProcessingError extends AppError {
  constructor(message, code = 'IMAGE_PROCESSING_ERROR') {
    super(message, 500);
    this.name = 'ImageProcessingError';
    this.code = code;
  }
}

module.exports = {
  AppError,
  ValidationError,
  FileError,
  OCRError,
  ImageProcessingError
}; 