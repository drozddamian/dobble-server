import Room from '../../models/Room'
import { isEmpty, isNil } from 'ramda'
import Player from '../../models/Player'


const roomControllers = {
  get_rooms: async (req, res) => {
    const rooms = await Room.find({})
    if (isEmpty(rooms)) {
      res.status(400).send('Room list is empty')
    } else {
      res.send(rooms)
    }
  },

  get_top_five_rooms: async (req, res) => {
    const topRooms = await Room.find({}).sort({ howManyPlayers: -1 }).limit(5).exec()

    if (isEmpty(topRooms)) {
      res.status(400).send('Room list is empty')
    } else {
      res.send(topRooms)
    }
  },

  get_info: async (req, res) => {
    const { roomId } = req.params
    const room = await Room.find({ _id: roomId })

    if (room) {
      res.send(room)
    } else {
      res.status(400).send('Room not found')
    }
  },

  create_room: async (req, res) => {
    const { availableSeats, ownerId } = req.body

    const player = await Player.findOne({ _id: ownerId })
    if (!player) {
      res.status(400).send('User not found')
      return
    }

    const room = new Room({
      availableSeats,
      owner: player,
      players: [player],
      howManyPlayers: 1,
    })

    try {
      const savedRoom = await room.save()

      player.owningRooms.push(savedRoom)
      player.joinedRooms.push(savedRoom)
      await player.save()

      res.send(savedRoom)
    } catch (error) {
      res.status(500).end(error)
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
  }
}

export default roomControllers
