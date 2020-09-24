import { head, isNil } from 'ramda'
import { IGameRound, CardsByPlayerCollection } from '../models/GameRound'
import { Card } from '../types'
import {
  EXP_FOR_SPOTTER,
  EXP_FOR_WINNER,
} from '../constants'


function getExperienceForSpotter(cardsByPlayer: CardsByPlayerCollection, spotterId: string | null): number {
  if (isNil(spotterId)) { return 0 }

  const { numberOfCardsLeft } = cardsByPlayer[spotterId]
  return numberOfCardsLeft === 1 ? EXP_FOR_WINNER : EXP_FOR_SPOTTER
}


type CardsByPlayerId = {
  [id: string]: Card;
}

interface MappedGameRound {
  isGameRoundInProcess: boolean;
  spotterId: string;
  centerCard: Card;
  experienceForSpotter: number;
  cardsByPlayerId: CardsByPlayerId;
}

export const mapGameRoundData = (newGameRound: IGameRound): MappedGameRound => {
  const { isGameRoundInProcess, centerCard, cardsByPlayer, spotterId } = newGameRound

  const experienceForSpotter = getExperienceForSpotter(cardsByPlayer, spotterId)

  const playersInRound = Object.keys(cardsByPlayer)
  let cardsByPlayerId = {}

  playersInRound.forEach((playerId) => {
    const { cards } = cardsByPlayer[playerId]
    cardsByPlayerId[playerId] = head(cards)
  })


  return {
    isGameRoundInProcess,
    spotterId,
    centerCard,
    experienceForSpotter,
    cardsByPlayerId,
  }
}
