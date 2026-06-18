import { prisma } from '@/lib/prisma'

function topicStatus(score: number) {
  if (score >= 60) return 'weak' as const
  if (score >= 35) return 'needs_work' as const
  return 'strong' as const
}

export async function rebuildProblemHistory(userId: string) {
  const submissions = await prisma.submission.findMany({
    where: { userId },
    orderBy: { timestamp: 'asc' }
  })

  const bySlug = new Map<string, typeof submissions>()
  for (const submission of submissions) {
    if (!submission.slug) continue
    bySlug.set(submission.slug, [...(bySlug.get(submission.slug) ?? []), submission])
  }

  await prisma.problemHistory.deleteMany({ where: { userId } })

  for (const [slug, attempts] of bySlug) {
    const accepted = attempts.find((attempt) => attempt.statusDisplay === 'Accepted')
    const first = attempts[0]
    await prisma.problemHistory.upsert({
      where: {
        userId_slug: {
          userId,
          slug
        }
      },
      update: {
        problemId: first.problemId,
        title: first.title,
        difficulty: first.difficulty,
        topicTags: first.topicTags,
        attempts: attempts.length,
        accepted: Boolean(accepted),
        firstAcceptedAt: accepted?.timestamp,
        lastAttemptedAt: attempts.at(-1)?.timestamp ?? first.timestamp,
        firstAttemptRate: accepted && attempts[0]?.statusDisplay === 'Accepted' ? 1 : 0
      },
      create: {
        userId,
        problemId: first.problemId,
        title: first.title,
        slug,
        difficulty: first.difficulty,
        topicTags: first.topicTags,
        attempts: attempts.length,
        accepted: Boolean(accepted),
        firstAcceptedAt: accepted?.timestamp,
        lastAttemptedAt: attempts.at(-1)?.timestamp ?? first.timestamp,
        firstAttemptRate: accepted && attempts[0]?.statusDisplay === 'Accepted' ? 1 : 0
      }
    })
  }
}

export async function rebuildTopicScores(userId: string) {
  const histories = await prisma.problemHistory.findMany({ where: { userId } })
  const topicMap = new Map<string, typeof histories>()

  for (const history of histories) {
    for (const topic of history.topicTags) {
      topicMap.set(topic, [...(topicMap.get(topic) ?? []), history])
    }
  }

  await prisma.topicScore.deleteMany({ where: { userId } })

  for (const [topic, rows] of topicMap) {
    const solved = rows.filter((row) => row.accepted).length
    const avgAttempts = rows.reduce((sum, row) => sum + row.attempts, 0) / rows.length
    const firstAttemptRate = rows.reduce((sum, row) => sum + row.firstAttemptRate, 0) / rows.length
    const weaknessScore = Math.min(100, Math.round(avgAttempts * 12 + (1 - firstAttemptRate) * 55))

    await prisma.topicScore.create({
      data: {
        userId,
        topic,
        solved,
        avgAttempts,
        firstAttemptRate,
        weaknessScore,
        status: topicStatus(weaknessScore)
      }
    })
  }
}
