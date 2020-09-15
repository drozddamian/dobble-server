import GameSession from '../../models/GameSession'


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

  join_game_session: async (req, res) => {
    const { sessionId, playerId } = req.query

    try {
      const game = await GameSession.findOne({ _id: sessionId })

      if (game.players.includes(playerId)) {
        res.status(409).send('User already exist in this game session')
        return
      }

      game.update(
        { _id: sessionId },
        { $push: { players: playerId } }
      )
      res.send(game)
    } catch(error) {
      res.status(500).send(error.message)
    }
  },
}

export default gameSessionControllers
