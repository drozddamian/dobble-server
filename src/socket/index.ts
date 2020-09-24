import socketIo, { Socket } from 'socket.io'
import GameTable , { IGameTable } from '../models/GameTable'
import GAME_SOCKET_ACTIONS from '../constants/gameSocket'
import { getCards } from '../utils/cards'
import { PackOfCards } from '../types'
import { IPlayer } from '../models/Player'


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
  cards: PackOfCards;
  roundPlayers: IPlayer[];
  howManyPlayersInTheRound: number;

  constructor() {
    this.io = socketIo().listen(80)
    this.initializeSocketConnection()
    this.cards = getCards()
  }

  getFirstDealCards() {
    const centerCard = this.cards.shift()
    const tableCards = this.cards.splice(0, this.howManyPlayersInTheRound)

    let cardsByPlayer = {}
    this.roundPlayers.forEach((playerId, index) => {
      // @ts-ignore
      cardsByPlayer[playerId] = tableCards[index]
    })

    return {
      centerCard,
      cardsByPlayer,
    }
  }

  distributeFirstCards() {
    const firstDealCards = this.getFirstDealCards()
    this.io.sockets.emit(ROUND_START, firstDealCards)
  }

  countDownToStartNewRound() {
    let roundStartTimeLeft = ROUND_START_COUNTER

    const roundCountdown = setInterval(() => {
      this.io.sockets.emit(ROUND_START_COUNTDOWN, roundStartTimeLeft)

      roundStartTimeLeft--

      if (roundStartTimeLeft === 0) {
        clearInterval(roundCountdown)
        this.distributeFirstCards()
      }
    }, 1000)
  }

  initializeSocketConnection() {
    this.io.on('connection', (socket) => {
      const tableId = socket.handshake.query['tableId']
      socket.join(tableId)


      socket.on(PLAYER_JOIN, async ({ playerId, gameId }) => {
        try {
          const updatedGame = await GameTable.findOneAndUpdate(
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
          const updatedGame = await GameTable.findOneAndUpdate(
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
          const gameTable: IGameTable = await GameTable.findOne({ _id: gameId })
          const howManyPlayersInTheRound = gameTable.players.length

          if (howManyPlayersInTheRound < 2) {
            this.io.emit(GAME_ERROR, 'Not enough players')
            return
          }

          this.roundPlayers = gameTable.players
          this.howManyPlayersInTheRound = howManyPlayersInTheRound
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
