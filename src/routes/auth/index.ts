import express, { Router } from 'express'
import authController from '../../controllers/auth'
import { API_METHODS } from '../../constants/apiMethods'
import validate from '../../helpers/validate'
import validationSchema from '../../validation'

const router: Router = express.Router()

const { login, register, logout } = authController

router.post(API_METHODS.LOGIN, validationSchema.login, validate, login)

router.post(
  API_METHODS.REGISTER,
  validationSchema.register,
  validate,
  register
)

router.post(API_METHODS.LOGOUT, logout)

export default router
