import Room from '../../models/Room'
import { isEmpty } from 'ramda'
import Player from '../../models/Player'


const roomControllers = {
  get_rooms: async (req,res) => {
    const rooms = await Room.find({})
    if (isEmpty(rooms)) {
      res.status(400).send('Room list is empty')
    }
    res.send(rooms)
  },

  get_info: async (req, res) => {
    const { roomId } = req.params
    const room = await Room.find({ _id: roomId })
    if (!room) {
      res.status(400).send('Room not found')
    }
    res.send(room)
  },

  create_room: async (req, res) => {
    const { availableSeats, ownerId } = req.body

    const player = await Player.findOne({ _id: ownerId })
    if (!player) {
      res.status(400).send('User not found')
    }

    const room = new Room({
      availableSeats,
      owner: player,
      players: [player],
    })

    try {
      const savedRoom = await room.save()

      player.owningRooms.push(savedRoom)
      player.joinedRooms.push(savedRoom)
      await player.save()

      res.send(savedRoom)
    } catch (error) {
      res.status(500).send({error})
    }
  },

  remove_room: async (req, res) => {
    const { roomId } = req.params

    const removeResponse = await Room.deleteOne({ _id: roomId })
    res.send({
      removed: removeResponse.deletedCount,
    })
  }
}

export default roomControllers
