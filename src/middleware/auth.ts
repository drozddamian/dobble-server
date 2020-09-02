import 'dotenv/config'
import jwt, { Secret } from 'jsonwebtoken'
import { AUTH_TOKEN } from '../constants'

export default (req, res, next) => {
  const token = req.header(AUTH_TOKEN)
  if (!token) {
    return res.status(401).send('Access denied')
  }

  try {
    req.player = jwt.verify(token, process.env.JWT_SECRET as Secret)
  } catch (error) {
    res.status(400).send('Invalid token')
  }
}
