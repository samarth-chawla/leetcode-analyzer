import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { refreshTodayDailyPlan } from '@/lib/plan/recommend'

export async function POST() {
  try {
    const { userId } = auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!dbUser) return Response.json({ error: 'User not found' }, { status: 404 })

    const plan = await refreshTodayDailyPlan(dbUser.id, true)

    revalidatePath('/dashboard')

    return Response.json({
      message: 'Today\'s open plan slots were changed.',
      problems: plan.problems.length
    })
  } catch (error) {
    console.error('Refresh plan error:', error)
    const message = error instanceof Error ? error.message : 'Could not change today\'s plan.'
    return Response.json({ error: message }, { status: 500 })
  }
}
