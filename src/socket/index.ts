import socketIo, { Socket } from 'socket.io'
import GameSession, {IGameSession} from '../models/GameSession'
import GAME_SOCKET_ACTIONS from '../constants/gameSocket'

const {
  PLAYER_JOIN,
  PLAYER_LEAVE,
  ROUND_START,
  ROUND_START_COUNTDOWN,
  GAME_ERROR,
} = GAME_SOCKET_ACTIONS

const ROUND_START_COUNTER = 3

class GameSocket {
  io: Socket;

  constructor() {
    this.io = socketIo().listen(80)
    this.initializeSocketConnection()
  }

  countDownToStartNewRound() {
    let roundStartTimeLeft = ROUND_START_COUNTER

    const roundCountdown = setInterval(() => {
      this.io.sockets.emit(ROUND_START_COUNTDOWN, roundStartTimeLeft)

      roundStartTimeLeft--

      if (roundStartTimeLeft === 0) {
        clearInterval(roundCountdown)
      }
    }, 1000)
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

      socket.on(ROUND_START, async ({ gameId }) => {
        try {
          const gameSession: IGameSession = await GameSession.findOne({ _id: gameId })

          if (gameSession.players.length < 2) {
            this.io.emit(GAME_ERROR, 'Not enough players')
            return
          }

          this.countDownToStartNewRound()

        } catch (error) {
          this.io.emit(GAME_ERROR, error.message)
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
