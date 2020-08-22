import { isNil } from 'ramda'
import Player from '../Player'
import { IRoom } from '../Room'

const roomRemove = async (removedRoom: IRoom) => {
  const removedRoomId = removedRoom?._id
  if (isNil(removedRoomId)) {
    return
  }

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
