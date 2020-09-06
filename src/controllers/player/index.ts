import { isNil } from 'ramda'
import Player from '../../models/Player'
import { mapPlayerData } from '../../utils/apiResponseMapper'


const getUpdateModelData = (newNick: string, newPassword: string) => {
  if (isNil(newNick) && isNil(newPassword)) {
    return null
  }

  return isNil(newNick)
    ? { password: newPassword }
    : { nick: newNick }
}


const playerControllers = {
  get_player: async (req, res) => {
    const { id } = req.params

    const player = await Player.findOne({ _id: id })
      .populate('owningRooms')
      .populate('joinedRooms')

    if (!player) {
      res.status(400).send('User not found')
      return
    }

    const mappedPlayerData = mapPlayerData(player)

    res.send({
      player: mappedPlayerData
    })
  },

  get_podium_players: async (req, res) => {
    try {
      const podiumPlayers = await Player.find()
        .sort('level')
        .limit(3)

      res.send(podiumPlayers)
    } catch (error) {
      res.status(400).send(error.message)
    }
  },

  change_player: async (req, res) => {
    const { id, nick, password } = req.body

    const updateModelObject = getUpdateModelData(nick, password)

    if (isNil(updateModelObject)) {
      res.status(400).send('Nothing to update')
      return
    }

    Player.findByIdAndUpdate(
      id,
      updateModelObject,
      function (error) {
        if (error) {
          res.status(400).send('Update failed')
        } else {
          res.send('Data had been updated')
        }
      }
    )
  },

}

export default playerControllers
