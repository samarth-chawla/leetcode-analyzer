import { prisma } from '@/lib/prisma'
import { rebuildProblemHistory, rebuildTopicScores } from '@/lib/analytics/rebuild'
import { updatePlanCompletion } from '@/lib/plan/completion-tracker'
import { refreshTodayDailyPlan } from '@/lib/plan/recommend'
import type { ImportResult, NormalizedSubmission } from './types'
import { computeLeetCodeProfileUpsertForUser } from '@/lib/profile/compute-leetcode-profile-upsert'

export async function runImportPipeline(
  userId: string,
  submissions: NormalizedSubmission[]
): Promise<ImportResult> {
  let imported = 0
  let skipped = 0

  // Deduplicate using submissionId (insert-only semantics).
  const incomingIds = Array.from(new Set(submissions.map((s) => s.submissionId)))

  const existing = await prisma.submission.findMany({
    where: { userId, submissionId: { in: incomingIds } },
    select: { submissionId: true }
  })
  const existingIdSet = new Set(existing.map((e) => e.submissionId))

  const newOnly = submissions.filter((s) => !existingIdSet.has(s.submissionId))
  skipped += submissions.length - newOnly.length

  for (const submission of newOnly) {
    try {
      await prisma.submission.create({
        data: {
          userId,
          ...submission
        }
      })
      imported += 1
    } catch {
      // Covers rare races or duplicate IDs repeated within the same payload.
      skipped += 1
    }
  }

  // Recompute everything from accepted submissions / derived analytics.
  await updatePlanCompletion(userId)
  await rebuildProblemHistory(userId)
  await rebuildTopicScores(userId)
  await computeLeetCodeProfileUpsertForUser(userId)
  await refreshTodayDailyPlan(userId)

  await prisma.user.update({
    where: { id: userId },
    data: { lastSyncedAt: new Date() }
  })

  return {
    imported,
    skipped,
    message: `Imported ${imported} new submissions. Skipped ${skipped} duplicate or failed submissions.`
  }
}
