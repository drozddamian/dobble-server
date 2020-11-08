
type CARD_SYMBOL = 'ANCHOR' | 'APPLE' | 'BABY_BOTTLE' | 'BOMB' | 'CACTUS' | 'CANDLE' | 'CARROT' | 'CHEESE' | 'CHESS_KNIGHT' |
    'CLOCK' | 'CLOWN' | 'CROSSHAIR' | 'DIASY_FLOWER' | 'DINOSAUR' | 'DOG' | 'DOLPHIN' | 'DRAGON' | 'EXCLAMATION_MARK' | 'EYE' | 'FIRE' |
    'FOUR_LEAF_CLOVER' | 'GHOST' | 'GREEN_SPLATS' | 'HAMMER' | 'HEART' | 'ICE_CUBE' | 'IGLOO' | 'KEY' | 'LADYBIRD' | 'LIGHT_BULB' |
    'LIGHTNING_BOLT' | 'LOCK' | 'MAPLE_LEAF' | 'MOON' | 'NO_ENTRY_SIGN' | 'ORANGE_SCARECROW_MAN' | 'PENCIL' | 'FLAMINGO' | 'CAT' |
    'LIKE' | 'QUESTION_MARK' | 'RED_LIPS' | 'SCISSORS' | 'SKULL_AND_CROSSBONES' | 'SNOWFLAKE' | 'SNOWMAN' | 'SPIDER' | 'SPIDER_WEB' |
    'SUN' | 'SUNGLASSES' | 'TAXI_CAR' | 'TORTOISE' | 'TREBLE_CLEF' | 'TREE' |'WATER_DROP' | 'YIN_AND_YANG' | 'ZEBRA';

export type PackOfCards = Array<CARD_SYMBOL[]>

export type Card = CARD_SYMBOL[]

type PlayerCards = {
  cards: Card,
  numberOfCardsLeft: number,
}
export type CardsByPlayer = {[id: string]: PlayerCards}
