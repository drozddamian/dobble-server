import express from 'express'
import roomController from '../../controllers/room'
import { API_METHODS } from '../../constants/apiMethods'

const router = express.Router()

const { get_rooms, get_info, get_top_five_rooms, create_room, remove_room, join_room, leave_room } = roomController

router
  .get(API_METHODS.GET_MOST_POPULAR_ROOMS, get_top_five_rooms)
  .get(API_METHODS.GET_ROOMS, get_rooms)
  .get(API_METHODS.GET_ROOM, get_info)
  .post(API_METHODS.CREATE_ROOM, create_room)
  .post(API_METHODS.JOIN_ROOM, join_room)
  .post(API_METHODS.LEAVE_ROOM, leave_room)
  .delete(API_METHODS.DELETE_ROOM, remove_room)


export default router
