import express from 'express'
import authController from '../../controllers/auth'
import { API_METHODS } from '../../constants/apiMethods'

const router = express.Router()

const { auth_login, auth_register } = authController

router.post(API_METHODS.LOGIN, auth_login)
router.post(API_METHODS.REGISTER, auth_register)

export default router
