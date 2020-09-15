import { isNil } from 'ramda'
import Player from '../Player'
import GameSession from '../GameSession'
import { IRoom } from '../Room'

const roomRemove = async (removedRoom: IRoom) => {
  const removedRoomId = removedRoom?._id
  const removedRoomGameSessionId = removedRoom?.gameSession
  if (isNil(removedRoomId)) {
    return
  }

  try {
    await GameSession.deleteOne({ _id: removedRoomGameSessionId })
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
