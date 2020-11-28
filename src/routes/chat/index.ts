import express, { Router } from 'express'
import chatController from '../../controllers/chat'
import { API_METHODS } from '../../constants/apiMethods'
import auth from '../../middleware/auth'

const router: Router = express.Router()

const { get_all_messages } = chatController

router
  .get(API_METHODS.ROOT, get_all_messages)

export default router