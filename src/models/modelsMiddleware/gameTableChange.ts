import { isNil, equals } from 'ramda'
import { GameTableStatus, IGameTable } from '../GameTable'

const tableStatusUpdate = async (updatedTable: IGameTable): Promise<void> => {
  if (isNil(updatedTable)) { return }

  const { gameStatus, players } = updatedTable
  const howManyPlayers = players.length
  let updateGameStatus = gameStatus

  if (![GameTableStatus.Joining, GameTableStatus.Waiting].includes(gameStatus)) {
    return
  }

  if (equals(gameStatus, GameTableStatus.Joining) && howManyPlayers > 1) {
    updateGameStatus = GameTableStatus.Waiting
  }
  if (equals(gameStatus, GameTableStatus.Waiting) && howManyPlayers < 2) {
    updateGameStatus = GameTableStatus.Joining
  }
  updatedTable.gameStatus = updateGameStatus
  await updatedTable.save()
}


export {
  tableStatusUpdate,
}
