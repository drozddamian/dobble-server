import mongoose, { Document } from 'mongoose'
const Schema = mongoose.Schema
import Player from './Player'
import {
  Card,
  PackOfCards,
} from '../types'


type RoundPlayerData = {
  cards: PackOfCards;
  numberOfCardsLeft: number;
}

export type CardsByPlayerCollection = {
  [id: string]: RoundPlayerData;
}

export interface IGameRound extends Document {
  _id: string;
  isGameRoundInProcess: boolean;
  centerCard: Card | null;
  spotterId: string;
  cardsByPlayer: CardsByPlayerCollection;
  playersId: string[];
}

const GameRoundSchema = new Schema({
  isGameRoundInProcess: Boolean,
  centerCard: [],
  cardsByPlayer: {},
  spotterId: {
    type: Schema.Types.ObjectId,
    ref: 'Player',
  },
  playersId: [{
    type: Schema.Types.ObjectId,
    ref: 'Player',
  }],
})

const GameRound = mongoose.model<IGameRound>('GameRound', GameRoundSchema)

export default GameRound
