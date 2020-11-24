import SocketIO from 'socket.io'
import dayjs from 'dayjs'
import { Types } from 'mongoose'
import { equals } from 'ramda'
import GameTable, {GameTableStatus, IGameTable} from '../models/GameTable'
import GameRound, {IGameRound} from '../models/GameRound'
import Player, {IPlayer} from '../models/Player'
import GAME_SOCKET_ACTIONS from '../constants/gameSocket'
import {getCards} from '../helpers/cards'
import {Card, CardsByPlayer, PackOfCards} from '../types'
import {mapGameRoundData} from '../helpers/socketResponseMapper'
import {chunkArray, getExperienceByCardsLeft, updatePlayerExperience} from '../helpers'


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

type FirstCardResult = {
  centerCard: Card;
  cardsByPlayer: CardsByPlayer;
}

const ROUND_START_COUNTER = 3

class GameSocket {
  io: SocketIO.Server;
  cards: PackOfCards;

  constructor(app) {
    this.io = SocketIO().listen(80)
    this.cards = getCards()
    this.initializeSocketConnection()
  }

  async getDurationOfRound(tableId: string): Promise<string> {
    try {
      const gameFinishDate = dayjs()
      const { _id } = await GameRound.findOne({ tableId: tableId })
      const roundStartDate = dayjs(_id.getTimestamp())

      return gameFinishDate.diff(roundStartDate, 'second').toString()
    } catch (error) {
      console.log(error)
    }
  }

  async addExperienceToPlayer(playerId: string, howManyCardsLeft: number): Promise<void> {
    const experienceForSpotter = getExperienceByCardsLeft(howManyCardsLeft)
    await updatePlayerExperience(playerId, experienceForSpotter)
  }

  dispatchTableChange(gameTable: IGameTable): void {
    if (!gameTable) { return }
    const { _id, gameStatus, roundStartCountdown, players } = gameTable
    this.io.to(_id).emit(TABLE_CHANGE, { gameStatus, roundStartCountdown, players })
  }

  dispatchGameChange(gameRound: IGameRound): void {
    const { tableId } = gameRound
    this.io.to(tableId.toHexString()).emit(GAME_CHANGE, mapGameRoundData(gameRound))
  }

  async dispatchGameEnd(tableId: string, playerId: string): Promise<void> {
    try {
      const durationOfRound = await this.getDurationOfRound(tableId)
      const winner = await Player.findOne({ _id: playerId })
      winner.durationsOfWin.push(durationOfRound)
      winner.save()

      this.io.emit(GAME_END, { winner: winner.nick })

      setTimeout(async () => {
        const updatedTable = await GameTable.findOneAndUpdate(
          {_id: tableId},
          {gameStatus: Waiting, roundStartCountdown: ROUND_START_COUNTER, roundId: null},
          {'new': true}
        )
        await GameRound.findOneAndDelete({tableId})
        this.dispatchTableChange(updatedTable)
      }, 5000)
    } catch (error) {
      this.io.emit(GAME_ERROR, 'ERROR WITH FINISHING THE GAME')
    }
  }

  getFirstDealCards(players: IPlayer[]): FirstCardResult {
    const centerCard = this.cards.shift()
    const cardsChunkLength = this.cards.length / players.length
    const chunkedCardsArray = chunkArray(this.cards, cardsChunkLength)

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

  async distributeFirstCards(tableId: string, players: IPlayer[]): Promise<void> {
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
      { $set: {
        roundId: Types.ObjectId(newGameRound._id),
        gameStatus: Processing,
      }},
      { 'new': true }
    )

    this.dispatchTableChange(updatedGameTable)
    this.dispatchGameChange(newGameRound)
  }

  async addPlayerToTable(tableId: string, playerId: string): Promise<void> {
    try {
      const player = await Player.findOne({ _id: playerId })

      const updatedGameTable = await GameTable.findOneAndUpdate(
        { _id: tableId },
        { $addToSet: { players: player } },
        { 'new': true }
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
      const gameTable: IGameTable = await GameTable.findOne({ _id: tableId })
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

  async spotShape(tableId: string, playerId: string): Promise<void> {
    try {
      const { cardsByPlayer } = await GameRound.findOne({
        tableId: Types.ObjectId(tableId)
      })

      const newCenterCard = cardsByPlayer[playerId].cards.pop()
      const playerCards = cardsByPlayer[playerId].cards
      const howManyCardsLeft = playerCards.length - 1
      cardsByPlayer[playerId].numberOfCardsLeft = howManyCardsLeft

      const gameRound: IGameRound = await GameRound.findOneAndUpdate(
        { tableId: Types.ObjectId(tableId) },
        { spotterId: playerId, centerCard: newCenterCard, cardsByPlayer },
        { 'new': true }
      )

      await this.dispatchGameChange(gameRound)
      await this.addExperienceToPlayer(playerId, playerCards.length)
      howManyCardsLeft === 0 && await this.dispatchGameEnd(tableId, playerId)

    } catch (error) {
      this.io.emit(GAME_ERROR, error.message)
    }
  }

  async playerLeave(playerId: string, tableId: string): Promise<void> {
    try {
      const updatedTable = await GameTable.findOneAndUpdate(
        { _id: tableId },
        { $pull: { players : playerId } },
        { 'new': true }
      )
      this.dispatchTableChange(updatedTable)
    } catch (error) {
      this.io.emit(GAME_ERROR, 'PLAYER LEAVE ERROR')
    }
  }

  initializeSocketConnection(): void {
    this.io.on('connection', async (socket) => {
      socket.on('join', async (connectionData) => {
        const { gameTableId, playerId } = connectionData
        await socket.join(gameTableId);
        await this.addPlayerToTable(gameTableId, playerId)
      });

      socket.on(PLAYER_LEAVE, async ({ playerId, tableId }) => await this.playerLeave(playerId, tableId))
      socket.on(ROUND_START, async ({ tableId }) => await this.roundStart(tableId))
      socket.on(SPOT_SHAPE, async ({ tableId, playerId }) => await this.spotShape(tableId, playerId))
      socket.on(GAME_END, async ({ tableId, playerId }) => await this.dispatchGameEnd(tableId, playerId))
    })
  }
}

export default GameSocket
