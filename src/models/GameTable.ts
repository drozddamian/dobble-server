import mongoose, { Types, Document } from 'mongoose'
const Schema = mongoose.Schema
import autopopulate from 'mongoose-autopopulate'
import { IPlayer } from './Player'
import { IRoom } from './Room'
import { tableStatusUpdate } from './modelsMiddleware/gameTableChange'

export enum GameTableStatus {
  Joining = 'JOINING',
  Waiting = 'WAITING',
  Countdown = 'COUNTDOWN',
  Processing = 'PROCESSING',
}

export interface IGameTable extends Document {
  gameStatus: GameTableStatus
  roundStartCountdown: number
  room: IRoom
  roundId: Types.ObjectId
  players: IPlayer[]
}

const GameTableSchema = new Schema({
  gameStatus: {
    type: String,
    enum: ['JOINING', 'WAITING', 'COUNTDOWN', 'PROCESSING'],
    default: 'JOINING',
  },
  roundStartCountdown: {
    type: Number,
    default: 3,
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
  },
  roundId: {
    type: Schema.Types.ObjectId,
    ref: 'GameRound',
  },
  players: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      autopopulate: true,
    },
  ],
})

GameTableSchema.post('findOneAndUpdate', tableStatusUpdate)
GameTableSchema.plugin(autopopulate)
const GameTableModel = mongoose.model<IGameTable>(
  'GameTable',
  GameTableSchema
)

export default GameTableModel
