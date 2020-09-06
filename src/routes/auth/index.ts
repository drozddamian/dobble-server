import express from 'express'
import authController from '../../controllers/auth'
import { API_METHODS } from '../../constants/apiMethods'

const router = express.Router()

const { login, register, logout } = authController

router.post(API_METHODS.LOGIN, login)
router.post(API_METHODS.REGISTER, register)
router.post(API_METHODS.LOGOUT, logout)


export default router
