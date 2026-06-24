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

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!dbUser) return Response.json({ error: 'User not found' }, { status: 404 })

    const { username } = await req.json()
    if (!username || typeof username !== 'string' || !username.trim()) {
      return Response.json({ error: 'LeetCode username is required.' }, { status: 400 })
    }

    const trimmedUsername = username.trim()

    // 1. Delete all database entries from the previous username
    await clearImportedData(dbUser.id)

    // 2. Set the new username and import method
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        leetcodeUsername: trimmedUsername,
        importMethod: 'username'
      }
    })

    // 3. Resync for the new username
    const result = await syncFromUsername(dbUser.id)

    revalidatePath('/dashboard')
    revalidatePath('/analytics')
    revalidatePath('/settings')

    return Response.json({
      ...result,
      message: `Username changed to ${trimmedUsername} and profile synced successfully.`
    })
  } catch (error) {
    console.error('Change username error:', error)
    const message = error instanceof Error ? error.message : 'Change username failed.'
    return Response.json({ error: message }, { status: 500 })
  }
}
