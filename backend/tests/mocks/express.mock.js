/**
 * Express Mock
 * Mock สำหรับ Express request/response objects
 */

/**
 * สร้าง Mock Request object
 */
const mockRequest = (options = {}) => {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    cookies: options.cookies || {},
    user: options.user || null,
    file: options.file || null,
    files: options.files || [],
    ip: options.ip || '127.0.0.1',
    method: options.method || 'GET',
    path: options.path || '/',
    originalUrl: options.originalUrl || '/',
    get: jest.fn((header) => options.headers?.[header]),
  };
};

/**
 * สร้าง Mock Response object
 */
const mockResponse = () => {
  const res = {
    statusCode: 200,
    data: null,
  };

  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });

  res.json = jest.fn((data) => {
    res.data = data;
    return res;
  });

  res.send = jest.fn((data) => {
    res.data = data;
    return res;
  });

  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.type = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);

  return res;
};

/**
 * สร้าง Mock Next function
 */
const mockNext = () => jest.fn();

module.exports = {
  mockRequest,
  mockResponse,
  mockNext,
};

