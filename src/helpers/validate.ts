import { head } from 'ramda'
import { validationResult } from 'express-validator'
import ErrorHandler from './error'


const validate = (req, res, next) => {
  const errors = validationResult(req)

  if (errors.isEmpty()) {
    return next()
  }
  const firstErrorObject = head(errors.array({ onlyFirstError: true }))
  const errorMessage = firstErrorObject.msg
  throw new ErrorHandler(412, errorMessage)
}

export default validate
