import { prisma } from '@/lib/prisma'
import type { ExtensionExport } from '@/lib/import/types'
import { normalizeExtensionExport } from '@/lib/import/normalize'
import { fetchSubmissionsSince } from '@/lib/leetcode/graphql'
import { normalizeGraphQLSubmissionWithFallback } from '@/lib/import/normalize'
import { runImportPipeline } from '@/lib/import/pipeline'

export async function syncFromExtension(userId: string, jsonData: ExtensionExport) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const normalized = normalizeExtensionExport(jsonData)
  const newOnly = user.lastSyncedAt
    ? normalized.filter((submission) => submission.timestamp > user.lastSyncedAt!)
    : normalized

  return runImportPipeline(userId, newOnly)
}

export async function syncFromUsername(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.leetcodeUsername) throw new Error('No LeetCode username set')

  console.log(`Syncing submissions for user ${user.leetcodeUsername}...`)
  console.log(`lastSyncedAt=${user.lastSyncedAt ? user.lastSyncedAt.toISOString() : 'null'}`)

  const cutoff = user.lastSyncedAt ?? new Date(0)
  console.log(`cutoff=${cutoff.toISOString()}`)

  const rawSubmissions = await fetchSubmissionsSince(user.leetcodeUsername, cutoff)
  console.log(`Fetched(after cutoff filter) ${rawSubmissions.length} submissions`)

  const normalized = await Promise.all(rawSubmissions.map(normalizeGraphQLSubmissionWithFallback))
  console.log(`Normalized ${normalized.length} submissions`)

  const result = await runImportPipeline(userId, normalized)
  console.log(`Import complete: ${result.imported} imported, ${result.skipped} skipped`)
  
  return result
}
