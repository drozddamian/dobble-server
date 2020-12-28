import { isNil } from 'ramda'
import Player from '../Player'
import GameTable from '../GameTable'
import { IRoom } from '../Room'

const roomRemove = async (removedRoom: IRoom): Promise<void> => {
  const removedRoomId = removedRoom?._id
  const removedRoomTableId = removedRoom?.gameTable
  if (isNil(removedRoomId)) {
    return
  }

  try {
    await GameTable.deleteOne({ _id: removedRoomTableId })
    await Player.updateMany(
      {},
      {
        $pull: {
          joinedRooms: removedRoomId,
          owningRooms: removedRoomId,
        },
      },
      { multi: true }
    )
  } catch (error) {
    console.log(error)
  }
}

export { roomRemove }
