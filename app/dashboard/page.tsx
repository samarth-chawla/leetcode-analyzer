import { differenceInHours, format, startOfDay } from 'date-fns'
import Link from 'next/link'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import { AppShell, ensureImported } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { SyncButton } from '@/components/sync-button'
import { DashboardProfileOverview } from '@/components/dashboard-profile-overview'
import { ChangePlanButton } from '@/components/change-plan-button'
import { prisma } from '@/lib/prisma'
import { ensureDailyPlan } from '@/lib/plan/recommend'
import { syncFromUsername } from '@/lib/sync/sync'
import { getDashboardLeetCodeProfile } from '@/lib/profile/safe-leetcode-profile'
import { performanceScore } from '@/lib/analytics/score'


type HeatmapCell = {
  date: string
  count: number
}

type ProfileView = {
  username: string
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  activeDaysCount: number
  currentStreak: number
  longestStreak: number
  submissionCount: number
  lastYearSubmissionCount: number
  globalRank: number | null
  heatmap: unknown
}

function emptyProfile(username: string | null): ProfileView {
  return {
    username: username ?? 'LeetCode User',
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    activeDaysCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    submissionCount: 0,
    lastYearSubmissionCount: 0,
    globalRank: null,
    heatmap: null
  }
}

function heatmapCells(heatmap: unknown) {
  if (!heatmap || typeof heatmap !== 'object' || !('cells' in heatmap)) return []
  const cells = (heatmap as { cells?: unknown }).cells
  if (!Array.isArray(cells)) return []

  return cells.filter((cell): cell is HeatmapCell => {
    if (!cell || typeof cell !== 'object') return false
    const row = cell as Record<string, unknown>
    return typeof row.date === 'string' && typeof row.count === 'number'
  })
}


export default async function DashboardPage() {
  const user = await ensureImported()

  if (
    user.leetcodeUsername &&
    user.lastSyncedAt &&
    differenceInHours(new Date(), user.lastSyncedAt) >= 24
  ) {
    syncFromUsername(user.id).catch(console.error)
  }

  const [plan, weakTopics, recent, dbProfile] = await Promise.all([
    ensureDailyPlan(user.id),
    prisma.topicScore.findMany({
      where: { userId: user.id },
      orderBy: { weaknessScore: 'desc' },
      take: 3
    }),
    prisma.submission.findMany({
      where: { userId: user.id, statusDisplay: 'Accepted' },
      orderBy: { timestamp: 'desc' },
      take: 10
    }),
    getDashboardLeetCodeProfile(user.id)
  ])

  const profile: ProfileView = dbProfile ?? emptyProfile(user.leetcodeUsername)
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd')
  const completed = plan.problems.filter((problem) => problem.completed).length

  return (
    <AppShell active="/dashboard">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-primary">
            Good morning, {user.firstName ?? 'John'}
          </h1>
          <p className="mt-2 text-sm text-secondary">
            Current streak:{' '}
            <span className="font-semibold text-primary">{profile.currentStreak} days</span>
            <span className="mx-3">|</span>
            Latest accepted:{' '}
            <span className="font-semibold text-primary">{recent.length}</span>
          </p>
        </div>
        <SyncButton />
      </div>

      <DashboardProfileOverview profile={profile} cells={heatmapCells(profile.heatmap)} today={today} />

      <section className="card mt-6">
        <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-primary">Today&apos;s Practice Plan</h2>
            <p className="mt-1 text-sm text-secondary">{format(startOfDay(new Date()), 'MMMM d, yyyy')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Badge tone={completed === plan.problems.length && plan.problems.length > 0 ? 'success' : 'neutral'}>
              {completed}/{plan.problems.length || 3} completed
            </Badge>
            <ChangePlanButton />
          </div>
        </div>
        <div className="divide-y divide-border">
          {plan.problems.map((problem) => (
            <div key={problem.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className={problem.completed ? 'opacity-60' : ''}>
                <div className="flex items-center gap-3">
                  {problem.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <span className="font-mono text-sm text-secondary">{problem.order}</span>
                  )}
                  <h3 className={`text-lg font-semibold text-primary ${problem.completed ? 'line-through' : ''}`}>
                    {problem.title}
                  </h3>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {problem.reason.startsWith('Revisit:') ? <Badge tone="brand">Revisit</Badge> : null}
                  <Badge tone="neutral">{problem.topic}</Badge>
                  <Badge tone={problem.difficulty === 'Easy' ? 'success' : problem.difficulty === 'Hard' ? 'danger' : 'warning'}>
                    {problem.difficulty}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-secondary">{problem.reason}</p>
              </div>
              <a
                href={problem.leetcodeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-white"
              >
                Start <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary">Topics to Improve</h2>
            <p className="mt-1 text-sm text-secondary">Lower scores need more work.</p>
          </div>
          <Link href="/analytics" className="text-sm font-medium text-brand">View full analytics</Link>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {weakTopics.map((topic) => (
            <div key={topic.topic} className="card">
              <p className="text-sm font-semibold text-primary">{topic.topic}</p>
              <p className="mt-3 font-mono text-2xl text-primary">{performanceScore(topic.weaknessScore)}/100</p>
              <Badge tone={topic.status === 'weak' ? 'danger' : topic.status === 'needs_work' ? 'warning' : 'success'}>
                {topic.status === 'weak' ? 'Weak' : topic.status === 'needs_work' ? 'Needs Work' : 'Strong'}
              </Badge>
            </div>
          ))}
          {weakTopics.length === 0 ? <p className="text-sm text-secondary">No topic analytics yet.</p> : null}
        </div>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-4">
        {[
          ['Total Solved', profile.totalSolved],
          ['Easy', profile.easySolved],
          ['Medium', profile.mediumSolved],
          ['Hard', profile.hardSolved]
        ].map(([label, value]) => (
          <div key={label} className="card">
            <p className="text-sm text-secondary">{label}</p>
            <p className="mt-2 font-mono text-3xl font-semibold text-primary">{value}</p>
            <p className="mt-1 text-sm text-secondary">Solved</p>
          </div>
        ))}
      </section>

      <section className="card mt-6">
        <h2 className="text-lg font-semibold text-primary">Recent Activity</h2>
        <div className="mt-4 divide-y divide-border">
          {recent.map((submission) => (
            <div key={submission.id} className="grid gap-2 py-3 text-sm md:grid-cols-[1fr_140px_120px]">
              <p className="font-medium text-primary">{submission.title}</p>
              <p className="text-secondary">{submission.difficulty}</p>
              <p className="text-secondary">{format(submission.timestamp, 'MMM d')}</p>
            </div>
          ))}
          {recent.length === 0 ? <p className="text-sm text-secondary">No accepted submissions yet.</p> : null}
        </div>
      </section>
    </AppShell>
  )
}
