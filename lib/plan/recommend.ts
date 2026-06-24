import { differenceInCalendarDays, startOfDay, subDays } from 'date-fns'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ProblemCatalog } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { performanceScore } from '@/lib/analytics/score'

type Difficulty = 'Easy' | 'Medium' | 'Hard'
type TopicPlanSource = { topic: string; score: number }
type SolvedCache = { slugs: Set<string>; problemIds: Set<string> }
type PickedProblem = { problem: ProblemCatalog; reason: string }
type RevisitProblem = {
  slug: string
  title: string
  difficulty: string
  firstAcceptedAt: Date | null
  lastAttemptedAt: Date
  topic: string
}

const PLAN_SIZE = 3
const REVISIT_AFTER_DAYS = 60
const REVISIT_MAX_SCORE = 65
const AI_CANDIDATE_LIMIT = 12
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'

function selectDifficulty(score: number): Difficulty {
  if (score <= 25) return 'Easy'
  if (score <= 55) return 'Medium'
  return 'Hard'
}

function combinedSlugs(...sets: Set<string>[]) {
  return Array.from(new Set(sets.flatMap((set) => Array.from(set))))
}

function difficultyOrder(preferredDifficulty: Difficulty): Difficulty[] {
  return [
    preferredDifficulty,
    preferredDifficulty === 'Hard' ? 'Medium' : 'Easy',
    preferredDifficulty === 'Easy' ? 'Medium' : 'Hard'
  ]
}

function defaultReason(topic: string) {
  return `${topic} is one of your highest-impact topics right now.`
}

function isSolved(problem: Pick<ProblemCatalog, 'slug' | 'problemId'>, solved: SolvedCache) {
  return solved.slugs.has(problem.slug) || solved.problemIds.has(problem.problemId)
}

function unsolvedOnly(problems: ProblemCatalog[], solved: SolvedCache, chosenSlugs: Set<string>) {
  return problems.filter((problem) => !isSolved(problem, solved) && !chosenSlugs.has(problem.slug))
}

async function getCandidateProblems(
  topic: string,
  preferredDifficulty: Difficulty,
  solved: SolvedCache,
  chosenSlugs: Set<string>,
  recentSlugs: Set<string>
) {
  const candidates: ProblemCatalog[] = []
  const seen = new Set<string>()
  const difficulties = difficultyOrder(preferredDifficulty)

  function addRows(rows: ProblemCatalog[]) {
    for (const row of unsolvedOnly(rows, solved, chosenSlugs)) {
      if (seen.has(row.slug)) continue
      seen.add(row.slug)
      candidates.push(row)
      if (candidates.length >= AI_CANDIDATE_LIMIT) return true
    }
    return false
  }

  for (const diff of difficulties) {
    const rows = await prisma.problemCatalog.findMany({
      where: {
        topicTags: { has: topic },
        difficulty: diff,
        isPremium: false,
        slug: { notIn: combinedSlugs(chosenSlugs, recentSlugs) },
        problemId: { notIn: Array.from(solved.problemIds) }
      },
      take: AI_CANDIDATE_LIMIT
    })
    if (addRows(rows)) return candidates
  }

  for (const diff of difficulties) {
    const rows = await prisma.problemCatalog.findMany({
      where: {
        topicTags: { has: topic },
        difficulty: diff,
        isPremium: false,
        slug: { notIn: Array.from(chosenSlugs) },
        problemId: { notIn: Array.from(solved.problemIds) }
      },
      take: AI_CANDIDATE_LIMIT
    })
    if (addRows(rows)) return candidates
  }

  const sameTopic = await prisma.problemCatalog.findMany({
    where: {
      topicTags: { has: topic },
      isPremium: false,
      slug: { notIn: Array.from(chosenSlugs) },
      problemId: { notIn: Array.from(solved.problemIds) }
    },
    take: AI_CANDIDATE_LIMIT
  })
  if (addRows(sameTopic)) return candidates

  const fallback = await prisma.problemCatalog.findMany({
    where: {
      difficulty: 'Medium',
      isPremium: false,
      slug: { notIn: Array.from(chosenSlugs) },
      problemId: { notIn: Array.from(solved.problemIds) }
    },
    take: AI_CANDIDATE_LIMIT
  })
  addRows(fallback)

  return candidates
}

