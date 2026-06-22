import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { syncFromUsername } from '@/lib/sync/sync'

async function clearImportedData(userId: string) {
  const plans = await prisma.dailyPlan.findMany({
    where: { userId },
    select: { id: true }
  })
  const planIds = plans.map((plan) => plan.id)

  await prisma.$transaction([
    prisma.dailyProblem.deleteMany({ where: { dailyPlanId: { in: planIds } } }),
    prisma.dailyPlan.deleteMany({ where: { userId } }),
    prisma.topicScore.deleteMany({ where: { userId } }),
    prisma.problemHistory.deleteMany({ where: { userId } }),
    prisma.submission.deleteMany({ where: { userId } }),
    prisma.leetCodeProfile.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        lastSyncedAt: null,
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        currentStreak: 0
      }
    })
  ])
}

export async function POST() {
  try {
    const { userId } = auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!dbUser) return Response.json({ error: 'User not found' }, { status: 404 })

    if (!dbUser.leetcodeUsername) {
      return Response.json(
        { error: 'No LeetCode username saved. Add a username before resetting and resyncing.' },
        { status: 400 }
      )
    }

    await clearImportedData(dbUser.id)
    const result = await syncFromUsername(dbUser.id)

    revalidatePath('/dashboard')
    revalidatePath('/analytics')
    revalidatePath('/settings')

    return Response.json({
      ...result,
      message: `Reset complete. ${result.message}`
    })
  } catch (error) {
    console.error('Reset sync error:', error)
    const message = error instanceof Error ? error.message : 'Reset and resync failed.'
    return Response.json({ error: message }, { status: 500 })
  }
}
