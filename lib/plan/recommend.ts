import { startOfDay, subDays } from 'date-fns'
import type { ProblemCatalog } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type Difficulty = 'Easy' | 'Medium' | 'Hard'

function selectDifficulty(score: number): Difficulty {
  if (score >= 75) return 'Easy'
  if (score >= 45) return 'Medium'
  return 'Hard'
}

async function pickProblemWithFallback(
  topic: string,
  preferredDifficulty: Difficulty,
  excludedSlugs: Set<string>,
  recentSlugs: Set<string>
): Promise<ProblemCatalog | null> {
  const difficulties: Difficulty[] = [
    preferredDifficulty,
    preferredDifficulty === 'Hard' ? 'Medium' : 'Easy',
    preferredDifficulty === 'Easy' ? 'Medium' : 'Hard'
  ]

  for (const diff of difficulties) {
    const problem = await prisma.problemCatalog.findFirst({
      where: {
        topicTags: { has: topic },
        difficulty: diff,
        isPremium: false,
        slug: { notIn: [...Array.from(excludedSlugs), ...Array.from(recentSlugs)] }
      }
    })
    if (problem) return problem
  }

  for (const diff of difficulties) {
    const problem = await prisma.problemCatalog.findFirst({
      where: {
        topicTags: { has: topic },
        difficulty: diff,
        isPremium: false,
        slug: { notIn: Array.from(excludedSlugs) }
      }
    })
    if (problem) return problem
  }

  const sameTopic = await prisma.problemCatalog.findFirst({
    where: {
      topicTags: { has: topic },
      isPremium: false,
      slug: { notIn: Array.from(excludedSlugs) }
    }
  })
  if (sameTopic) return sameTopic

  return prisma.problemCatalog.findFirst({
    where: {
      difficulty: 'Medium',
      isPremium: false,
      slug: { notIn: Array.from(excludedSlugs) }
    }
  })
}

export async function ensureDailyPlan(userId: string) {
  const today = startOfDay(new Date())
  const existing = await prisma.dailyPlan.findUnique({
    where: { userId_date: { userId, date: today } },
    include: { problems: { orderBy: { order: 'asc' } } }
  })
  if (existing) return existing

  const solved = await prisma.problemHistory.findMany({
    where: { userId, accepted: true },
    select: { slug: true }
  })
  const recentPlans = await prisma.dailyPlan.findMany({
    where: { userId, date: { gte: subDays(today, 7) } },
    include: { problems: true }
  })
  const weakTopics = await prisma.topicScore.findMany({
    where: { userId },
    orderBy: { weaknessScore: 'desc' },
    take: 3
  })

  const excludedSlugs = new Set(solved.map((row) => row.slug))
  const recentSlugs = new Set(recentPlans.flatMap((plan) => plan.problems.map((problem) => problem.slug)))
  const plan = await prisma.dailyPlan.create({ data: { userId, date: today } })
  const topics = weakTopics.length ? weakTopics : [
    { topic: 'Dynamic Programming', weaknessScore: 76 },
    { topic: 'Graphs', weaknessScore: 68 },
    { topic: 'Trees', weaknessScore: 42 }
  ]

  for (let index = 0; index < 3; index += 1) {
    const topicScore = topics[index % topics.length]
    const problem = await pickProblemWithFallback(
      topicScore.topic,
      selectDifficulty(topicScore.weaknessScore),
      excludedSlugs,
      recentSlugs
    )
    if (!problem) continue

    excludedSlugs.add(problem.slug)
    await prisma.dailyProblem.create({
      data: {
        dailyPlanId: plan.id,
        title: problem.title,
        slug: problem.slug,
        topic: topicScore.topic,
        difficulty: problem.difficulty,
        leetcodeUrl: problem.leetcodeUrl,
        order: index + 1,
        reason: `${topicScore.topic} is one of your highest-impact topics right now.`
      }
    })
  }

  return prisma.dailyPlan.findUniqueOrThrow({
    where: { id: plan.id },
    include: { problems: { orderBy: { order: 'asc' } } }
  })
}
