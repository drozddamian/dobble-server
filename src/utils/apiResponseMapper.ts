import { IPlayer } from '../models/Player'
import { IRoom } from '../models/Room'

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
