import SocketIO from 'socket.io'
import CHAT_SOCKET_ACTIONS from '../constants/chatSocket'
import Player from '../models/Player'
import ChatMessage from '../models/Chat'

const { NEW_MESSAGE, CHAT_ERROR } = CHAT_SOCKET_ACTIONS

class GameSocket {
  io: SocketIO.Server

  constructor(server) {
    this.io = SocketIO(server)
    this.initializeSocketConnection()
  }

  async addMessage(sender: string, content: string): Promise<void> {
    try {
      const senderProfile = await Player.findOne(
        { _id: sender },
        (error) => {
          if (error) {
            return this.io.emit(CHAT_ERROR, 'Something went wrong...')
          }
        }
      )

      const chatMessage = new ChatMessage({
        content,
        sender: senderProfile,
      })

      await chatMessage.save()

      this.io.emit(NEW_MESSAGE, chatMessage)
    } catch (error) {
      this.io.emit(CHAT_ERROR, 'Something went wrong...')
    }
  }

  initializeSocketConnection(): void {
    this.io.on('connection', async (socket) => {
      socket.on(
        NEW_MESSAGE,
        async ({ sender, content }) =>
          await this.addMessage(sender, content)
      )
    })
  }
}

export default GameSocket
