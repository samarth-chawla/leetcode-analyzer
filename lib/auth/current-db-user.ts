import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function getOrCreateDbUser() {
  const { userId } = auth()
  if (!userId) return null

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (existing) return existing

  const clerkUser = await currentUser()
  return prisma.user.create({
    data: {
      clerkId: userId,
      email: clerkUser?.emailAddresses[0]?.emailAddress,
      firstName: clerkUser?.firstName ?? 'John'
    }
  })
}
