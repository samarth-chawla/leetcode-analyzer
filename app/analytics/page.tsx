import { Search } from 'lucide-react'
import { AppShell, ensureImported } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { DifficultyChart, EfficiencyChart } from '@/components/analytics-charts'
import { prisma } from '@/lib/prisma'

export default async function AnalyticsPage() {
  const user = await ensureImported()
  const topics = await prisma.topicScore.findMany({ where: { userId: user.id }, orderBy: { weaknessScore: 'desc' } })
  const table = topics.length ? topics : [
    { topic: 'Dynamic Programming', solved: 18, avgAttempts: 6.2, firstAttemptRate: 0.14, weaknessScore: 76, status: 'weak' },
    { topic: 'Graphs', solved: 22, avgAttempts: 5.1, firstAttemptRate: 0.18, weaknessScore: 68, status: 'weak' },
    { topic: 'Arrays', solved: 60, avgAttempts: 1.4, firstAttemptRate: 0.82, weaknessScore: 12, status: 'strong' }
  ]

  return (
    <AppShell active="/analytics">
      <h1 className="text-[32px] font-bold text-primary">Analytics</h1>

      <section className="card mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-primary">Topic Performance</h2>
          <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm text-secondary">
            <Search className="h-4 w-4" />
            Search or filter topics
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-secondary">
              <tr>
                <th className="py-3">Topic</th>
                <th>Solved</th>
                <th>Avg Attempts</th>
                <th>1st Attempt Rate</th>
                <th>Weakness Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {table.map((topic) => (
                <tr key={topic.topic}>
                  <td className="py-3 font-medium text-primary">{topic.topic}</td>
                  <td>{topic.solved}</td>
                  <td>{topic.avgAttempts.toFixed(1)}</td>
                  <td>{Math.round(topic.firstAttemptRate * 100)}%</td>
                  <td>{topic.weaknessScore}</td>
                  <td>
                    <Badge tone={topic.status === 'strong' ? 'success' : topic.status === 'weak' ? 'danger' : 'warning'}>
                      {topic.status === 'strong' ? 'Strong' : topic.status === 'weak' ? 'Weak' : 'Needs Work'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold text-primary">Difficulty Distribution</h2>
          <div className="mt-4">
            <DifficultyChart data={[
              { name: 'Easy', solved: user.easySolved || 95 },
              { name: 'Medium', solved: user.mediumSolved || 180 },
              { name: 'Hard', solved: user.hardSolved || 40 }
            ]} />
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-primary">Learning Efficiency</h2>
          <div className="mt-4">
            <EfficiencyChart />
          </div>
        </div>
      </section>
    </AppShell>
  )
}
