import { prisma } from '@/lib/prisma'
import type { ExtensionExport } from '@/lib/import/types'
import { normalizeExtensionExport } from '@/lib/import/normalize'
import { fetchSubmissionsSince } from '@/lib/leetcode/graphql'
import { normalizeGraphQLSubmissionWithFallback } from '@/lib/import/normalize'
import { runImportPipeline } from '@/lib/import/pipeline'

export async function syncFromExtension(userId: string, jsonData: ExtensionExport) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  await prisma.user.update({
    where: { id: userId },
    data: { leetcodeUsername: jsonData.user.username, importMethod: 'extension' }
  })

  const normalized = normalizeExtensionExport(jsonData)

  // Always process the complete export. The pipeline deduplicates by submission ID,
  // while a timestamp cutoff would prevent older history from being backfilled.
  return runImportPipeline(userId, normalized)
}

export async function syncFromUsername(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.leetcodeUsername) throw new Error('No LeetCode username set')

  await prisma.user.update({
    where: { id: userId },
    data: { importMethod: 'username' }
  })

  console.log(`Syncing submissions for user ${user.leetcodeUsername}...`)
  console.log(`lastSyncedAt=${user.lastSyncedAt ? user.lastSyncedAt.toISOString() : 'null'}`)

  const cutoff = user.lastSyncedAt ?? new Date(0)
  console.log(`cutoff=${cutoff.toISOString()}`)

  const rawSubmissions = await fetchSubmissionsSince(user.leetcodeUsername, cutoff)
  console.log(`Fetched(after cutoff filter) ${rawSubmissions.length} submissions`)

  const normalized = []
  for (const submission of rawSubmissions) {
    normalized.push(await normalizeGraphQLSubmissionWithFallback(submission))
  }
  console.log(`Normalized ${normalized.length} submissions`)

  const result = await runImportPipeline(userId, normalized)
  console.log(`Import complete: ${result.imported} imported, ${result.skipped} skipped`)

  return result
}
