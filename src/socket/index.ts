import SocketIO from 'socket.io'
import dayjs from 'dayjs'
import { Types } from 'mongoose'
import { equals } from 'ramda'
import ChatMessage from '../models/Chat'
import GameTable, {
  GameTableStatus,
  IGameTable,
} from '../models/GameTable'
import GameRound, { IGameRound } from '../models/GameRound'
import Player, { IPlayer, WinGame } from '../models/Player'
import { Card, CardsByPlayer } from '../types'
import { getCards } from '../helpers/cards'
import { mapGameRoundData } from '../helpers/socketResponseMapper'
import {
  chunkArray,
  getExperienceByCardsLeft,
  updatePlayerExperience,
} from '../helpers'
import GAME_SOCKET_ACTIONS from '../constants/gameSocket'
import CHAT_SOCKET_ACTIONS from '../constants/chatSocket'

const { NEW_MESSAGE, CHAT_ERROR } = CHAT_SOCKET_ACTIONS

const {
  PLAYER_LEAVE,
  ROUND_START,
  GAME_ERROR,
  GAME_END,
  TABLE_CHANGE,
  GAME_CHANGE,
  SPOT_SHAPE,
} = GAME_SOCKET_ACTIONS

type FirstCardResult = {
  centerCard: Card
  cardsByPlayer: CardsByPlayer
}

const { Joining, Waiting, Countdown, Processing } = GameTableStatus

const ROUND_START_COUNTER = 3

class WebSocket {
  io: SocketIO.Server

  constructor(server) {
    this.io = SocketIO(server)
    this.initializeSocketConnection()
  }

  async getWinData(tableId: string): Promise<WinGame> {
    try {
      const gameFinishDate = dayjs()
      const { _id } = await GameRound.findOne({ tableId: tableId })
      const roundStartTimestamp = _id.getTimestamp()
      const roundStartDate = dayjs(_id.getTimestamp())

      return {
        timestamp: roundStartTimestamp,
        durationOfGame: gameFinishDate
          .diff(roundStartDate, 'second')
          .toString(),
      }
    } catch (error) {
      console.log(error)
    }
  }

  async addExperienceToPlayer(
    playerId: string,
    howManyCardsLeft: number
  ): Promise<void> {
    const experienceForSpotter = getExperienceByCardsLeft(howManyCardsLeft)
    await updatePlayerExperience(playerId, experienceForSpotter)
  }

  dispatchTableChange(gameTable: IGameTable): void {
    if (!gameTable) {
      return
    }
    const { _id, gameStatus, roundStartCountdown, players } = gameTable
    this.io
      .to(_id)
      .emit(TABLE_CHANGE, { gameStatus, roundStartCountdown, players })
  }

  dispatchGameChange(gameRound: IGameRound): void {
    const { tableId } = gameRound
    this.io
      .to(tableId.toHexString())
      .emit(GAME_CHANGE, mapGameRoundData(gameRound))
  }

  async dispatchGameEnd(tableId: string, playerId: string): Promise<void> {
    try {
      const winData = await this.getWinData(tableId)
      const winner = await Player.findOne({ _id: playerId })
      winner.winGames.push(winData)
      winner.save()

      this.io.emit(GAME_END, { winner: winner.nick })

      setTimeout(async () => {
        const updatedTable = await GameTable.findOneAndUpdate(
          { _id: tableId },
          {
            gameStatus: Waiting,
            roundStartCountdown: ROUND_START_COUNTER,
            roundId: null,
          },
          { new: true }
        )
        await GameRound.findOneAndDelete({ tableId })
        this.dispatchTableChange(updatedTable)
      }, 5000)
    } catch (error) {
      this.io.emit(GAME_ERROR, 'ERROR WITH FINISHING THE GAME')
    }
  }

  getFirstDealCards(players: IPlayer[]): FirstCardResult {
    const cards = getCards()
    const centerCard = cards.shift()
    const cardsChunkLength = Math.floor(cards.length / players.length)
    const chunkedCardsArray = chunkArray(cards, cardsChunkLength)

    const cardsByPlayer: CardsByPlayer = {}
    players.forEach((player, index) => {
      const { _id } = player
      const cardsForPlayer = chunkedCardsArray[index]

      cardsByPlayer[_id] = {
        cards: cardsForPlayer,
        numberOfCardsLeft: cardsForPlayer.length,
      }
    })
    return {
      centerCard,
      cardsByPlayer,
    }
  }

  async distributeFirstCards(
    tableId: string,
    players: IPlayer[]
  ): Promise<void> {
    const { centerCard, cardsByPlayer } = this.getFirstDealCards(players)

    const newGameRound = new GameRound({
      gameStatus: Processing,
      isGameRoundInProcess: true,
      tableId,
      players: players,
      centerCard,
      cardsByPlayer,
      spotterId: null,
    })
    await newGameRound.save()

    const updatedGameTable = await GameTable.findOneAndUpdate(
      { _id: tableId },
      {
        $set: {
          roundId: Types.ObjectId(newGameRound._id),
          gameStatus: Processing,
        },
      },
      { new: true }
    )

    this.dispatchTableChange(updatedGameTable)
    this.dispatchGameChange(newGameRound)
  }

