import express from 'express'
import roomController from '../../controllers/room'

const router = express.Router()

const { get_rooms, get_info, create_room, remove_room } = roomController

router
  .get('/list', get_rooms)
  .get('/:roomId', get_info)
  .post('/create', create_room)
  .delete('/:roomId', remove_room)


export default router
