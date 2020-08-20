import express from 'express'
import playerController from '../../controllers/player'

const router = express.Router()

const { get_info } = playerController

router.get('/:username', get_info)

export default router
