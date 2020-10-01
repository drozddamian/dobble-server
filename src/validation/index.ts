import { check } from 'express-validator'


const validationSchema = {
  login: [
    check('username').trim().not().isEmpty().withMessage('Username is required.'),
    check('password').trim().not().isEmpty().withMessage('Password is required.'),
  ]
}

export default validationSchema
