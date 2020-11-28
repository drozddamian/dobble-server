import { NextFunction, Request, Response } from 'express'
import Chat from '../../models/Chat'
import ErrorHandler from '../../helpers/error'

const chatControllers = {
  get_all_messages: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const gameTable = await Chat.findOne({}, (error) => {
      if (error) {
        return next(new ErrorHandler(400, 'Game table not found'))
      }
    })
    res.send(gameTable)
  },
}

export default chatControllers