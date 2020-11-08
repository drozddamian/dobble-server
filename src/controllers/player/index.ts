import { Request, Response, NextFunction } from 'express'
import { isNil } from 'ramda'
import Player from '../../models/Player'
import { mapPlayerData } from '../../helpers/apiResponseMapper'
import ErrorHandler from '../../helpers/error'


const getUpdateModelData = (newNick: string, newPassword: string) => {
  if (isNil(newNick) && isNil(newPassword)) {
    return null
  }

  return isNil(newNick)
    ? { password: newPassword }
    : { nick: newNick }
}


const playerControllers = {
  get_player: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {id} = req.params

      const player = await Player.findOne({_id: id}, (error) => {
        if (error) {
          return next(new ErrorHandler(400, 'User not found'))
        }
      })
          .populate('owningRooms')
          .populate('joinedRooms');

      res.send({player: mapPlayerData(player)})

    } catch (error) {
      next(error)
    }
  },

  change_player: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, nick, password } = req.body

      const updateModelObject = getUpdateModelData(nick, password)

      if (isNil(updateModelObject)) {
        return next(new ErrorHandler(400, 'Nothing to update'))
      }

      Player.findByIdAndUpdate(id, updateModelObject, (error) => {
        if (error) {
          return next(new ErrorHandler(400, 'Update failed'))
        }
        res.send('Data had been updated')
      })

    } catch (error) {
      next(error)
    }
  },
}

export default playerControllers