function parseAiPick(text: string) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null

  try {
    const parsed = JSON.parse(match[0]) as { slug?: unknown; reason?: unknown }
    if (typeof parsed.slug !== 'string') return null
    return {
      slug: parsed.slug,
      reason: typeof parsed.reason === 'string' ? parsed.reason.slice(0, 220) : null
    }
  } catch {
    return null
  }
}

async function pickImportantProblemWithAi(
  topic: string,
  score: number,
  preferredDifficulty: Difficulty,
  candidates: ProblemCatalog[]
): Promise<PickedProblem | null> {
  if (!process.env.GEMINI_API_KEY || candidates.length === 0) return null

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })
    const candidatePayload = candidates.map((problem) => ({
      slug: problem.slug,
      title: problem.title,
      difficulty: problem.difficulty,
      tags: problem.topicTags
    }))

    const result = await model.generateContent([
      'Choose the most important unsolved LeetCode problem for today from the provided candidates only.',
      'Return strict JSON only: {"slug":"candidate-slug","reason":"one short reason"}.',
      'Prefer common interview value, topic coverage, and a difficulty that fits the performance score. Lower scores need more work. Do not invent slugs.',
      `Target topic: ${topic}`,
      `Performance score: ${score}/100`,
      `Preferred difficulty: ${preferredDifficulty}`,
      `Candidates: ${JSON.stringify(candidatePayload)}`
    ])

    const pick = parseAiPick(result.response.text())
    if (!pick) return null

    const problem = candidates.find((candidate) => candidate.slug === pick.slug)
    if (!problem) return null

    return {
      problem,
      reason: pick.reason ?? `AI selected this unsolved ${topic} problem as a high-impact next step.`
    }
  } catch (error) {
    console.warn('AI problem recommendation failed; using deterministic planner.', error)
    return null
  }
}

async function pickProblemWithFallback(
  topic: string,
  score: number,
  preferredDifficulty: Difficulty,
  solved: SolvedCache,
  chosenSlugs: Set<string>,
  recentSlugs: Set<string>
): Promise<PickedProblem | null> {
  const candidates = await getCandidateProblems(topic, preferredDifficulty, solved, chosenSlugs, recentSlugs)
  const aiPick = await pickImportantProblemWithAi(topic, score, preferredDifficulty, candidates)
  if (aiPick) return aiPick

  const problem = candidates[0]
  return problem ? { problem, reason: defaultReason(topic) } : null
}

async function pickRevisitProblem(
  userId: string,
  today: Date,
  topics: TopicPlanSource[],
  chosenSlugs: Set<string>,
  recentSlugs: Set<string>
): Promise<RevisitProblem | null> {
  const cutoff = subDays(today, REVISIT_AFTER_DAYS)
  const revisitTopics = topics.filter((topic) => topic.score <= REVISIT_MAX_SCORE)

  for (const topic of revisitTopics) {
    const history = await prisma.problemHistory.findFirst({
      where: {
        userId,
        accepted: true,
        topicTags: { has: topic.topic },
        lastAttemptedAt: { lte: cutoff },
        slug: { notIn: combinedSlugs(chosenSlugs, recentSlugs) }
      },
      orderBy: [
        { lastAttemptedAt: 'asc' },
        { attempts: 'desc' }
      ],
      select: {
        slug: true,
        title: true,
        difficulty: true,
        firstAcceptedAt: true,
        lastAttemptedAt: true
      }
    })

    if (history) return { ...history, topic: topic.topic }
  }

  return null
}

