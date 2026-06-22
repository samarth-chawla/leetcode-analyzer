import { startOfDay, subDays } from 'date-fns'
import type { ProblemCatalog } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type Difficulty = 'Easy' | 'Medium' | 'Hard'
type TopicPlanSource = { topic: string; weaknessScore: number }

const PLAN_SIZE = 3

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

async function getPlanInputs(userId: string, today: Date) {
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
    take: PLAN_SIZE
  })

  const topics: TopicPlanSource[] = weakTopics.length ? weakTopics : [
    { topic: 'Dynamic Programming', weaknessScore: 76 },
    { topic: 'Graphs', weaknessScore: 68 },
    { topic: 'Trees', weaknessScore: 42 }
  ]

  return {
    topics,
    excludedSlugs: new Set(solved.map((row) => row.slug)),
    recentSlugs: new Set(recentPlans.flatMap((plan) => plan.problems.map((problem) => problem.slug)))
  }
}

async function fillPlanSlots(
  dailyPlanId: string,
  topics: TopicPlanSource[],
  excludedSlugs: Set<string>,
  recentSlugs: Set<string>,
  openOrders: number[]
) {
  for (let index = 0; index < openOrders.length; index += 1) {
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
        dailyPlanId,
        title: problem.title,
        slug: problem.slug,
        topic: topicScore.topic,
        difficulty: problem.difficulty,
        leetcodeUrl: problem.leetcodeUrl,
        order: openOrders[index],
        reason: `${topicScore.topic} is one of your highest-impact topics right now.`
      }
    })
  }
}

export async function ensureDailyPlan(userId: string) {
  const today = startOfDay(new Date())
  const existing = await prisma.dailyPlan.findUnique({
    where: { userId_date: { userId, date: today } },
    include: { problems: { orderBy: { order: 'asc' } } }
  })
  if (existing) return existing

  const plan = await prisma.dailyPlan.create({ data: { userId, date: today } })
  const { topics, excludedSlugs, recentSlugs } = await getPlanInputs(userId, today)
  await fillPlanSlots(
    plan.id,
    topics,
    excludedSlugs,
    recentSlugs,
    Array.from({ length: PLAN_SIZE }, (_, index) => index + 1)
  )

  return prisma.dailyPlan.findUniqueOrThrow({
    where: { id: plan.id },
    include: { problems: { orderBy: { order: 'asc' } } }
  })
}

export async function refreshTodayDailyPlan(userId: string) {
  const today = startOfDay(new Date())
  const existing = await prisma.dailyPlan.findUnique({
    where: { userId_date: { userId, date: today } },
    include: { problems: { orderBy: { order: 'asc' } } }
  })

  if (!existing) return ensureDailyPlan(userId)

  const completed = existing.problems.filter((problem) => problem.completed)
  const completedOrders = new Set(completed.map((problem) => problem.order))
  const openOrders = Array.from({ length: PLAN_SIZE }, (_, index) => index + 1).filter(
    (order) => !completedOrders.has(order)
  )

  await prisma.dailyProblem.deleteMany({
    where: { dailyPlanId: existing.id, completed: false }
  })

  const { topics, excludedSlugs, recentSlugs } = await getPlanInputs(userId, today)
  for (const problem of completed) {
    excludedSlugs.add(problem.slug)
    recentSlugs.add(problem.slug)
  }

  await fillPlanSlots(existing.id, topics, excludedSlugs, recentSlugs, openOrders)

  return prisma.dailyPlan.findUniqueOrThrow({
    where: { id: existing.id },
    include: { problems: { orderBy: { order: 'asc' } } }
  })
}