  async addPlayerToTable(
    tableId: string,
    playerId: string
  ): Promise<void> {
    try {
      const player = await Player.findOne({ _id: playerId })

      const updatedGameTable = await GameTable.findOneAndUpdate(
        { _id: tableId },
        { $addToSet: { players: player } },
        { new: true }
      )

      if (equals(updatedGameTable.gameStatus, Processing)) {
        const gameRound = await GameRound.findOne({ tableId })
        if (gameRound.players.find(({ _id }) => _id == playerId)) {
          this.dispatchGameChange(gameRound)
        }
      }

      this.dispatchTableChange(updatedGameTable)
    } catch (error) {
      this.io.emit(GAME_ERROR, 'ERROR WHILE JOINING THE TABLE')
    }
  }

  async roundStart(tableId: string): Promise<void> {
    try {
      const gameTable: IGameTable = await GameTable.findOne({
        _id: tableId,
      })
      const { gameStatus } = gameTable

      if (!equals(gameStatus, Waiting)) {
        this.io.emit(GAME_ERROR, 'Not enough players')
        return
      }

      await this.countDownToStartNewRound(gameTable)
    } catch (error) {
      this.io.emit(GAME_ERROR, error.message)
    }
  }

  async countDownToStartNewRound(gameTable: IGameTable): Promise<void> {
    const { _id } = gameTable

    let roundStartTimeLeft = ROUND_START_COUNTER

    const roundCountdown = setInterval(async () => {
      const gameTable = await GameTable.findOne({ _id })
      const { players } = gameTable
      const updatedGameStatus = players.length < 2 ? Joining : Countdown
      const updatedRoundStartTimeLeft = equals(updatedGameStatus, Joining)
        ? ROUND_START_COUNTER
        : roundStartTimeLeft

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

  async spotShape(tableId: string, playerId: string): Promise<void> {
    try {
      const { cardsByPlayer } = await GameRound.findOne({
        tableId: Types.ObjectId(tableId),
      })

      const newCenterCard = cardsByPlayer[playerId].cards.pop()
      const playerCards = cardsByPlayer[playerId].cards
      cardsByPlayer[playerId].numberOfCardsLeft = playerCards.length

      const gameRound: IGameRound = await GameRound.findOneAndUpdate(
        { tableId: Types.ObjectId(tableId) },
        { spotterId: playerId, centerCard: newCenterCard, cardsByPlayer },
        { new: true }
      )

      await this.dispatchGameChange(gameRound)
      await this.addExperienceToPlayer(playerId, playerCards.length)
      playerCards.length === 0 &&
        (await this.dispatchGameEnd(tableId, playerId))
    } catch (error) {
      this.io.emit(GAME_ERROR, error.message)
    }
  }

  async playerLeave(playerId: string, tableId: string): Promise<void> {
    try {
      const table = await GameTable.findOne({ _id: tableId })
      table.players.splice(
        table.players.findIndex(({ _id }) => _id.toString() === playerId),
        1
      )

      if (table.players.length < 2 && table.gameStatus !== Processing) {
        table.gameStatus = Joining
      }

      table.save()
      this.dispatchTableChange(table)
    } catch (error) {
      this.io.emit(GAME_ERROR, 'PLAYER LEAVE ERROR')
    }
  }

  async addMessage(sender: string, content: string): Promise<void> {
    try {
      const senderProfile = await Player.findOne(
        { _id: sender },
        (error) => {
          if (error) {
            return this.io.emit(CHAT_ERROR, 'Something went wrong...')
          }
        }
      )

      const chatMessage = new ChatMessage({
        content,
        sender: senderProfile,
      })

      await chatMessage.save()

      this.io.emit(NEW_MESSAGE, chatMessage)
    } catch (error) {
      this.io.emit(CHAT_ERROR, 'Something went wrong...')
    }
  }

  initializeSocketConnection(): void {
    this.io.on('connection', async (socket) => {
      socket.on(
        NEW_MESSAGE,
        async ({ sender, content }) =>
          await this.addMessage(sender, content)
      )

      socket.on('join', async (connectionData) => {
        const { gameTableId, playerId } = connectionData
        await socket.join(gameTableId)
        await this.addPlayerToTable(gameTableId, playerId)
      })

      socket.on(
        PLAYER_LEAVE,
        async ({ playerId, tableId }) =>
          await this.playerLeave(playerId, tableId)
      )
      socket.on(
        ROUND_START,
        async ({ tableId }) => await this.roundStart(tableId)
      )
      socket.on(
        SPOT_SHAPE,
        async ({ tableId, playerId }) =>
          await this.spotShape(tableId, playerId)
      )
      socket.on(
        GAME_END,
        async ({ tableId, playerId }) =>
          await this.dispatchGameEnd(tableId, playerId)
      )
    })
  }
}

export default WebSocket
