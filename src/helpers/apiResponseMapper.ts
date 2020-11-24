import { IPlayer } from '../models/Player'
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
  durationsOfWin: string[];
}

export const mapPlayerData = (player: IPlayer): MappedPlayer => {
  const { _id, username, nick, level, experience, experienceToNextLevel, owningRooms, durationsOfWin, joinedRooms} = player

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
    durationsOfWin,
  }
}

interface MappedRoomsPagination {
  rooms: IRoom[]
  chunkNumber: number;
  howManyChunks: number;
}

export const mapPaginationRooms = (rooms: IRoom[], chunkNumber: number, howManyRooms: number): MappedRoomsPagination => {
  const howManyChunks = Math.ceil(howManyRooms / PAGINATION_CHUNK_SIZE)

  return {
    rooms,
    chunkNumber,
    howManyChunks,
  }
}
