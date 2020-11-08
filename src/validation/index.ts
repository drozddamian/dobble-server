import { check } from 'express-validator'


const checkUsername = check('username')
  .isLength({ min: 5, max: 18 }).withMessage('Username must contain 5-18 chars.')
  .bail()
  .not().contains(' ').withMessage('Username can not contain whitespace.')

const checkPassword = check('password')
  .isLength({ min: 6, max: 25 }).withMessage('Password must contain 6-25 chars.')
  .bail()
  .not().contains(' ').withMessage('Password can not contain whitespace.')

const checkNickname = check('nick')
  .isString()
  .isLength({ min: 3, max: 14 }).withMessage('Nick must contain 3-14 chars.')
  .bail()

const checkRoomAvailableSeats = check('availableSeats')
  .isInt({ min: 2, max: 6 }).withMessage('You have to provide seats for 2-6 players')
  .bail()

const checkRoomName = check('name')
  .isString()
  .isLength({ min: 3, max: 30 }).withMessage('Room name must contain 3-30 chars.')
  .bail()


const validationSchema = {
  login: [checkUsername, checkPassword],
  register: [checkUsername, checkPassword, checkNickname],
  createRoom: [checkRoomName, checkRoomAvailableSeats],
}

export default validationSchema
