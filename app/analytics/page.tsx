import { AppShell, ensureImported } from '@/components/app-shell'
import { DifficultyChart, TopTopicsChart } from '@/components/analytics-charts'
import { Badge } from '@/components/ui/badge'
import { SyncButton } from '@/components/sync-button'
import { TopicPerformanceTable, type TopicPerformanceRow } from '@/components/topic-performance-table'
import { performanceScore } from '@/lib/analytics/score'
import { fetchUserTagStats } from '@/lib/leetcode/graphql'
import { prisma } from '@/lib/prisma'
import { getDashboardLeetCodeProfile } from '@/lib/profile/safe-leetcode-profile'

export default async function AnalyticsPage() {
  const user = await ensureImported()
  const [topics, profile, acceptedHistory, officialTags] = await Promise.all([
    prisma.topicScore.findMany({ where: { userId: user.id }, orderBy: { weaknessScore: 'desc' } }),
    getDashboardLeetCodeProfile(user.id),
    prisma.problemHistory.findMany({
      where: { userId: user.id, accepted: true },
      select: { topicTags: true }
    }),
    user.leetcodeUsername
      ? fetchUserTagStats(user.leetcodeUsername).catch((error) => {
          console.warn('Could not fetch LeetCode tag statistics; using imported history.', error)
          return []
        })
      : Promise.resolve([])
  ])

  const officialTotal = profile?.totalSolved ?? user.totalSolved
  const taggedSolved = acceptedHistory.filter((problem) => problem.topicTags.length > 0).length
  const localTopics = new Map(topics.map((topic) => [topic.topic, topic]))
  const topicRows: TopicPerformanceRow[] = officialTags.length > 0
    ? officialTags.map((tag) => {
        const local = localTopics.get(tag.tagName)
        return {
          topic: tag.tagName,
          solved: tag.problemsSolved,
          avgAttempts: local?.avgAttempts ?? null,
          firstAttemptRate: local?.firstAttemptRate ?? null,
          score: local?.weaknessScore === undefined ? null : performanceScore(local.weaknessScore),
          status: local?.status ?? null
        }
      })
    : topics.map((topic) => ({
        topic: topic.topic,
        solved: topic.solved,
        avgAttempts: topic.avgAttempts,
        firstAttemptRate: topic.firstAttemptRate,
        score: performanceScore(topic.weaknessScore),
        status: topic.status
      }))
  const topTopics = topicRows.slice(0, 6).map((topic) => ({ topic: topic.topic, solved: topic.solved }))
  const topTopicTotal = topTopics.reduce((sum, topic) => sum + topic.solved, 0)
  const topTopicShare = officialTotal > 0 ? Math.round((topTopicTotal / officialTotal) * 100) : 0

  return (
    <AppShell active="/analytics">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-primary">Analytics</h1>
          <p className="mt-2 text-sm text-secondary">
            Difficulty and topic totals come from your LeetCode profile. Attempt analytics use recent username imports.
          </p>
        </div>
        <SyncButton />
      </div>

      <section className="card mt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary">Topic Performance</h2>
            <p className="mt-1 text-sm text-secondary">A solved problem is counted once in each of its LeetCode tags.</p>
          </div>
          <Badge tone={officialTags.length > 0 ? 'success' : 'warning'}>
            {officialTags.length > 0
              ? officialTags.length + ' official LeetCode topic counts'
              : taggedSolved + '/' + officialTotal + ' solved problems have imported tags'}
          </Badge>
        </div>

        <TopicPerformanceTable rows={topicRows} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold text-primary">Difficulty Distribution</h2>
          <p className="mt-1 text-sm text-secondary">{officialTotal} unique problems solved on LeetCode.</p>
          <div className="mt-4">
            <DifficultyChart data={[
              { name: 'Easy', solved: profile?.easySolved ?? user.easySolved },
              { name: 'Medium', solved: profile?.mediumSolved ?? user.mediumSolved },
              { name: 'Hard', solved: profile?.hardSolved ?? user.hardSolved }
            ]} />
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-primary">Top Topic Coverage</h2>
          <p className="mt-1 text-sm text-secondary">
            Your top {topTopics.length} tags account for about {topTopicShare}% of solved topic coverage.
          </p>
          <div className="mt-4">
            {topTopics.length > 0 ? <TopTopicsChart data={topTopics} /> : (
              <div className="flex h-[240px] items-center justify-center text-sm text-secondary">
                No topic coverage data is available yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  )
}