export function performanceScore(weaknessScore: number) {
  return Math.max(0, Math.min(100, 100 - weaknessScore))
}
