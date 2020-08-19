import 'dotenv/config'
import jwt, { Secret } from 'jsonwebtoken'

export default (req, res, next) => {
  const token = req.header('auth-token')
  if (!token) {
    return res.status(401).send('Access denied')
  }

  try {
    req.player = jwt.verify(token, process.env.JWT_SECRET as Secret)
  } catch (error) {
    res.status(400).send('Invalid token')
  }
}
