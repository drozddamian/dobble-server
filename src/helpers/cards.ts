import PACK_OF_CARDS from '../constants/cards'
import { PackOfCards } from '../types'

const shuffleCards = (cards: PackOfCards): PackOfCards => {
  let shuffleCounter = 0

  while (shuffleCounter < 3) {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * cards.length - 1)
      const temp = cards[i]

      cards[i] = cards[j]
      cards[j] = temp
    }
    shuffleCounter++
  }
  return cards
}

export const getCards = (): PackOfCards => {
  return shuffleCards([...PACK_OF_CARDS])
}
