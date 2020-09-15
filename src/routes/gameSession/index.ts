import express from 'express'
import gameSessionController from '../../controllers/gameSession'
import { API_METHODS } from '../../constants/apiMethods'

const router = express.Router()

const { get_game_session, join_game_session } = gameSessionController

router
  .get(API_METHODS.SINGLE_GAME_SESSION, get_game_session)
  .post(API_METHODS.ROOT, join_game_session)

export default router
