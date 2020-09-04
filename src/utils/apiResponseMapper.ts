import { last } from 'ramda'
import { IPlayer } from '../models/Player'
import { IRoom } from '../models/Room'
import { PAGINATION_CHUNK_SIZE } from '../constants'

interface MappedPlayer {
  id: string;
  username: string;
  nick: string;
  owningRooms?: IRoom[];
  joinedRooms?: IRoom[];
}

export const mapPlayerData = (player: IPlayer): MappedPlayer => {
  const { _id, username, nick, owningRooms, joinedRooms } = player
  return {
    id: _id,
    username,
    nick,
    owningRooms,
    joinedRooms
  }
}

interface MappedRoom {
  id: string;
  createdAt: Date;
  owner: any;
  players: IPlayer[];
  availableSeats: 2 | 3 | 4 | 5 | 6;
  howManyPlayers: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export const mapRoomData = (room: IRoom): MappedRoom => {
  const { _id, createdAt, owner, players, availableSeats, howManyPlayers } = room
  return {
    id: _id,
    createdAt,
    owner,
    players,
    availableSeats,
    howManyPlayers,
  }
}

interface MappedRoomsPagination {
  rooms: IRoom[]
  currentChunkNumber: number;
  howManyChunks: number;
}

export const mapPaginationRooms = (rooms: IRoom[], currentChunkNumber: number, howManyRooms: number): MappedRoomsPagination => {
  const howManyChunks = Math.ceil(howManyRooms / PAGINATION_CHUNK_SIZE)

  return {
    rooms,
    currentChunkNumber,
    howManyChunks,
  }
}
