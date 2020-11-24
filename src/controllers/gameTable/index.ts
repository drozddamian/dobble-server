import { Request, Response, NextFunction } from 'express'
import { isNil } from 'ramda'
import GameTable from '../../models/GameTable'
import Player from '../../models/Player'
import ErrorHandler from '../../helpers/error'


const gameTableControllers = {
  get_game_table: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params
    const gameTable = await GameTable.findOne({ _id: id }, (error) => {
      if (error) {
        return next(new ErrorHandler(400, 'Game table not found'))
      }
    })
    res.send(gameTable)
  },


  //TODO probably this is not necessary because we are joining player on entering game round with websocket
  join_game_table: (socketIo) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tableId, playerId } = req.body

      const playerToJoin = await Player.findOne({ _id: playerId }, (error) => {
        if (error) {
          return next(new ErrorHandler(400, 'Player not found'))
        }
      })

      const gameTable = await GameTable.findOne({ _id: tableId })

      if (isNil(gameTable.players.find(({ _id }) => _id == playerId))) {
        gameTable.players.push(playerToJoin)
        await gameTable.save()
      }

      res.send(gameTable)

    } catch(error) {
      next(error)
    }
  },
}

export default gameTableControllers
