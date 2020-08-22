import express from 'express'
import playerController from '../../controllers/player'

const router = express.Router()

const { get_info, change_data } = playerController

router
  .get('/:username', get_info)
  .put('/change_data', change_data)

export default router
