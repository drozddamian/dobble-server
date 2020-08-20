import Player from '../Player'
import { IRoom } from '../Room'

const roomRemove = async (removedRoom: IRoom) => {
  const { _id: removedRoomId } = removedRoom

  //TODO Remove element from array
  try {
    await Player.updateMany({}, { $pullAll: { joinedRooms: [removedRoomId] } })
    await Player.updateMany({}, { $pullAll: { owningRooms: [removedRoomId] } })
  } catch (error) {
    console.log(error)
  }
}


export {
  roomRemove,
}
