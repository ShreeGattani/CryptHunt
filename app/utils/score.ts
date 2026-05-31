import { creepypastaLevels } from "../data/questions";

/**
 * Calculates the total score deterministically based on the current progress state.
 * Both level and question parameters are 1-indexed.
 */
export function calculateScore(currentLevel: number, currentQuestion: number): number {
  let totalScore = 0;
  
  // Sum completed levels
  for (let l = 1; l < currentLevel; l++) {
    const levelData = creepypastaLevels.find(level => level.id === l);
    if (levelData) {
      for (const question of levelData.questions) {
        totalScore += question.points;
      }
    }
  }
  
  // Sum solved questions in the current level
  const currentLevelData = creepypastaLevels.find(level => level.id === currentLevel);
  if (currentLevelData) {
    const solvedCount = currentQuestion - 1;
    for (let i = 0; i < solvedCount && i < currentLevelData.questions.length; i++) {
      totalScore += currentLevelData.questions[i].points;
    }
  }
  
  return totalScore;
}
