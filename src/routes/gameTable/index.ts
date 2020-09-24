import express from 'express'
import gameTableController from '../../controllers/gameTable'
import { API_METHODS } from '../../constants/apiMethods'

const router = express.Router()

const { get_game_table, join_game_table } = gameTableController

const gameTableRouter = (socketIo) => {
  return router
    .get(API_METHODS.SINGLE_GAME_TABLE, get_game_table)
    .post(API_METHODS.ROOT, join_game_table(socketIo))
}

export default gameTableRouter
