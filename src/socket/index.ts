import socketIo, { Socket } from 'socket.io'
import GameTable, { IGameTable } from '../models/GameTable'
import GameRound from '../models/GameRound'
import Player from '../models/Player'
import GAME_SOCKET_ACTIONS from '../constants/gameSocket'
import { getCards } from '../utils/cards'
import { chunkArray } from '../utils'
import { PackOfCards } from '../types'
import { mapGameRoundData } from '../utils/socketResponseMapper'


const {
  PLAYER_LEAVE,
  ROUND_START,
  GAME_ERROR,
  TABLE_CHANGE,
  GAME_CHANGE,
} = GAME_SOCKET_ACTIONS

const ROUND_START_COUNTER = 3

class GameSocket {
  io: Socket;
  cards: PackOfCards;
  playerId: string;
  tableId: string;

  constructor() {
    this.io = socketIo().listen(80)
    this.initializeSocketConnection()
    this.cards = getCards()
  }


  dispatchTableChange(gameTable) {
    const { isGameInProcess, roundStartCountdown, players } = gameTable
    this.io.emit(TABLE_CHANGE, { isGameInProcess, roundStartCountdown, players })
  }

  getFirstDealCards(players) {
    const centerCard = this.cards.shift()
    const cardsChunkLength = this.cards.length / players.length
    const chunkedCardsArray = chunkArray(this.cards, cardsChunkLength)

    let cardsByPlayer = {}


    players.forEach((playerId, index) => {
      const cardsForPlayer = chunkedCardsArray[index]

      cardsByPlayer[playerId] = {
        cards: cardsForPlayer,
        numberOfCardsLeft: cardsForPlayer.length,
      }
    })

    return {
      centerCard,
      cardsByPlayer,
    }
  }

  async distributeFirstCards(players) {
    const { centerCard, cardsByPlayer } = this.getFirstDealCards(players)

    const newGameRound = new GameRound({
      isGameRoundInProcess: true,
      players,
      centerCard,
      cardsByPlayer,
      spotterId: null,
    })
    await newGameRound.save()

    this.io.emit(GAME_CHANGE, mapGameRoundData(newGameRound))
  }

  async addPlayerToTable(tableId, playerId) {
    try {
      const player = await Player.findOne({ _id: playerId })
      const updatedGame = await GameTable.findOneAndUpdate(
        { _id: tableId },
        { $addToSet: { players: player } },
        { 'new': true }
      )
      this.dispatchTableChange(updatedGame)
    } catch (error) {
      this.io.emit(GAME_ERROR, 'Something went wrong')
    }
  }

  async removePlayerFromTable(tableId, playerId) {
    try {
      const updatedGame = await GameTable.findOneAndUpdate(
        { _id: tableId },
        { $pull: { players: playerId }},
        { 'new': true }
      )
      this.dispatchTableChange(updatedGame)
      return updatedGame
    } catch (error) {
      this.io.emit(GAME_ERROR, 'Something went wrong')
    }
  }

  async countDownToStartNewRound(gameId: string) {
    let roundStartTimeLeft = ROUND_START_COUNTER

    const roundCountdown = setInterval(async () => {
      const gameTable = await GameTable.findOneAndUpdate(
        { _id: gameId },
        { isGameInProcess: true, roundStartCountdown: roundStartTimeLeft },
        { 'new': true }
      )
      this.dispatchTableChange(gameTable)

      roundStartTimeLeft--

      if (roundStartTimeLeft === 0) {
        clearInterval(roundCountdown)
        await this.distributeFirstCards(gameTable.players)
      }
    }, 1000)
  }


  initializeSocketConnection() {
    this.io.on('connection', async (socket) => {
      const tableId = socket.handshake.query['tableId']
      const playerId = socket.handshake.query['playerId']
      this.tableId = tableId
      this.playerId = playerId

      await this.addPlayerToTable(tableId, playerId)
      socket.join(tableId)

      socket.on(PLAYER_LEAVE, async ({ playerId, gameId }) => {
        try {
          const table = await this.removePlayerFromTable(playerId, gameId)
          this.dispatchTableChange(table)
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

          await this.countDownToStartNewRound(gameId)

        } catch (error) {
          this.io.emit(GAME_ERROR, error.message)
        }
      })

      socket.on('disconnect', () => {
        this.removePlayerFromTable(this.tableId, this.playerId)
      })
    })
  }
}

export default GameSocket
