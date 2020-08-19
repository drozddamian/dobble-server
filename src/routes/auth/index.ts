import express from 'express'
import authController from '../../controllers/auth'

const router = express.Router()

const { auth_login, auth_register } = authController

router.post('/login', auth_login)
router.post('/register', auth_register)

export default router
