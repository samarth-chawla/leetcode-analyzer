import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { askMentor } from '@/lib/mentor/gemini'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) return Response.json({ error: 'User not found' }, { status: 404 })

  const { message } = await req.json()
  if (!message || typeof message !== 'string') {
    return Response.json({ error: 'Message is required.' }, { status: 400 })
  }

  await prisma.mentorMessage.create({ data: { userId: dbUser.id, role: 'user', content: message } })
  const answer = await askMentor(dbUser.id, message)
  await prisma.mentorMessage.create({ data: { userId: dbUser.id, role: 'assistant', content: answer } })

  return Response.json({ answer })
}
