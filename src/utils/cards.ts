import PACK_OF_CARDS from '../constants/cards'


const shuffleCards = (cards: any) => {
  const swappingTimes = Math.floor((Math.random() * 5) + 5)
  for (let shuffleCounter = 0; shuffleCounter < swappingTimes; shuffleCounter++) {
    for (let i = cards.length - 1; i > 0; i--) {
      let j =  Math.floor(Math.random() * (cards.length - 1));
      [cards[i], cards[j]] = [cards[j], cards[i]]
    }
  }
  return cards
}


export const getCards = () => {
  const shuffledCards = shuffleCards(PACK_OF_CARDS)

  const firstTableCard = shuffledCards[shuffledCards.length - 1]
  shuffledCards.pop()

  return {
    firstTableCard,
    cards: shuffledCards,
  }
}
