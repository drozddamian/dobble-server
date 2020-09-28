import GameTable from '../../models/GameTable'
import GAME_SOCKET_ACTIONS from '../../constants/gameSocket'
import ErrorHandler from "../../helpers/error";

const { PLAYER_JOIN } = GAME_SOCKET_ACTIONS

const gameTableControllers = {
  get_game_table: async (req, res, next) => {
    const { id } = req.params
    const gameTable = await GameTable.findOne({ _id: id }, (error) => {
      if (error) {
        next(new ErrorHandler(400, 'Game table not found'))
      }
    })
    res.send(gameTable)
  },

  join_game_table: (socketIo) => async (req, res, next) => {
    try {
      const { tableId, playerId } = req.body
      const gameTable = await GameTable.findOne({ _id: tableId })

      if (gameTable.players.includes(playerId)) {
        next(new ErrorHandler(409, 'User already exist in this game session'))
      }

      gameTable.players = [...gameTable.players, playerId]
      await gameTable.save()

      socketIo.io.emit(PLAYER_JOIN, gameTable.players)
      res.send(gameTable)

    } catch(error) {
      next(error)
    }
  },
}

export default gameTableControllers
