import { startOfDay } from 'date-fns'
import { prisma } from '@/lib/prisma'

export async function updatePlanCompletion(userId: string): Promise<void> {
  const todayPlan = await prisma.dailyPlan.findFirst({
    where: {
      userId,
      date: startOfDay(new Date())
    },
    include: {
      problems: {
        where: { completed: false }
      }
    }
  })

  if (!todayPlan || todayPlan.problems.length === 0) return

  for (const problem of todayPlan.problems) {
    const acceptedSubmission = await prisma.submission.findFirst({
      where: {
        userId,
        slug: problem.slug,
        statusDisplay: 'Accepted',
        timestamp: {
          gt: todayPlan.createdAt
        }
      },
      orderBy: { timestamp: 'asc' }
    })

    if (acceptedSubmission) {
      await prisma.dailyProblem.update({
        where: { id: problem.id },
        data: {
          completed: true,
          completedAt: acceptedSubmission.timestamp
        }
      })
    }
  }
}
