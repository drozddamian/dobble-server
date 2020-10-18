import SocketIO from 'socket.io'
import { equals } from 'ramda'
import GameTable, {GameTableStatus, IGameTable} from '../models/GameTable'
import GameRound, {IGameRound} from '../models/GameRound'
import Player from '../models/Player'
import GAME_SOCKET_ACTIONS from '../constants/gameSocket'
import {getCards} from '../helpers/cards'
import {PackOfCards} from '../types'
import {mapGameRoundData} from '../helpers/socketResponseMapper'
import {chunkArray, getExperienceByCardsLeft, updatePlayerExperience,} from '../helpers'


const { Joining, Waiting, Countdown, Processing } = GameTableStatus

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
  io: SocketIO.Server;
  cards: PackOfCards;
  playerId: string;
  tableId: string;

  constructor(app) {
    this.io = SocketIO().listen(80)
    this.cards = getCards()
    this.initializeSocketConnection()
  }


  async addExperienceToPlayer(playerId: string, howManyCardsLeft: number) {
    const experienceForSpotter = getExperienceByCardsLeft(howManyCardsLeft)
    await updatePlayerExperience(playerId, experienceForSpotter)
  }

  dispatchTableChange(gameTable) {
    const { gameStatus, roundStartCountdown, players } = gameTable
    this.io.emit(TABLE_CHANGE, { gameStatus, roundStartCountdown, players })
  }

  dispatchGameChange(gameRound: IGameRound) {
    this.io.emit(GAME_CHANGE, mapGameRoundData(gameRound))
  }

  async dispatchGameEnd(playerId, gameId) {
    const { nick } = await Player.findOne({ _id: playerId })

    await GameTable.findOneAndUpdate(
      { _id: gameId },
      { gameStatus: Waiting, roundStartCountdown: ROUND_START_COUNTER },
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

  async distributeFirstCards(tableId, players) {
    const { centerCard, cardsByPlayer } = this.getFirstDealCards(players)

    const newGameRound = new GameRound({
      gameStatus: Processing,
      players,
      centerCard,
      cardsByPlayer,
      spotterId: null,
    })
    await newGameRound.save()

    const updatedGameTable = await GameTable.findOneAndUpdate(
      { _id: tableId },
      { $set: { gameStatus: Processing } },
      { 'new': true }
    )

    this.dispatchTableChange(updatedGameTable)
    this.dispatchGameChange(newGameRound)
  }

  async addPlayerToTable(tableId, playerId) {
    try {
      const player = await Player.findOne({ _id: playerId })
      const { gameStatus, players } = await GameTable.findOne({ _id: tableId })
      const updatedGameStatus = players.length > 1 && equals(gameStatus, Joining)
        ? Waiting
        : gameStatus

      const updatedGameTable = await GameTable.findOneAndUpdate(
        { _id: tableId },
        {
          $addToSet: { players: player },
          $set: { gameStatus: updatedGameStatus },
        },
        { 'new': true }
      )
      this.dispatchTableChange(updatedGameTable)
    } catch (error) {
      this.io.emit(GAME_ERROR, 'ERROR WHILE JOINING THE TABLE')
    }
  }

  async roundStart(gameId) {
    try {
      const gameTable: IGameTable = await GameTable.findOne({ _id: gameId })
      const howManyPlayersInTheRound = gameTable.players.length

      if (howManyPlayersInTheRound < 2) {
        this.io.emit(GAME_ERROR, 'Not enough players')
        return
      }

      await this.countDownToStartNewRound(gameTable)

    } catch (error) {
      this.io.emit(GAME_ERROR, error.message)
    }
  }

  async countDownToStartNewRound(gameTable: IGameTable) {
    const { _id } = gameTable

    let roundStartTimeLeft = ROUND_START_COUNTER

    const roundCountdown = setInterval(async () => {
      const gameTable = await GameTable.findOne({ _id })
      const { players } = gameTable
      const updatedGameStatus = (players.length < 2) ? Joining : Countdown
      const updatedRoundStartTimeLeft = equals(updatedGameStatus, Joining) ? ROUND_START_COUNTER : roundStartTimeLeft

      gameTable.gameStatus = updatedGameStatus
      gameTable.roundStartCountdown = updatedRoundStartTimeLeft
      await gameTable.save()

      this.dispatchTableChange(gameTable)
      if (updatedGameStatus === Joining) {
        clearInterval(roundCountdown)
        return
      }

      roundStartTimeLeft--

      if (roundStartTimeLeft === 0) {
        clearInterval(roundCountdown)
        await this.distributeFirstCards(_id, gameTable.players)
      }
    }, 1000)
  }

  async spotShape(roundId, playerId) {
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
  }

  async playerLeave(playerId, gameId) {
    try {
      const updatedGame = await GameTable.findOneAndUpdate(
        { _id: gameId },
        { $pull: { players: playerId }},
        { 'new': true }
      )
      this.dispatchTableChange(updatedGame)
    } catch (error) {
      this.io.emit(GAME_ERROR, 'PLAYER LEAVE ERROR')
    }
  }

  initializeSocketConnection() {
    this.io.on('connection', async (socket) => {
      const tableId = socket.handshake.query['tableId']
      const playerId = socket.handshake.query['playerId']
      this.tableId = tableId
      this.playerId = playerId

      await this.addPlayerToTable(tableId, playerId)
      socket.join(tableId)

      socket.on(PLAYER_LEAVE, async ({ playerId, gameId }) => await this.playerLeave(playerId, gameId))
      socket.on(ROUND_START, async ({ gameId }) => await this.roundStart(gameId))
      socket.on(SPOT_SHAPE, async ({ roundId, playerId }) => await this.spotShape(roundId, playerId))

      socket.on('disconnect', () => {
        this.playerLeave(this.playerId, this.tableId)
      })
    })
  }
}

export default GameSocket
