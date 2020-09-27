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
}

export const mapPlayerData = (player: IPlayer): MappedPlayer => {
  const { _id, username, nick, level, experience, experienceToNextLevel, owningRooms, joinedRooms} = player

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
    joinedRooms
  }
}

interface MappedRoom {
  _id: string;
  createdAt: Date;
  owner: any;
  players: IPlayer[];
  availableSeats: 2 | 3 | 4 | 5 | 6;
  howManyPlayers: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export const mapRoomData = (room: IRoom): MappedRoom => {
  const { _id, createdAt, owner, players, availableSeats, howManyPlayers } = room
  return {
    _id,
    createdAt,
    owner,
    players,
    availableSeats,
    howManyPlayers,
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
