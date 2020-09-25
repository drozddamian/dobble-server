import socketIo, { Socket } from 'socket.io'
import GameTable, { IGameTable } from '../models/GameTable'
import GameRound, {IGameRound} from '../models/GameRound'
import Player from '../models/Player'
import GAME_SOCKET_ACTIONS from '../constants/gameSocket'
import { getCards } from '../utils/cards'
import { PackOfCards } from '../types'
import { mapGameRoundData } from '../utils/socketResponseMapper'
import { chunkArray, getExperienceByCardsLeft } from '../utils'


const {
  PLAYER_LEAVE,
  ROUND_START,
  GAME_ERROR,
  GAME_END,
  TABLE_CHANGE,
  GAME_CHANGE,
  SPOT_SHAPE,
} = GAME_SOCKET_ACTIONS

const ROUND_START_COUNTER = 3

class GameSocket {
  io: Socket;
  cards: PackOfCards;
  playerId: string;
  tableId: string;

  constructor(app) {
    this.io = socketIo().listen(app)
    this.initializeSocketConnection()
    this.cards = getCards()
  }


  async addExperienceToPlayer(playerId: string, howManyCardsLeft: number) {
    const experienceForSpotter = getExperienceByCardsLeft(howManyCardsLeft)

    await Player.findOneAndUpdate(
      { _id: playerId, },
      { $inc: { experience: experienceForSpotter }}
    )
  }

  dispatchTableChange(gameTable) {
    const { isGameInProcess, roundStartCountdown, players } = gameTable
    this.io.emit(TABLE_CHANGE, { isGameInProcess, roundStartCountdown, players })
  }

  dispatchGameChange(gameRound: IGameRound) {
    this.io.emit(GAME_CHANGE, mapGameRoundData(gameRound))
  }

  async dispatchGameEnd(playerId, gameId) {
    const { nick } = await Player.findOne({ _id: playerId })

    await GameTable.findOneAndUpdate(
      { _id: gameId },
      { isGameInProcess: false, roundStartCountdown: ROUND_START_COUNTER },
      { 'new': true }
    )

    this.io.emit(GAME_END, { winner: nick })
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

    this.dispatchGameChange(newGameRound)
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

      socket.on(SPOT_SHAPE, async ({ roundId, playerId }) => {
        try {
          const { cardsByPlayer } = await GameRound.findOne({ _id: roundId })
          const newCenterCard = cardsByPlayer[playerId].cards.pop()
          const playerCards = cardsByPlayer[playerId].cards
          const howManyCardsLeft = playerCards.length - 1
          cardsByPlayer[playerId].numberOfCardsLeft = howManyCardsLeft

          const gameRound: IGameRound = await GameRound.findOneAndUpdate(
            { _id: roundId },
            { spotterId: playerId, centerCard: newCenterCard, cardsByPlayer },
            { 'new': true }
          )
          this.dispatchGameChange(gameRound)

          await this.addExperienceToPlayer(playerId, playerCards.length)

          if (howManyCardsLeft === 0) {
            await this.dispatchGameEnd(playerId, roundId)
          }
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
