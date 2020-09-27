class ErrorHandler extends Error {
  statusCode: 200 | 400 | 401 | 404 | 409 | 500;
  message: string;

  constructor(statusCode, message) {
    super()
    this.statusCode = statusCode
    this.message = message
  }
}

export const handleError = (err, res) => {
  const { statusCode, message } = err

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message
  })
}

export default ErrorHandler
