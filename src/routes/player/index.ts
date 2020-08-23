import express from 'express'
import playerController from '../../controllers/player'
import { API_METHODS } from '../../constants/apiMethods'

const router = express.Router()

const { get_info, change_data } = playerController

router
  .get(API_METHODS.GET_PLAYER, get_info)
  .put(API_METHODS.MODIFY_PLAYER, change_data)

export default router
