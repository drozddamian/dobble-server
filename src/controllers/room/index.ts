import Room from '../../models/Room'
import { isEmpty, isNil } from 'ramda'
import Player from '../../models/Player'
import GameTable from '../../models/GameTable'
import { mapPaginationRooms } from '../../helpers/apiResponseMapper'
import { PAGINATION_CHUNK_SIZE } from '../../constants'
import ErrorHandler from "../../helpers/error";



const roomControllers = {
  get_rooms: async (req, res, next) => {
    try {
      const { chunkNumber = 1 } = req.query

      const rooms = await Room.find()
        .limit(PAGINATION_CHUNK_SIZE)
        .skip((chunkNumber - 1) * PAGINATION_CHUNK_SIZE)

      const howManyRooms = await Room.countDocuments()
      const mappedRooms = mapPaginationRooms(rooms, Number(chunkNumber), howManyRooms)
      res.send(mappedRooms)

    } catch(error) {
      next(error)
    }
  },

  get_top_five_rooms: async (req, res, next) => {
    try {
      const topRooms = await Room.find({})
        .sort({ howManyPlayers: -1 })
        .limit(5)
        .populate('owner')
        .exec()

      res.send(topRooms)

    } catch (error) {
      next(error)
    }
  },

  get_single_room: async (req, res, next) => {
    try {
      const { id } = req.params
      const room = await Room.findOne({ _id: id }, (error) => {
        if (error) {
          next(new ErrorHandler(400, 'Room not found'))
        }
      })
      .populate('owner')
      .populate('players')

      res.send(room)

    } catch (error) {
      next(error)
    }
  },

  create_room: async (req, res, next) => {
    try {
      const { name: roomName, availableSeats, ownerId } = req.body

      const sameNameRoom = await Room.find({ name: roomName })
      if (!isEmpty(sameNameRoom)) {
        next(new ErrorHandler(400, 'Room with that name already exists'))
      }

    const player = await Player.findOne({ _id: ownerId }, (error) => {
      if (error) {
        next(new ErrorHandler(400, 'User not found'))
      }
    })

    const room = new Room({
      name: roomName,
      availableSeats,
      owner: player,
      players: [player],
      howManyPlayers: 1,
      gameTable: null,
    })

    const newGameTable = new GameTable({
      room,
      isGameInProcess: false,
    })

    room.gameTable = newGameTable
    player.owningRooms.push(room)
    player.joinedRooms.push(room)

    await player.save()
    await newGameTable.save()
    await room.save()
    res.send(room)

    } catch (error) {
      next(error)
    }
  },

  remove_room: async (req, res, next) => {
    try {
      const { id } = req.params
      await Room.findByIdAndDelete(id, (error, removedRoom) => {
        if (error) {
          next(new ErrorHandler(400, 'Room not found'))
        }
        res.send({ removed: removedRoom })
      })
    } catch (error) {
      next(error)
    }
  },

  join_room: async (req, res, next) => {
    try {
      const { roomId, playerId } = req.body

      const joinedRoom = await Room.findOne({ _id: roomId }, (error) => {
        if (error) {
          next(new ErrorHandler(400, 'Room not found'))
        }
      })

      if (joinedRoom.players.includes(playerId)) {
        next(new ErrorHandler(409, "You've already joined the room"))
      }

      const joinPlayer = await Player.findOneAndUpdate(
        { _id: playerId },
        { $push: { joinedRooms: joinedRoom } },
        { new: true }
      )

      await joinedRoom.players.push(joinPlayer)
      await joinedRoom.save()
      res.status(200).send({ player: joinPlayer })

    } catch (error) {
      next(error)
    }
  },

  leave_room: async (req, res, next) => {
    try {
      const { roomId, playerId } = req.body

      const leftRoom = await Room.findOne({ _id: roomId }, (error) => {
        if (error) {
          next(new ErrorHandler(400, 'Room not found'))
        }
      })

      if (!leftRoom.players.includes(playerId)) {
        next(new ErrorHandler(409, 'Player is not in the room'))
      }

      await Room.findOneAndUpdate(
        { _id: roomId },
        { $pull: { players: playerId } }
      )

      const leftPlayer = await Player.findOneAndUpdate(
        { _id: playerId },
        { $pull: { joinedRooms: roomId } },
        { new: true }
      )

      res.status(200).send({ player: leftPlayer })

    } catch (error) {
      next(error)
    }
  },
}

export default roomControllers
