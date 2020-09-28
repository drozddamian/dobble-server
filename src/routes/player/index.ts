import express, { Router } from 'express'
import playerController from '../../controllers/player'
import { API_METHODS } from '../../constants/apiMethods'

const router: Router = express.Router()

const {
  get_player,
  get_podium_players,
  change_player,
} = playerController

router
  .get(API_METHODS.SINGLE_PLAYER, get_player)
  .get(API_METHODS.PODIUM_PLAYERS, get_podium_players)
  .put(API_METHODS.SINGLE_PLAYER, change_player)

export default router
