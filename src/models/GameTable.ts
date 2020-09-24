import mongoose, { Document } from 'mongoose'
const Schema = mongoose.Schema
import Player from './Player'
import { IPlayer } from './Player'
import { IRoom } from './Room'


export interface IGameTable extends Document {
  isGameInProcess: Boolean;
  room: IRoom;
  players: IPlayer[];
}

const GameTableSchema = new Schema({
  isGameInProcess: Boolean,
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
