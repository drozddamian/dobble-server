import { isNil } from 'ramda'
import Player from '../../models/Player'
import { mapPlayerData } from '../../helpers/apiResponseMapper'
import ErrorHandler from "../../helpers/error";


const getUpdateModelData = (newNick: string, newPassword: string) => {
  if (isNil(newNick) && isNil(newPassword)) {
    return null
  }

  return isNil(newNick)
    ? { password: newPassword }
    : { nick: newNick }
}


const playerControllers = {
  get_player: async (req, res, next) => {
    try {
      const { id } = req.params

      const player = await Player.findOne({ _id: id }, (error) => {
        if (error) {
          next(new ErrorHandler(400, 'User not found'))
        }
      })

      res.send({ player: mapPlayerData(player) })

    } catch (error) {
      next(error)
    }
  },

  get_podium_players: async (req, res, next) => {
    try {
      const podiumPlayers = await Player.find()
        .sort('level')
        .limit(3)

      res.send(podiumPlayers)

    } catch (error) {
      next(error)
    }
  },

  change_player: async (req, res, next) => {
    try {
      const { id, nick, password } = req.body

      const updateModelObject = getUpdateModelData(nick, password)

      if (isNil(updateModelObject)) {
        next(new ErrorHandler(400, 'Nothing to update'))
      }

      Player.findByIdAndUpdate(id, updateModelObject, (error) => {
        if (error) {
          next(new ErrorHandler(400, 'Update failed'))
        }
        res.send('Data had been updated')
      })

    } catch (error) {
      next(error)
    }
  },
}

export default playerControllers
