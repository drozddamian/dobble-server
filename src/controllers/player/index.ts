import { isNil } from 'ramda'
import Player from '../../models/Player'


const getUpdateModelData = (newNick: string, newPassword: string) => {
  if (isNil(newNick) && isNil(newPassword)) {
    return null
  }

  return isNil(newNick)
    ? { password: newPassword }
    : { nick: newNick }
}


const playerControllers = {
  get_info: async (req, res) => {
    const { username } = req.params

    const player = await Player.findOne({ username })
    if (!player) {
      res.status(400).send('User not found')
      return
    }

    res.send(player)
  },

  change_data: async (req, res) => {
    const { id, nick, password } = req.body

    const updateModelObject = getUpdateModelData(nick, password)

    if (isNil(updateModelObject)) {
      res.status(400).send('Nothing to update')
      return
    }

    Player.findByIdAndUpdate(
      id,
      updateModelObject,
      function (error) {
        if (error) {
          res.status(400).send('Update failed')
        } else {
          res.send('Data had been updated')
        }
      }
    )
  },

}

export default playerControllers
