import socketIo from 'socket.io'
import GameSession from '../models/GameSession'
import GAME_SOCKET_ACTIONS from '../constants/gameSocket'

const {
  PLAYER_JOIN,
  PLAYER_LEAVE,
  GAME_ERROR,
} = GAME_SOCKET_ACTIONS

class GameSocket {
  server: object;

  constructor(server: object) {
    this.server = server
    this.initializeSocketConnection()
  }

  initializeSocketConnection() {
    const io = socketIo(this.server)

    io.on('connection', (socket) => {
      socket.on(PLAYER_JOIN, async ({ playerId, gameId }) => {
        try {
          const updatedGame = await GameSession.findOneAndUpdate(
            { _id: gameId },
            { $addToSet: { players: playerId } }
          )
          io.emit(PLAYER_JOIN, updatedGame)
        } catch (error) {
          io.emit(GAME_ERROR, 'Something went wrong')
        }
      })

      socket.on(PLAYER_LEAVE, async ({ playerId, gameId }) => {
        try {
          console.log(playerId)
          const updatedGame = await GameSession.findOneAndUpdate(
            { _id: gameId },
            { pull: { players: playerId } }
          )
          console.log(updatedGame)
          io.emit(PLAYER_LEAVE, updatedGame)
        } catch (error) {
          io.emit(GAME_ERROR, 'Something went wrong')
        }
      })

      socket.on('event:card-chosen', (cardName) => {
        console.log(cardName)
        io.emit('event:move-result', cardName)
      })

    })
  }
}

export default GameSocket
