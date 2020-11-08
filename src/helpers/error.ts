class ErrorHandler extends Error {
  statusCode: 400 | 401 | 404 | 409 | 412 | 500;
  message: string;

  constructor(statusCode, message) {
    super()
    this.statusCode = statusCode
    this.message = message
  }
}

export const handleError = (error, res) => {
  const {
    statusCode = 500,
    message = 'Error',
  } = error

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message
  })
}

export default ErrorHandler
