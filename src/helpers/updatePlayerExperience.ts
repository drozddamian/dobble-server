import Player from '../models/Player'

type UpdateModel = {
  level: number;
  experience: number;
  experienceToNextLevel: number;
}

const getUpdateModel = (level, experience, experienceToAdd, experienceToNextLevel): UpdateModel => {
  const newExperience = experience + experienceToAdd
  const isAdvancingToNextLevel = newExperience >= experienceToNextLevel

  if (isAdvancingToNextLevel) {
    return {
      level: level + 1,
      experience: newExperience - experienceToNextLevel,
      experienceToNextLevel: experienceToNextLevel + 5,
    }
  }
  return {
    level,
    experience: newExperience,
    experienceToNextLevel
  }
}


export const updatePlayerExperience = async (playerId: string, experienceToAdd: number) => {
  const player = await Player.findOne({ _id: playerId })
  const { level, experience, experienceToNextLevel } = player

  const updateModel = getUpdateModel(level, experience, experienceToAdd, experienceToNextLevel)

  player.level = updateModel.level
  player.experience = updateModel.experience
  player.experienceToNextLevel = updateModel.experienceToNextLevel

  await player.save()
}
