import mongoose, { Document } from 'mongoose'
import Player from './Player'
const Schema = mongoose.Schema
import { IPlayer } from './Player'
import { roomRemove } from './modelsMiddleware/roomChange'


export interface IRoom extends Document {
  availableSeats: 2 | 3 | 4 | 5 | 6 | 7 | 8;
  owner: IPlayer[];
  players?: IPlayer[];
}

const ROOM_EXPIRATION_DATE = 3600 * 24 * 7

const RoomSchema = new Schema({
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
    ref: 'Player',
  }],
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 3600,
  },
})


RoomSchema.post('findOneAndDelete', roomRemove)

const RoomModel = mongoose.model<IRoom>('Room', RoomSchema)

export default RoomModel
