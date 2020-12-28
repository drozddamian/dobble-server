import mongoose, { Types, Document } from 'mongoose'
import autopopulate from 'mongoose-autopopulate'
import { IPlayer } from './Player'
import { Card, PackOfCards } from '../types'

const Schema = mongoose.Schema

type RoundPlayerData = {
  cards: PackOfCards
  numberOfCardsLeft: number
}

export type CardsByPlayerCollection = {
  [id: string]: RoundPlayerData
}

export interface IGameRound extends Document {
  isGameRoundInProcess: boolean
  centerCard: Card | null
  spotterId: string
  cardsByPlayer: CardsByPlayerCollection
  tableId: Types.ObjectId
  players: IPlayer[]
}

const GameRoundSchema = new Schema({
  isGameRoundInProcess: Boolean,
  centerCard: [],
  cardsByPlayer: {},
  tableId: {
    type: Schema.Types.ObjectId,
    ref: 'GameTable',
  },
  spotterId: {
    type: Schema.Types.ObjectId,
    ref: 'Player',
  },
  players: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      autopopulate: true,
    },
  ],
})

GameRoundSchema.plugin(autopopulate)

const GameRound = mongoose.model<IGameRound>('GameRound', GameRoundSchema)

export default GameRound
