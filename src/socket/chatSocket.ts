import SocketIO from 'socket.io'
import CHAT_SOCKET_ACTIONS from '../constants/chatSocket'
import Player from '../models/Player'
import Chat, {IChat} from '../models/Chat'

const {
  NEW_MESSAGE,
  CHAT_ERROR,
} = CHAT_SOCKET_ACTIONS

class GameSocket {
  io: SocketIO.Server;

  constructor(app) {
    this.io = SocketIO().listen(90)
    this.initializeSocketConnection()
  }

  async addMessage(sender: string, content: string): Promise<void> {
    try {
      let chat: IChat = await Chat.findOne({})

      if (!chat) {
        chat = new Chat()
        await chat.save()
      }

      const senderProfile = await Player.findOne({ _id: sender }, (error) => {
        if (error) {
          return this.io.emit(CHAT_ERROR, 'Something went wrong...')
        }
      })

      const newMessage = {
        content,
        sender: senderProfile,
      }

      chat.messages.push(newMessage)
      await chat.save()

      this.io.emit(NEW_MESSAGE, newMessage)
    } catch (error) {
      this.io.emit(CHAT_ERROR, 'Something went wrong...')
    }
  }

  initializeSocketConnection(): void {
    this.io.on('connection', async (socket) => {
      socket.on(NEW_MESSAGE, async ({ sender, content }) => await this.addMessage(sender, content))
    })
  }
}

export default GameSocket
