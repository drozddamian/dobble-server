import { EXP_FOR_SPOTTER, EXP_FOR_WINNER } from '../constants'

export function chunkArray<T> (array: T[], size: number): T[] {
  const chunked_arr = []
  let index = 0
  while (index < array.length) {
    chunked_arr.push(array.slice(index, size + index))
    index += size
  }
  return chunked_arr
}

export function getExperienceByCardsLeft(howManyCardsLeft: number): number {
  return howManyCardsLeft === 1 ? EXP_FOR_WINNER : EXP_FOR_SPOTTER
}

export * from './updatePlayerExperience'
