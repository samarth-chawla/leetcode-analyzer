import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { rebuildProblemHistory, rebuildTopicScores } from '@/lib/analytics/rebuild'
import { computeLeetCodeProfileUpsertForUser } from '@/lib/profile/compute-leetcode-profile-upsert'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) return Response.json({ error: 'User not found' }, { status: 404 })

  const { problemId, completed } = await req.json()
  if (!problemId || typeof problemId !== 'string') {
    return Response.json({ error: 'Problem ID is required.' }, { status: 400 })
  }

  // Verify the problem belongs to a daily plan of this user
  const problem = await prisma.dailyProblem.findFirst({
    where: {
      id: problemId,
      dailyPlan: {
        userId: dbUser.id
      }
    }
  })

  if (!problem) {
    return Response.json({ error: 'Problem not found.' }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.dailyProblem.update({
      where: { id: problemId },
      data: {
        completed,
        completedAt: completed ? new Date() : null
      }
    })

    const submissionId = `manual-${problem.slug}`

    if (completed) {
      const catalogProblem = await tx.problemCatalog.findUnique({
        where: { slug: problem.slug }
      })

      await tx.submission.upsert({
        where: {
          userId_submissionId: {
            userId: dbUser.id,
            submissionId
          }
        },
        create: {
          userId: dbUser.id,
          submissionId,
          problemId: catalogProblem?.problemId ?? null,
          title: problem.title,
          slug: problem.slug,
          difficulty: problem.difficulty,
          topicTags: catalogProblem?.topicTags ?? [problem.topic],
          status: 'Accepted',
          statusDisplay: 'Accepted',
          timestamp: new Date()
        },
        update: {
          timestamp: new Date()
        }
      })
    } else {
      await tx.submission.deleteMany({
        where: { userId: dbUser.id, submissionId }
      })
    }
  })

  // Rebuild the history and profile analytics so the dashboard statistics
  // and the recommendation engine immediately sync with the manual completion.
  await rebuildProblemHistory(dbUser.id)
  await rebuildTopicScores(dbUser.id)
  await computeLeetCodeProfileUpsertForUser(dbUser.id)

  revalidatePath('/dashboard')
  revalidatePath('/analytics')

  return Response.json({ success: true })
}

