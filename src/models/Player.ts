import mongoose, { Document } from 'mongoose'
const Schema = mongoose.Schema
import { IRoom } from './Room'

export interface IPlayer extends Document {
  username: string;
  password: string;
  owningRooms?: IRoom[];
  joinedRooms?: IRoom[];
}

const PlayerSchema = new Schema({
  username: {
    type: String,
    required: true,
    index: true,
    minlength: 5,
    maxlength: 18,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
    maxLength: 255,
  },
  owningRooms: [{
    type: Schema.Types.ObjectId,
    ref: 'Room',
  }],
  joinedRooms: [{
    type: Schema.Types.ObjectId,
    ref: 'Room',
  }],
})


const PlayerModel = mongoose.model<IPlayer>('Player', PlayerSchema)

export default PlayerModel
