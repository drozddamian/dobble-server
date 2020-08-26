import { IPlayer } from '../models/Player'
import { IRoom } from '../models/Room'

interface MappedPlayer {
  username: string;
  nick: string;
  owningRooms?: IRoom[];
  joinedRooms?: IRoom[];
}

export const mapPlayerData = (player: IPlayer): MappedPlayer => {
  const { username, nick, owningRooms, joinedRooms } = player
  return {
    username,
    nick,
    owningRooms,
    joinedRooms
  }
}
