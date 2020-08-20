import Player, { IPlayer } from '../../models/Player'

const playerControllers = {
  get_info: async (req,res) => {
    const { username } = req.params

    const player = await Player.findOne({ username })
    if (!player) {
      res.status(400).send('User not found')
    }

    const { _id, owningRooms, joinedRooms } = player as IPlayer

    const playerResponseData = {
      _id,
      owningRooms,
      joinedRooms,
    }
    res.send(playerResponseData)
  }
}

export default playerControllers
