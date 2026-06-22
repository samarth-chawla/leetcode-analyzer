import { format, startOfWeek, subWeeks } from 'date-fns'
import Link from 'next/link'
import { Upload } from 'lucide-react'
import { AppShell, ensureImported } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { SyncButton } from '@/components/sync-button'
import { DifficultyChart, EfficiencyChart } from '@/components/analytics-charts'
import { performanceScore } from '@/lib/analytics/score'
import { getDashboardLeetCodeProfile } from '@/lib/profile/safe-leetcode-profile'
import { fetchUserTagStats } from '@/lib/leetcode/graphql'
import { prisma } from '@/lib/prisma'

export default async function AnalyticsPage() {
  const user = await ensureImported()
  const [topics, profile, acceptedHistory, officialTags] = await Promise.all([
    prisma.topicScore.findMany({ where: { userId: user.id }, orderBy: { weaknessScore: 'desc' } }),
    getDashboardLeetCodeProfile(user.id),
    prisma.problemHistory.findMany({
      where: { userId: user.id, accepted: true },
      select: { attempts: true, firstAcceptedAt: true, topicTags: true }
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
  const weekStarts = Array.from({ length: 5 }, (_, index) =>
    startOfWeek(subWeeks(new Date(), 4 - index), { weekStartsOn: 1 })
  )
  const efficiency = weekStarts.map((weekStart, index) => {
    const nextWeek = index < weekStarts.length - 1
      ? weekStarts[index + 1]
      : new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    const solved = acceptedHistory.filter((problem) =>
      problem.firstAcceptedAt && problem.firstAcceptedAt >= weekStart && problem.firstAcceptedAt < nextWeek
    )

    return {
      week: format(weekStart, 'MMM d'),
      attempts: solved.length
        ? Number((solved.reduce((sum, problem) => sum + problem.attempts, 0) / solved.length).toFixed(1))
        : null
    }
  })
  const hasEfficiencyData = efficiency.some((week) => week.attempts !== null)
  const localTopics = new Map(topics.map((topic) => [topic.topic, topic]))
  const topicRows = officialTags.length > 0
    ? officialTags.map((tag) => {
        const local = localTopics.get(tag.tagName)
        return {
          topic: tag.tagName,
          solved: tag.problemsSolved,
          avgAttempts: local?.avgAttempts ?? null,
          firstAttemptRate: local?.firstAttemptRate ?? null,
          weaknessScore: local?.weaknessScore ?? null,
          status: local?.status ?? null
        }
      })
    : topics.map((topic) => ({ ...topic }))

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

        {topicRows.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-secondary">
                <tr>
                  <th className="py-3">Topic</th>
                  <th>Solved</th>
                  <th>Avg Attempts</th>
                  <th>1st Attempt Rate</th>
                  <th>Score (higher is better)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topicRows.map((topic) => (
                  <tr key={topic.topic}>
                    <td className="py-3 font-medium text-primary">{topic.topic}</td>
                    <td>{topic.solved}</td>
                    <td>{topic.avgAttempts === null ? '-' : topic.avgAttempts.toFixed(1)}</td>
                    <td>{topic.firstAttemptRate === null ? '-' : `${Math.round(topic.firstAttemptRate * 100)}%`}</td>
                    <td>{topic.weaknessScore === null ? '-' : `${performanceScore(topic.weaknessScore)}/100`}</td>
                    <td>
                      <Badge tone={topic.status === 'strong' ? 'success' : topic.status === 'weak' ? 'danger' : topic.status === 'needs_work' ? 'warning' : 'neutral'}>
                        {topic.status === 'strong' ? 'Strong' : topic.status === 'weak' ? 'Weak' : topic.status === 'needs_work' ? 'Needs Work' : 'History Needed'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-secondary">No LeetCode topic statistics are available yet.</p>
        )}
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
          <h2 className="text-lg font-semibold text-primary">Learning Efficiency</h2>
          <p className="mt-1 text-sm text-secondary">Average attempts per newly solved imported problem.</p>
          <div className="mt-4">
            {hasEfficiencyData ? <EfficiencyChart data={efficiency} /> : (
              <div className="flex h-[240px] items-center justify-center text-sm text-secondary">
                No accepted import history is available for the last five weeks.
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  )
}