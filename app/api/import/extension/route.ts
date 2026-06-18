import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { validateExtensionJSON } from '@/lib/import/validate-extension-json'
import { normalizeExtensionExport } from '@/lib/import/normalize'
import { runImportPipeline } from '@/lib/import/pipeline'
import type { ExtensionExport } from '@/lib/import/types'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!dbUser) return Response.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const validation = validateExtensionJSON(body)
    if (!validation.valid) {
      return Response.json({ error: validation.error }, { status: 400 })
    }

    const exportData = body as ExtensionExport
    const normalized = normalizeExtensionExport(exportData)
    const result = await runImportPipeline(dbUser.id, normalized)

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        leetcodeUsername: exportData.user.username,
        importMethod: 'extension',
        totalSolved: exportData.user.totalSolved ?? dbUser.totalSolved,
        easySolved: exportData.user.easySolved ?? dbUser.easySolved,
        mediumSolved: exportData.user.mediumSolved ?? dbUser.mediumSolved,
        hardSolved: exportData.user.hardSolved ?? dbUser.hardSolved
      }
    })

    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Import failed.'
    return Response.json({ error: message }, { status: 500 })
  }
}
