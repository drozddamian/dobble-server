import mongoose, { Document } from 'mongoose'
const Schema = mongoose.Schema
import { IPlayer } from './Player'
import { IRoom } from './Room'
import { tableStatusUpdate } from './modelsMiddleware/gameTableChange'

export enum GameTableStatus {
  Joining = "JOINING",
  Waiting = "WAITING",
  Countdown = "COUNTDOWN",
  Processing = "PROCESSING",
}

export interface IGameTable extends Document {
  gameStatus: GameTableStatus;
  roundStartCountdown: number;
  room: IRoom;
  players: IPlayer[];
}

const GameTableSchema = new Schema({
  gameStatus: {
    type: String,
    enum: ["JOINING", "WAITING", "COUNTDOWN", "PROCESSING"],
    default: "JOINING",
  },
  roundStartCountdown: {
    type: Number,
    default: 3,
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
  },
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'Player',
  }],
})

GameTableSchema.post('findOneAndUpdate', tableStatusUpdate)
const GameTableModel = mongoose.model<IGameTable>('GameTable', GameTableSchema)

export default GameTableModel
