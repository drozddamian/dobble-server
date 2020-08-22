import Player from '../Player'
import { IRoom } from '../Room'

const roomRemove = async (removedRoom: IRoom) => {
  const { _id: removedRoomId } = removedRoom

  try {
    await Player.updateMany(
      {},
        { $pull: {
          joinedRooms: removedRoomId,
          owningRooms: removedRoomId
        }},
      { multi: true }
    )
  } catch (error) {
    console.log(error)
  }
}


export {
  roomRemove,
}
