import socketIo, { Socket } from 'socket.io'
import GameSession from '../models/GameSession'
import GAME_SOCKET_ACTIONS from '../constants/gameSocket'

const {
  PLAYER_JOIN,
  PLAYER_LEAVE,
  GAME_ERROR,
} = GAME_SOCKET_ACTIONS

class GameSocket {
  io: Socket;

  constructor() {
    this.io = socketIo().listen(80)
    this.initializeSocketConnection()
  }


  initializeSocketConnection() {
    this.io.on('connection', (socket) => {
      socket.on(PLAYER_JOIN, async ({ playerId, gameId }) => {
        try {
          const updatedGame = await GameSession.findOneAndUpdate(
            { _id: gameId },
            { $addToSet: { players: playerId } },
            { 'new': true }
          )
          this.io.emit(PLAYER_JOIN, updatedGame.players)
        } catch (error) {
          this.io.emit(GAME_ERROR, 'Something went wrong')
        }
      })

      socket.on(PLAYER_LEAVE, async ({ playerId, gameId }) => {
        try {
          const updatedGame = await GameSession.findOneAndUpdate(
            { _id: gameId },
            { $pull: { players: playerId } },
            { 'new': true }
          )
          this.io.emit(PLAYER_LEAVE, updatedGame.players)
        } catch (error) {
          this.io.emit(GAME_ERROR, 'Something went wrong')
        }
      })

      socket.on('event:card-chosen', (cardName) => {
        console.log(cardName)
        this.io.emit('event:move-result', cardName)
      })

    })
  }
}

export default GameSocket
