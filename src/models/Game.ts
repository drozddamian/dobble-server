import mongoose, { Document } from 'mongoose'
const Schema = mongoose.Schema
import Player from './Player'
import { IPlayer } from './Player'


export interface IGame extends Document {
  winner?: IPlayer;
  players: IPlayer[];
}

const GameSchema = new Schema({
  winner: {
    type: Schema.Types.ObjectId,
    ref: 'Player',
  },
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'Player',
  }],
})

const GameModel = mongoose.model<IGame>('Game', GameSchema)

export default GameModel
