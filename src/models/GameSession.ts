import mongoose, { Document } from 'mongoose'
const Schema = mongoose.Schema
import Player from './Player'
import { IPlayer } from './Player'
import { IRoom } from './Room'


export interface IGameSession extends Document {
  isGameInProcess: Boolean;
  room: IRoom;
  players: IPlayer[];
}

const GameSessionSchema = new Schema({
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

const GameSessionModel = mongoose.model<IGameSession>('GameSession', GameSessionSchema)

export default GameSessionModel
