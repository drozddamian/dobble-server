import 'dotenv/config'
import jwt, { Secret } from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import Player from '../../models/Player'
import { mapPlayerData } from '../../utils/apiResponseMapper'
import { AUTH_TOKEN, EXPERIENCE_TO_SECOND_LEVEL } from '../../constants'

const authControllers = {
  login: async (req,res) => {
    const { username, password } = req.body

    const player = await Player.findOne({ username })
    if (!player) {
      res.status(400).send('User not found')
      return
    }

    const isValidPassword = await bcrypt.compare(password, player?.password)
    if (!isValidPassword) {
      res.status(400).send('Invalid password')
      return
    }

    const mappedPlayerData = mapPlayerData(player)

    const token = jwt.sign({ _id: player?._id }, process.env.JWT_SECRET as Secret)
    await res.header(AUTH_TOKEN, token).send({ player: mappedPlayerData, token })
  },

  register: async (req, res) => {
    const { username, nick, password } = req.body

    const playerExists = await Player.findOne({ username })

    if (playerExists) {
      res.status(409).send('Username already exists')
      return
    }

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

    try {
      const savedPlayer = await player.save()
      const mappedPlayerData = mapPlayerData(savedPlayer)
      res.send({
        player: mappedPlayerData,
      })
    } catch (error) {
      res.status(500).send(error.message)
    }
  },

  logout: async (req, res) => {
    try {
      await res.removeHeader(AUTH_TOKEN)
      res.send('Logged out successful')
    } catch (error) {
      console.log(error)
      res.status(500).send(error.message)
    }
  },
}

export default authControllers
