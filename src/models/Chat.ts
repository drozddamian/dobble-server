import mongoose, { Document } from 'mongoose'
import autopopulate from 'mongoose-autopopulate'
import { IPlayer } from './Player'

const Schema = mongoose.Schema

export interface IChat extends Document {
  sender: IPlayer
  content: string
}

const MessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
      autopopulate: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
)

MessageSchema.plugin(autopopulate)

const ChatMessageModel = mongoose.model<IChat>('Chat', MessageSchema)

export default ChatMessageModel
