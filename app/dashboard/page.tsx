import { differenceInHours, format, startOfDay, subDays } from 'date-fns'
import Link from 'next/link'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import { AppShell, ensureImported } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { SyncButton } from '@/components/sync-button'
import { prisma } from '@/lib/prisma'
import { ensureDailyPlan } from '@/lib/plan/recommend'
import { syncFromUsername } from '@/lib/sync/sync'
import { getDashboardLeetCodeProfile } from '@/lib/profile/safe-leetcode-profile'

const LEETCODE_TOTALS = {
  all: 3962,
  Easy: 950,
  Medium: 2069,
  Hard: 943
}

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

function difficultyTone(label: 'Easy' | 'Medium' | 'Hard') {
  if (label === 'Easy') return 'text-success bg-success/10'
  if (label === 'Medium') return 'text-warning bg-warning/10'
  return 'text-danger bg-danger/10'
}

function DifficultyMetric({ label, solved, total }: { label: 'Easy' | 'Medium' | 'Hard'; solved: number; total: number }) {
  return (
    <div className="rounded-lg bg-surface px-4 py-3">
      <p className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${difficultyTone(label)}`}>{label}</p>
      <p className="mt-3 font-mono text-lg font-semibold text-primary">
        {solved}<span className="text-sm text-secondary">/{total}</span>
      </p>
      <p className="mt-1 text-xs text-secondary">Solved</p>
    </div>
  )
}

function SolvedRing({ profile }: { profile: ProfileView }) {
  const easyPercent = (profile.easySolved / LEETCODE_TOTALS.all) * 100
  const mediumPercent = (profile.mediumSolved / LEETCODE_TOTALS.all) * 100
  const hardPercent = (profile.hardSolved / LEETCODE_TOTALS.all) * 100
  const gradient = `conic-gradient(#10B981 0 ${easyPercent}%, #F59E0B ${easyPercent}% ${easyPercent + mediumPercent}%, #EF4444 ${easyPercent + mediumPercent}% ${easyPercent + mediumPercent + hardPercent}%, #E5E7EB ${easyPercent + mediumPercent + hardPercent}% 100%)`

  return (
    <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full" style={{ background: gradient }}>
      <div className="absolute h-[102px] w-[102px] rounded-full bg-white" />
      <div className="relative text-center">
        <p className="font-mono text-xl font-semibold text-primary">
          {profile.totalSolved}<span className="text-xs text-secondary">/{LEETCODE_TOTALS.all}</span>
        </p>
        <p className="mt-1 text-xs font-medium text-secondary">Solved</p>
      </div>
    </div>
  )
}

function SubmissionHeatmap({ cells }: { cells: HeatmapCell[] }) {
  const byDate = new Map(cells.map((cell) => [cell.date, cell.count]))
  const days = Array.from({ length: 364 }, (_, index) => subDays(startOfDay(new Date()), 363 - index))

  return (
    <div>
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const count = byDate.get(key) ?? 0
          const tone = count >= 4 ? 'bg-success' : count >= 2 ? 'bg-success/70' : count === 1 ? 'bg-success/35' : 'bg-slate-100'
          return <div key={key} title={`${key}: ${count} accepted`} className={`h-2.5 w-2.5 shrink-0 rounded-sm ${tone}`} />
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-secondary">
        <span>Last year</span>
        <span>{cells.length} active days logged</span>
      </div>
    </div>
  )
}

function ProfileOverview({ profile }: { profile: ProfileView }) {
  const cells = heatmapCells(profile.heatmap)

  return (
    <section className="card mt-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
        <div className="grid gap-3 sm:grid-cols-2 lg:w-36 lg:grid-cols-1">
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs text-secondary">Rank</p>
            <p className="mt-2 font-mono text-lg font-semibold text-primary">
              {profile.globalRank ? profile.globalRank.toLocaleString() : 'N/A'}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs text-secondary">Current Streak</p>
            <p className="mt-2 font-mono text-lg font-semibold text-primary">{profile.currentStreak} days</p>
          </div>
        </div>

        <div className="flex-1 rounded-xl border border-border bg-white p-4">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white">
                {profile.username.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-primary">{profile.username}</h2>
                <p className="text-sm text-secondary">Accepted submissions drive every count here.</p>
              </div>
            </div>
            <div className="md:ml-auto">
              <Badge tone="brand">Live Analytics</Badge>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[160px_1fr] lg:items-center">
            <div className="flex justify-center">
              <SolvedRing profile={profile} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <DifficultyMetric label="Easy" solved={profile.easySolved} total={LEETCODE_TOTALS.Easy} />
              <DifficultyMetric label="Medium" solved={profile.mediumSolved} total={LEETCODE_TOTALS.Medium} />
              <DifficultyMetric label="Hard" solved={profile.hardSolved} total={LEETCODE_TOTALS.Hard} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 border-t border-border pt-5 md:grid-cols-3">
        <p className="text-sm text-secondary">
          <span className="font-mono text-lg font-semibold text-primary">{profile.lastYearSubmissionCount}</span> submissions in the last year
        </p>
        <p className="text-sm text-secondary">
          Total Active Days: <span className="font-mono font-semibold text-primary">{profile.activeDaysCount}</span>
        </p>
        <p className="text-sm text-secondary">
          Max Streak: <span className="font-mono font-semibold text-primary">{profile.longestStreak}</span>
        </p>
      </div>

      <div className="mt-4">
        <SubmissionHeatmap cells={cells} />
      </div>
    </section>
  )
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

      <ProfileOverview profile={profile} />

      <section className="card mt-6">
        <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-primary">Today&apos;s Practice Plan</h2>
            <p className="mt-1 text-sm text-secondary">{format(startOfDay(new Date()), 'MMMM d, yyyy')}</p>
          </div>
          <Badge tone={completed === plan.problems.length && plan.problems.length > 0 ? 'success' : 'neutral'}>
            {completed}/{plan.problems.length || 3} completed
          </Badge>
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
          <h2 className="text-lg font-semibold text-primary">Weak Topics</h2>
          <Link href="/analytics" className="text-sm font-medium text-brand">View full analytics</Link>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {weakTopics.map((topic) => (
            <div key={topic.topic} className="card">
              <p className="text-sm font-semibold text-primary">{topic.topic}</p>
              <p className="mt-3 font-mono text-2xl text-primary">{topic.weaknessScore}/100</p>
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
