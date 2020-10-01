import 'dotenv/config'
import { isNil } from 'ramda'
import { Request, Response, NextFunction } from 'express'
import jwt, { Secret } from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import Player from '../../models/Player'
import ErrorHandler from '../../helpers/error'
import { mapPlayerData } from '../../helpers/apiResponseMapper'
import {
  AUTH_TOKEN,
  EXPERIENCE_TO_SECOND_LEVEL,
} from '../../constants'


const authControllers = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body

      const player = await Player.findOne({ username: username })

      if (isNil(player)) {
        return next(new ErrorHandler(400, 'User not found'))
      }

      const isValidPassword = await bcrypt.compare(password, player.password)
      if (!isValidPassword) {
        return next(new ErrorHandler(400, 'Invalid password'))
      }

      const mappedPlayerData = mapPlayerData(player)

      const token = jwt.sign({ _id: player._id }, process.env.JWT_SECRET as Secret)

      res.header(AUTH_TOKEN, token).send({
        player: mappedPlayerData,
        token
      })

    } catch (error) {
      return next(error)
    }
  },

  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, nick, password } = req.body

      await Player.findOne({ username }, (_, player) => {
        if (player) {
         return next(new ErrorHandler(409, 'Username already exists'))
        }
      })

      const salt = await bcrypt.genSalt()
      const hashedPassword = await bcrypt.hash(password, salt)

      const player = new Player({
        username,
        nick: nick,
        password: hashedPassword,
        level: 1,
        experience: 0,
        experienceToNextLevel: EXPERIENCE_TO_SECOND_LEVEL,
      })

      const savedPlayer = await player.save()
      const mappedPlayerData = mapPlayerData(savedPlayer)

      res.send({ player: mappedPlayerData })

    } catch (error) {
      next(error)
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await res.removeHeader(AUTH_TOKEN)
      res.send('Logged out successful')
    } catch (error) {
      next(error)
    }
  },
}

export default authControllers
