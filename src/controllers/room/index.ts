import { Request, Response, NextFunction } from 'express'
import { isNil } from 'ramda'
import Room from '../../models/Room'
import Player from '../../models/Player'
import GameTable, {GameTableStatus} from '../../models/GameTable'
import { mapPaginationRooms } from '../../helpers/apiResponseMapper'
import { PAGINATION_CHUNK_SIZE } from '../../constants'
import ErrorHandler from '../../helpers/error'



const roomControllers = {
  get_rooms: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chunkNumber = 1 } = req.query
      const numberOfPagesToSkip = (Number(chunkNumber) - 1) * PAGINATION_CHUNK_SIZE

      const rooms = await Room.find()
        .limit(PAGINATION_CHUNK_SIZE)
        .skip(numberOfPagesToSkip)

      const howManyRooms = await Room.countDocuments()
      const mappedRooms = mapPaginationRooms(rooms, Number(chunkNumber), howManyRooms)
      res.send(mappedRooms)

    } catch(error) {
      next(error)
    }
  },

  get_top_five_rooms: async (req: Request, res: Response, next: NextFunction) => {
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

  get_single_room: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const room = await Room.findOne({ _id: id }, (error) => {
        if (error) {
          return next(new ErrorHandler(400, 'Room not found'))
        }
      })
      .populate('owner')
      .populate('players')

      res.send(room)

    } catch (error) {
      next(error)
    }
  },

  create_room: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name: roomName, availableSeats, ownerId } = req.body

      const sameNameRoom = await Room.findOne({ name: roomName })
      if (!isNil(sameNameRoom)) {
        return next(new ErrorHandler(400, 'Room with that name already exists'))
      }

    const player = await Player.findOne({ _id: ownerId })
    if (isNil(player)) {
      return next(new ErrorHandler(400, 'User not found'))
    }

    const room = new Room({
      name: roomName,
      availableSeats,
      owner: ownerId,
      players: [ownerId],
      howManyPlayers: 1,
      gameTable: null,
    })

    const newGameTable = new GameTable({
      room: { ...room },
      GameTableStatus: GameTableStatus.Joining,
    })

    room.gameTable = newGameTable
    player.owningRooms.push(room)
    player.joinedRooms.push(room)

    await newGameTable.save()
    await room.save()
    await player.save()
    res.send(room)

    } catch (error) {
      next(error)
    }
  },

  remove_room: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      await Room.findByIdAndDelete(id, (error, removedRoom) => {
        if (error) {
          return next(new ErrorHandler(400, 'Room not found'))
        }
        res.send(removedRoom)
      })
    } catch (error) {
      next(error)
    }
  },

  join_room: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roomId, playerId } = req.body

      const roomToJoin = await Room.findOne({ _id: roomId }, (error) => {
        if (error) {
          return next(new ErrorHandler(400, 'Room not found'))
        }
      })

      const { howManyPlayers, availableSeats, players } = roomToJoin

      if (howManyPlayers === availableSeats) {
        return next(new ErrorHandler(409, "No seats available"))
      }

      if (players.includes(playerId)) {
        return next(new ErrorHandler(409, "You've already joined the room"))
      }

      const joinPlayer = await Player.findOneAndUpdate(
        { _id: playerId },
        { $push: { joinedRooms: roomToJoin } },
        { new: true }
      )

      roomToJoin.players.push(joinPlayer)
      roomToJoin.howManyPlayers = roomToJoin.players.length
      await roomToJoin.save()

      res.send(joinPlayer)
    } catch (error) {
      next(error)
    }
  },

  leave_room: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roomId, playerId } = req.body

      const leftRoom = await Room.findOne({ _id: roomId }, (error) => {
        if (error) {
          return next(new ErrorHandler(400, 'Room not found'))
        }
      })

      if (!leftRoom.players.includes(playerId)) {
        return next(new ErrorHandler(409, 'Player is not in the room'))
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

      res.send(leftPlayer)

    } catch (error) {
      next(error)
    }
  },
}

export default roomControllers
