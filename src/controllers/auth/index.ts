import 'dotenv/config'
import jwt, { Secret } from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import Player from '../../models/Player'

const authControllers = {
  auth_login: async (req,res) => {
    const { username, password } = req.body

    const player = await Player.findOne({ username })
    if (!player) {
      res.status(400).send('User not found')
    }

    const isValidPassword = await bcrypt.compare(password, player?.password)
    if (!isValidPassword) {
      res.status(400).send('Invalid password')
    }

    const token = jwt.sign({ _id: player?._id }, process.env.JWT_SECRET as Secret)
    res.header('auth-token', token).send(token)
  },
  auth_register: async (req, res) => {
    const { username, password } = req.body

    const playerExists = await Player.findOne({ username })

    if (playerExists) {
      res.status(409).send('Username already exists')
    }

    const salt = await bcrypt.genSalt()
    const hashedPassword = await bcrypt.hash(password, salt)

    const player = new Player({ username, password: hashedPassword })

    try {
      const savedPlayer = await player.save()
      res.send(savedPlayer)
    } catch (error) {
      res.status(500).send({error})
    }
  }
}

export default authControllers
