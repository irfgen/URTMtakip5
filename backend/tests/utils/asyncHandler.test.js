const asyncHandler = require('../../src/utils/asyncHandler');

describe('asyncHandler', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = jest.fn();
  });

  test('should call the wrapped function with req, res, next', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const wrapped = asyncHandler(mockFn);

    await wrapped(mockReq, mockRes, mockNext);

    expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
  });

  test('should pass errors to next when promise rejects', async () => {
    const error = new Error('Test error');
    const mockFn = jest.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(mockFn);

    await wrapped(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  test('should not call next when promise resolves successfully', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const wrapped = asyncHandler(mockFn);

    await wrapped(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should handle synchronous errors', async () => {
    const error = new Error('Sync error');
    const mockFn = jest.fn().mockImplementation(() => {
      throw error;
    });
    const wrapped = asyncHandler(mockFn);

    // asyncHandler only catches async errors, sync errors will throw
    expect(() => wrapped(mockReq, mockRes, mockNext)).toThrow(error);
  });
});