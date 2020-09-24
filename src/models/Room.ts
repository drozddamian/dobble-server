import mongoose, { Document } from 'mongoose'
import Player from './Player'
const Schema = mongoose.Schema
import { IPlayer } from './Player'
import { IGameTable } from './GameTable'
import { roomRemove } from './modelsMiddleware/roomChange'


export interface IRoom extends Document {
  name: string;
  availableSeats: 2 | 3 | 4 | 5 | 6;
  owner: IPlayer[];
  players?: IPlayer[];
  gameTable: IGameTable;
  howManyPlayers: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  createdAt: Date;
}

const ROOM_EXPIRATION_DATE = 3600 * 24 * 7

const RoomSchema = new Schema({
  name: {
    type: String,
    minlength: 3,
    maxLength: 30,
    required: true,
  },
  availableSeats: {
    type: Number,
    min: 2,
    max: 6,
    required: true,
  },
  gameTable: {
    type: Schema.Types.ObjectId,
    ref: 'GameTable',
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
  howManyPlayers: {
    type: Number,
    max: 6,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    //expires: 3600,
  },
})


RoomSchema.post('findOneAndDelete', roomRemove)

const RoomModel = mongoose.model<IRoom>('Room', RoomSchema)

export default RoomModel
