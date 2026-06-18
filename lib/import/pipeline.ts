import { prisma } from '@/lib/prisma'
import { rebuildProblemHistory, rebuildTopicScores } from '@/lib/analytics/rebuild'
import { updatePlanCompletion } from '@/lib/plan/completion-tracker'
import { ensureDailyPlan } from '@/lib/plan/recommend'
import type { ImportResult, NormalizedSubmission } from './types'

export async function runImportPipeline(
  userId: string,
  submissions: NormalizedSubmission[]
): Promise<ImportResult> {
  let imported = 0
  let skipped = 0

  for (const submission of submissions) {
    try {
      // Avoid crashing on duplicates (userId + submissionId is unique)
      await prisma.submission.upsert({
        where: {
          userId_submissionId: {
            userId,
            submissionId: submission.submissionId
          }
        },
        update: {
          // Keep these fields in sync in case LeetCode returns updated metadata
          problemId: submission.problemId,
          title: submission.title,
          slug: submission.slug,
          difficulty: submission.difficulty,
          topicTags: submission.topicTags,
          statusCode: submission.statusCode,
          status: submission.status,
          statusDisplay: submission.statusDisplay,
          runtime: submission.runtime,
          memory: submission.memory,
          language: submission.language,
          timestamp: submission.timestamp,
          submissionUrl: submission.submissionUrl
        },
        create: {
          userId,
          ...submission
        }
      })

      // We still treat “upsert happened” as imported; if you prefer exact
      // counting of newly-created rows, we can refactor after adding a
      // create-only path.
      imported += 1
    } catch {
      skipped += 1
    }
  }

  await updatePlanCompletion(userId)
  await rebuildProblemHistory(userId)
  await rebuildTopicScores(userId)
  await ensureDailyPlan(userId)
  await prisma.user.update({
    where: { id: userId },
    data: { lastSyncedAt: new Date() }
  })

  return {
    imported,
    skipped,
    message: `Imported ${imported} new submissions.`
  }
}
