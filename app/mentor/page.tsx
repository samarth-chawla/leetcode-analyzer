import { AppShell, ensureImported } from '@/components/app-shell'
import { MentorChat } from '@/components/mentor-chat'
import { prisma } from '@/lib/prisma'

export default async function MentorPage() {
  const user = await ensureImported()
  const messages = await prisma.mentorMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    take: 20
  })

  return (
    <AppShell active="/mentor">
      <h1 className="text-[32px] font-bold text-primary">AI Mentor</h1>
      <p className="mt-2 text-sm text-secondary">Ask questions grounded in your actual LeetCode performance.</p>
      <div className="mt-6">
        <MentorChat initial={messages.map(({ role, content }) => ({ role, content }))} />
      </div>
    </AppShell>
  )
}
