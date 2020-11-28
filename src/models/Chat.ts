import mongoose, { Document } from 'mongoose'
const Schema = mongoose.Schema
import { IPlayer } from './Player'

export type Message = {
  sender: IPlayer;
  content: string;
}

export interface IChat extends Document {
  messages: Message[];
}

const ChatSchema = new Schema({
  messages: [],
})


const ChatModel = mongoose.model<IChat>('Chat', ChatSchema)

export default ChatModel
