import GameTable from '../../models/GameTable'
import GAME_SOCKET_ACTIONS from '../../constants/gameSocket'

const { PLAYER_JOIN } = GAME_SOCKET_ACTIONS

const gameTableControllers = {
  get_game_table: async (req, res) => {
    const { id } = req.params

    try {
      const gameTable = await GameTable.findOne({ _id: id })
      res.send(gameTable)
    } catch(error){
      res.status(500).send(error.message)
    }
  },

  join_game_table: (socketIo) => async (req, res) => {
    const { sessionId, playerId } = req.body

    try {
      const gameTable = await GameTable.findOne({ _id: sessionId })

      if (gameTable.players.includes(playerId)) {
        res.status(409).send('User already exist in this game session')
        return
      }

      gameTable.players = [...gameTable.players, playerId]
      socketIo.io.emit(PLAYER_JOIN, gameTable.players)

      await gameTable.save()
      res.send(gameTable)
    } catch(error) {
      res.status(500).send(error.message)
    }
  },
}

export default gameTableControllers
