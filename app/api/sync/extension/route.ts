import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { validateExtensionJSON } from '@/lib/import/validate-extension-json'
import type { ExtensionExport } from '@/lib/import/types'
import { syncFromExtension } from '@/lib/sync/sync'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) return Response.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json()
  const validation = validateExtensionJSON(body)
  if (!validation.valid) return Response.json({ error: validation.error }, { status: 400 })

  const result = await syncFromExtension(dbUser.id, body as ExtensionExport)
  return Response.json(result)
}
