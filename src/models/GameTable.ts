import mongoose, { Document } from 'mongoose'
const Schema = mongoose.Schema
import Player from './Player'
import { IPlayer } from './Player'
import { IRoom } from './Room'


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
  roundStartCountdown: Number,
  room: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
  },
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'Player',
  }],
})

const GameTableModel = mongoose.model<IGameTable>('GameTable', GameTableSchema)

export default GameTableModel
