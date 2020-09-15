import GameSession from '../../models/GameSession'
import Room from '../../models/Room'
import Player from '../../models/Player'


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
      const game = await GameSession.findOneAndUpdate(
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
