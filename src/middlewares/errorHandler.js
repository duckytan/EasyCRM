function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: '请求的资源不存在',
    path: req.path,
  });
}

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
};
