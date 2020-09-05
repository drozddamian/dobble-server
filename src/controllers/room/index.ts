import Room from '../../models/Room'
import { isEmpty, isNil, equals } from 'ramda'
import Player from '../../models/Player'
import { mapPaginationRooms } from '../../utils/apiResponseMapper'
import { PAGINATION_CHUNK_SIZE } from '../../constants'



const roomControllers = {
  get_rooms: async (req, res) => {
    const { chunkNumber = 1 } = req.query

    try {
      const rooms = await Room.find()
        .limit(PAGINATION_CHUNK_SIZE)
        .skip((chunkNumber - 1) * PAGINATION_CHUNK_SIZE)

      const howManyRooms = await Room.countDocuments()

      if (isEmpty(rooms)) {
        res.status(400).send('Room list is empty')
      } else {
        const mappedRooms = mapPaginationRooms(rooms, Number(chunkNumber), howManyRooms)
        res.send(mappedRooms)
      }
    } catch(error) {
      res.status(500).send(error.message)
    }
  },

  get_top_five_rooms: async (req, res) => {
    const topRooms = await Room.find({})
      .sort({ howManyPlayers: -1 })
      .limit(5)
      .populate('owner')
      .exec()

    if (isEmpty(topRooms)) {
      res.status(400).send('Room list is empty')
    } else {
      res.send(topRooms)
    }
  },

  get_info: async (req, res) => {
    const { roomId } = req.params
    const room = await Room.find({ _id: roomId })
      .populate('owner')
      .populate('players')

    if (room) {
      res.send(room)
    } else {
      res.status(400).send('Room not found')
    }
  },

  create_room: async (req, res) => {
    const { name: roomName, availableSeats, ownerId } = req.body

    const sameNameRoom = await Room.find({ name: roomName })
    if (!isEmpty(sameNameRoom)) {
      res.status(400).send('Room with that name already exists')
      return
    }

    const player = await Player.findOne({ _id: ownerId })
    if (!player) {
      res.status(400).send('User not found')
      return
    }

    const room = new Room({
      name: roomName,
      availableSeats,
      owner: player,
      players: [player],
      howManyPlayers: 1,
    })

    try {
      player.owningRooms.push(room)
      player.joinedRooms.push(room)
      await player.save()
      await room.save()
      res.send(room)
    } catch (error) {
      res.status(500).send(error.message)
    }
  },

  remove_room: async (req, res) => {
    const { roomId } = req.params

    const removeResponse = await Room.findByIdAndDelete(roomId)

    if (isNil(removeResponse)) {
      res.status(400).send('Room not found')
    } else {
      res.send({
        removed: removeResponse,
      })
    }
  },

  join_room: async (req, res) => {
    const { roomId, playerId } = req.body

    const joinedRoom = await Room.findOne({ _id: roomId })
    if (!joinedRoom) {
      res.status(400).send('Room not found')
      return
    }
    if (joinedRoom.players.includes(playerId)) {
      res.status(409).send("You've already joined the room")
    }

    try {
      const player = await Player.findOneAndUpdate(
        { _id: playerId },
        { $push: { joinedRooms: joinedRoom } }
      )

      await joinedRoom.players.push(player)
      await joinedRoom.save()
      res.status(200).send('Success')
    } catch (error) {
      res.status(500).end(error.message)
    }
  },

  leave_room: async (req, res) => {
    const { roomId, playerId } = req.body

    const leftRoom = await Room.findOne({ _id: roomId })
    if (!leftRoom) {
      res.status(400).send('Room not found')
      return
    }
    if (!leftRoom.players.includes(playerId)) {
      res.status(409).send('Player is not in the room')
    }

    try {
      await Player.findOneAndUpdate(
        { _id: playerId },
        { $pull: { joinedRooms: roomId } }
      )

      await Room.findOneAndUpdate(
        { _id: roomId },
        { $pull: { players: playerId } }
      )
      res.status(200).send('Success')
    } catch (error) {
      res.status(500).send(error.message)
    }
  },
}

export default roomControllers
