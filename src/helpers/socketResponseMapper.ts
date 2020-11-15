import { Types } from 'mongoose'
import { last, isNil } from 'ramda'
import { IGameRound, CardsByPlayerCollection } from '../models/GameRound'
import { Card } from '../types'
import { getExperienceByCardsLeft } from './index'


function getExperienceForSpotter(cardsByPlayer: CardsByPlayerCollection, spotterId: string | null): number {
  if (isNil(spotterId)) { return 0 }

  const { numberOfCardsLeft } = cardsByPlayer[spotterId]
  return getExperienceByCardsLeft(numberOfCardsLeft)
}


type CardsByPlayerId = {
  [id: string]: Card;
}

interface MappedGameRound {
  id: string;
  tableId: Types.ObjectId;
  isGameRoundInProcess: boolean;
  spotterId: string;
  centerCard: Card;
  experienceForSpotter: number;
  cardsByPlayerId: CardsByPlayerId;
}

export const mapGameRoundData = (newGameRound: IGameRound): MappedGameRound => {
  const { _id, isGameRoundInProcess, centerCard, cardsByPlayer, spotterId, tableId } = newGameRound

  const experienceForSpotter = getExperienceForSpotter(cardsByPlayer, spotterId)

  const playersInRound = Object.keys(cardsByPlayer)
  const cardsByPlayerId = {}

  playersInRound.forEach((playerId) => {
    const { cards } = cardsByPlayer[playerId]
    cardsByPlayerId[playerId] = last(cards)
  })


  return {
    id: _id,
    tableId,
    isGameRoundInProcess,
    spotterId,
    centerCard,
    experienceForSpotter,
    cardsByPlayerId,
  }
}
