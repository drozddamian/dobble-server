import 'dotenv/config'
import jwt, { Secret } from 'jsonwebtoken'
import { AUTH_TOKEN } from '../constants'
import ErrorHandler from '../helpers/error'

export default (req, res, next) => {
  const token = req.header(AUTH_TOKEN)
  if (!token) {
    throw new ErrorHandler(401, 'Access denied')
  }

  try {
    req.player = jwt.verify(token, process.env.JWT_SECRET as Secret)
    next()
  } catch (error) {
    throw new ErrorHandler(400, 'Invalid token')
  }
}