async function getPlanInputs(userId: string, today: Date) {
  const solved = await prisma.problemHistory.findMany({
    where: { userId, accepted: true },
    select: { slug: true, problemId: true }
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

  const topics: TopicPlanSource[] = weakTopics.length
    ? weakTopics.map((topic) => ({ topic: topic.topic, score: performanceScore(topic.weaknessScore) }))
    : [
        { topic: 'Dynamic Programming', score: 24 },
        { topic: 'Graphs', score: 32 },
        { topic: 'Trees', score: 58 }
      ]

  return {
    topics,
    solved: {
      slugs: new Set(solved.map((row) => row.slug)),
      problemIds: new Set(solved.map((row) => row.problemId).filter((id): id is string => Boolean(id)))
    },
    recentSlugs: new Set(recentPlans.flatMap((plan) => plan.problems.map((problem) => problem.slug)))
  }
}

async function createNewProblemSlot(
  dailyPlanId: string,
  topicScore: TopicPlanSource,
  order: number,
  solved: SolvedCache,
  chosenSlugs: Set<string>,
  recentSlugs: Set<string>
) {
  const picked = await pickProblemWithFallback(
    topicScore.topic,
    topicScore.score,
    selectDifficulty(topicScore.score),
    solved,
    chosenSlugs,
    recentSlugs
  )
  if (!picked) return false

  chosenSlugs.add(picked.problem.slug)
  await prisma.dailyProblem.create({
    data: {
      dailyPlanId,
      title: picked.problem.title,
      slug: picked.problem.slug,
      topic: topicScore.topic,
      difficulty: picked.problem.difficulty,
      leetcodeUrl: picked.problem.leetcodeUrl,
      order,
      reason: picked.reason
    }
  })

  return true
}

async function createRevisitSlot(dailyPlanId: string, problem: RevisitProblem, today: Date, order: number) {
  const lastTouchedDays = differenceInCalendarDays(today, problem.lastAttemptedAt)

  await prisma.dailyProblem.create({
    data: {
      dailyPlanId,
      title: problem.title,
      slug: problem.slug,
      topic: problem.topic,
      difficulty: problem.difficulty,
      leetcodeUrl: `https://leetcode.com/problems/${problem.slug}/`,
      order,
      reason: `Revisit: you last touched this ${lastTouchedDays} days ago, and ${problem.topic} still needs attention.`
    }
  })
}

async function fillPlanSlots(
  userId: string,
  dailyPlanId: string,
  today: Date,
  topics: TopicPlanSource[],
  solved: SolvedCache,
  recentSlugs: Set<string>,
  openOrders: number[]
) {
  const chosenSlugs = new Set<string>()
  const revisit = openOrders.length > 0
    ? await pickRevisitProblem(userId, today, topics, chosenSlugs, recentSlugs)
    : null
  const revisitOrder = revisit ? openOrders.at(-1) : undefined
  const newOrders = revisit ? openOrders.slice(0, -1) : openOrders

  for (let index = 0; index < newOrders.length; index += 1) {
    const topicScore = topics[index % topics.length]
    await createNewProblemSlot(
      dailyPlanId,
      topicScore,
      newOrders[index],
      solved,
      chosenSlugs,
      recentSlugs
    )
  }

  if (revisit && revisitOrder) {
    chosenSlugs.add(revisit.slug)
    await createRevisitSlot(dailyPlanId, revisit, today, revisitOrder)
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
  const { topics, solved, recentSlugs } = await getPlanInputs(userId, today)
  await fillPlanSlots(
    userId,
    plan.id,
    today,
    topics,
    solved,
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

  const { topics, solved, recentSlugs } = await getPlanInputs(userId, today)
  for (const problem of completed) {
    solved.slugs.add(problem.slug)
    recentSlugs.add(problem.slug)
  }

  await fillPlanSlots(userId, existing.id, today, topics, solved, recentSlugs, openOrders)

  return prisma.dailyPlan.findUniqueOrThrow({
    where: { id: existing.id },
    include: { problems: { orderBy: { order: 'asc' } } }
  })
}
