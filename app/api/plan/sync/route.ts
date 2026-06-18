import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { syncFromUsername } from '@/lib/sync/sync'

export async function POST() {
  const { userId } = auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) return Response.json({ error: 'User not found' }, { status: 404 })

  if (!dbUser.leetcodeUsername) {
    return Response.json({
      error: 'No LeetCode username saved. Import once with a username or extension export first.'
    }, { status: 400 })
  }

  const result = await syncFromUsername(dbUser.id)
  return Response.json(result)
}
