import { isNil } from 'ramda'
import Player, { IPlayer } from '../../models/Player'


const getUpdateModelData = (newNick: string, newPassword: string) => {
  if (isNil(newNick)) {
    return { password: newPassword }
  }
  return { nick: newNick }
}


const playerControllers = {
  get_info: async (req, res) => {
    const { username } = req.params

    const player = await Player.findOne({ username })
    if (!player) {
      res.status(400).send('User not found')
      return
    }

    const { _id, owningRooms, joinedRooms } = player as IPlayer

    const playerResponseData = {
      _id,
      owningRooms,
      joinedRooms,
    }
    res.send(playerResponseData)
  },

  change_data: async (req, res) => {
    const { id, newNick, newPassword } = req.body

    const updateModelObject = getUpdateModelData(newNick, newPassword)

    Player.findByIdAndUpdate(
      id,
      updateModelObject,
      function (error, player) {
        if (error) {
          res.status(400).send('Update failed')
        } else {
          res.send(player)
        }
      }
    )
  },

}

export default playerControllers
