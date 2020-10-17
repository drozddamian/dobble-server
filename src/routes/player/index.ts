import express, { Router } from 'express'
import playerController from '../../controllers/player'
import { API_METHODS } from '../../constants/apiMethods'
import auth from '../../middleware/auth'

const router: Router = express.Router()

const {
  get_player,
  change_player,
} = playerController

router
  .get(API_METHODS.SINGLE_ITEM, auth, get_player)
  .put(API_METHODS.SINGLE_ITEM, auth, change_player)

export default router
