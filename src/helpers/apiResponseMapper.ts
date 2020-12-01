import { IPlayer, WinGame } from '../models/Player'
import { IRoom } from '../models/Room'
import { PAGINATION_CHUNK_SIZE } from '../constants'

interface MappedPlayer {
  _id: string;
  username: string;
  nick: string;
  level: number
  experience: number;
  experienceToNextLevel: number;
  percentToNextLevel: number;
  owningRooms?: IRoom[];
  joinedRooms?: IRoom[];
  winGames: WinGame[];
}

export const mapPlayerData = (player: IPlayer): MappedPlayer => {
  const { _id, username, nick, level, experience, experienceToNextLevel, owningRooms, winGames, joinedRooms} = player

  const percentToNextLevel = Math.floor((experience * 100) / experienceToNextLevel)
  return {
    _id,
    username,
    nick,
    level,
    experience,
    experienceToNextLevel,
    percentToNextLevel,
    owningRooms,
    joinedRooms,
    winGames,
  }
}

interface MappedPaginationData<T> {
  data: Array<T>
  chunkNumber: number;
  howManyChunks: number;
}

export function mapPaginationData<T>(data: T[], chunkNumber: number, howMany: number): MappedPaginationData<T> {
  const howManyChunks = Math.ceil(howMany / PAGINATION_CHUNK_SIZE)

  return {
    data,
    chunkNumber,
    howManyChunks,
  }
}
