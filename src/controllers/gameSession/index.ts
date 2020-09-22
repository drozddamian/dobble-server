import GameSession from '../../models/GameSession'
import GAME_SOCKET_ACTIONS from '../../constants/gameSocket'

const { PLAYER_JOIN } = GAME_SOCKET_ACTIONS

const gameSessionControllers = {
  get_game_session: async (req, res) => {
    const { id } = req.params

    try {
      const gameSession = await GameSession.findOne({ _id: id })
      res.send(gameSession)
    } catch(error){
      res.status(500).send(error.message)
    }
  },

  join_game_session: (socketIo) => async (req, res) => {
    const { sessionId, playerId } = req.body

    try {
      const game = await GameSession.findOne({ _id: sessionId })

      if (game.players.includes(playerId)) {
        res.status(409).send('User already exist in this game session')
        return
      }

      game.players = [...game.players, playerId]
      socketIo.io.emit(PLAYER_JOIN, game.players)
      await game.save()
      res.send(game)
    } catch(error) {
      res.status(500).send(error.message)
    }
  },
}

export default gameSessionControllers
