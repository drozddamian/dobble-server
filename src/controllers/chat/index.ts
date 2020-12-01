import { NextFunction, Request, Response } from 'express'
import Chat from '../../models/Chat'
import { CHAT_PAGINATION_CHUNK_SIZE } from '../../constants'
import { mapPaginationData } from '../../helpers/apiResponseMapper'

const chatControllers = {
  get_messages: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { chunkNumber = 1 } = req.query
      const numberOfPagesToSkip = (Number(chunkNumber) - 1) * CHAT_PAGINATION_CHUNK_SIZE

      const messages = await Chat.find({})
        .sort({ createdAt: -1 })
        .limit(CHAT_PAGINATION_CHUNK_SIZE)
        .skip(numberOfPagesToSkip)

      const howManyMessages = await Chat.countDocuments()
      const mappedPaginatedMessages = mapPaginationData(messages, Number(chunkNumber), howManyMessages)

      res.send(mappedPaginatedMessages)
    } catch (error) {
      return next(error)
    }
  },
}

export default chatControllers