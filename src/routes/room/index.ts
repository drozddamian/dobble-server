import express, { Router } from 'express'
import roomController from '../../controllers/room'
import { API_METHODS } from '../../constants/apiMethods'
import validate from '../../helpers/validate'
import validationSchema from '../../validation'
import auth from '../../middleware/auth'

const router: Router = express.Router()

const {
  get_rooms,
  get_single_room,
  get_top_five_rooms,
  create_room,
  remove_room,
  join_room,
  leave_room,
} = roomController

router
  .post(
    API_METHODS.ROOT,
    validationSchema.createRoom,
    validate,
    create_room
  )
  .get(API_METHODS.MOST_POPULAR_ROOMS, get_top_five_rooms)
  .get(API_METHODS.ROOT, get_rooms)
  .get(API_METHODS.SINGLE_ITEM, get_single_room)
  .post(API_METHODS.JOIN_ROOM, auth, join_room)
  .post(API_METHODS.LEAVE_ROOM, auth, leave_room)
  .delete(API_METHODS.SINGLE_ITEM, auth, remove_room)

export default router
