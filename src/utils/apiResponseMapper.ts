import { IPlayer } from '../models/Player'
import { IRoom } from '../models/Room'

interface MappedPlayer {
  username: string;
  password: string;
  nick: string;
  owningRooms?: IRoom[];
  joinedRooms?: IRoom[];
}

export const mapPlayerData = (player: IPlayer): MappedPlayer => {
  const { username, password, nick, owningRooms, joinedRooms } = player
  return {
    username,
    password,
    nick,
    owningRooms,
    joinedRooms
  }
}
