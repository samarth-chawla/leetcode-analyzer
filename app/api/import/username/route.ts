import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { syncFromUsername } from '@/lib/sync/sync'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { username } = await req.json()
    if (!username || typeof username !== 'string') {
      return Response.json({ error: 'LeetCode username is required.' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!dbUser) return Response.json({ error: 'User not found' }, { status: 404 })

    await prisma.user.update({
      where: { id: dbUser.id },
      data: { leetcodeUsername: username, importMethod: 'username' }
    })

    const result = await syncFromUsername(dbUser.id)
    revalidatePath('/dashboard')
    revalidatePath('/analytics')

    return Response.json(result)
  } catch (error) {
    console.error('Import error:', error)
    const message = error instanceof Error ? error.message : 'Import failed.'
    return Response.json({ error: message }, { status: 500 })
  }
}
