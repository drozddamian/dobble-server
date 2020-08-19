import mongoose, { Document } from 'mongoose'
import Player from './Player'
const Schema = mongoose.Schema
import { IPlayer } from './Player'


export interface IRoom extends Document {
  availableSeats: 2 | 3 | 4 | 5 | 6 | 7 | 8;
  owner: IPlayer[];
  players?: IPlayer[];
}

const PlayerSchema = new Schema({
  availableSeats: {
    type: Number,
    min: 2,
    max: 8,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
  },
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'Room',
  }],
})

const PlayerModel = mongoose.model<IRoom>('Player', PlayerSchema)

export default PlayerModel
