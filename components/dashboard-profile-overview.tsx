"use client"

import { format, parseISO, startOfDay, subDays } from 'date-fns'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const LEETCODE_TOTALS = {
  all: 3962,
  Easy: 950,
  Medium: 2069,
  Hard: 943
}

type Difficulty = 'Easy' | 'Medium' | 'Hard'
type RingFocus = 'All' | Difficulty

export type DashboardHeatmapCell = {
  date: string
  count: number
}

export type DashboardProfileView = {
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
}

type DifficultyConfig = {
  label: Difficulty
  solved: number
  total: number
  color: string
  tone: string
}

function difficultyTone(label: Difficulty) {
  if (label === 'Easy') return 'text-success bg-success/10'
  if (label === 'Medium') return 'text-warning bg-warning/10'
  return 'text-danger bg-danger/10'
}

function difficultyValue(profile: DashboardProfileView, difficulty: RingFocus) {
  if (difficulty === 'Easy') return { solved: profile.easySolved, total: LEETCODE_TOTALS.Easy, color: '#10B981', label: 'Easy' }
  if (difficulty === 'Medium') return { solved: profile.mediumSolved, total: LEETCODE_TOTALS.Medium, color: '#F59E0B', label: 'Medium' }
  if (difficulty === 'Hard') return { solved: profile.hardSolved, total: LEETCODE_TOTALS.Hard, color: '#EF4444', label: 'Hard' }
  return { solved: profile.totalSolved, total: LEETCODE_TOTALS.all, color: '#6366F1', label: 'Solved' }
}

function DifficultyMetric({ config, active, onFocus }: { config: DifficultyConfig; active: boolean; onFocus: (value: Difficulty | null) => void }) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-lg bg-surface px-4 py-3 text-left transition focus-ring hover:bg-white hover:shadow-card',
        active && 'bg-white shadow-card ring-1 ring-border'
      )}
      onMouseEnter={() => onFocus(config.label)}
      onMouseLeave={() => onFocus(null)}
      onFocus={() => onFocus(config.label)}
      onBlur={() => onFocus(null)}
      onClick={() => onFocus(active ? null : config.label)}
    >
      <p className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${difficultyTone(config.label)}`}>{config.label}</p>
      <p className="mt-3 font-mono text-lg font-semibold text-primary">
        {config.solved}<span className="text-sm text-secondary">/{config.total}</span>
      </p>
      <p className="mt-1 text-xs text-secondary">Solved</p>
    </button>
  )
}

function SolvedRing({ profile, focus }: { profile: DashboardProfileView; focus: RingFocus }) {
  const easyPercent = (profile.easySolved / LEETCODE_TOTALS.all) * 100
  const mediumPercent = (profile.mediumSolved / LEETCODE_TOTALS.all) * 100
  const hardPercent = (profile.hardSolved / LEETCODE_TOTALS.all) * 100
  const focused = difficultyValue(profile, focus)
  const focusedPercent = Math.min(100, (focused.solved / focused.total) * 100)
  const gradient =
    focus === 'All'
      ? `conic-gradient(#10B981 0 ${easyPercent}%, #F59E0B ${easyPercent}% ${easyPercent + mediumPercent}%, #EF4444 ${easyPercent + mediumPercent}% ${easyPercent + mediumPercent + hardPercent}%, #E5E7EB ${easyPercent + mediumPercent + hardPercent}% 100%)`
      : `conic-gradient(${focused.color} 0 ${focusedPercent}%, #E5E7EB ${focusedPercent}% 100%)`

  return (
    <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full transition" style={{ background: gradient }}>
      <div className="absolute h-[102px] w-[102px] rounded-full bg-white" />
      <div className="relative text-center">
        <p className="font-mono text-xl font-semibold text-primary">
          {focused.solved}<span className="text-xs text-secondary">/{focused.total}</span>
        </p>
        <p className="mt-1 text-xs font-medium text-secondary">{focused.label}</p>
      </div>
    </div>
  )
}

function formatRank(rank: number | null) {
  return rank ? new Intl.NumberFormat('en-US').format(rank) : 'N/A'
}

function SubmissionHeatmap({ cells, today }: { cells: DashboardHeatmapCell[]; today: string }) {
  const byDate = new Map(cells.map((cell) => [cell.date, cell.count]))
  const todayDate = startOfDay(parseISO(today))
  const days = Array.from({ length: 364 }, (_, index) => subDays(todayDate, 363 - index))
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => days.slice(index * 7, index * 7 + 7))

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex min-w-full gap-1 pr-2">
          {weeks.map((week, weekIndex) => {
            const firstDay = week[0]
            const previousWeek = weeks[weekIndex - 1]
            const startsMonth = weekIndex === 0 || firstDay.getMonth() !== previousWeek?.[0]?.getMonth()
            const monthLabel = startsMonth ? format(firstDay, 'MMM') : ''

            return (
              <div key={format(firstDay, 'yyyy-MM-dd')} className={cn('relative grid grid-rows-7 gap-1 pt-5', startsMonth && weekIndex > 0 && 'ml-2 border-l border-border pl-2')}>
                {monthLabel ? <span className="absolute left-2 top-0 text-[11px] text-secondary">{monthLabel}</span> : null}
                {week.map((day) => {
                  const key = format(day, 'yyyy-MM-dd')
                  const count = byDate.get(key) ?? 0
                  const tone = count >= 4 ? 'bg-success' : count >= 2 ? 'bg-success/70' : count === 1 ? 'bg-success/35' : 'bg-slate-100'
                  return <div key={key} title={`${key}: ${count} accepted`} className={`h-2.5 w-2.5 shrink-0 rounded-sm ${tone}`} />
                })}
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-secondary">
        <span>Last year</span>
        <span>{cells.length} active days logged</span>
      </div>
    </div>
  )
}

export function DashboardProfileOverview({ profile, cells, today }: { profile: DashboardProfileView; cells: DashboardHeatmapCell[]; today: string }) {
  const [focus, setFocus] = useState<RingFocus>('All')
  const difficulties: DifficultyConfig[] = [
    { label: 'Easy', solved: profile.easySolved, total: LEETCODE_TOTALS.Easy, color: '#10B981', tone: 'success' },
    { label: 'Medium', solved: profile.mediumSolved, total: LEETCODE_TOTALS.Medium, color: '#F59E0B', tone: 'warning' },
    { label: 'Hard', solved: profile.hardSolved, total: LEETCODE_TOTALS.Hard, color: '#EF4444', tone: 'danger' }
  ]

  return (
    <section className="card mt-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
        <div className="grid gap-3 sm:grid-cols-2 lg:w-36 lg:grid-cols-1">
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs text-secondary">Rank</p>
            <p className="mt-2 font-mono text-lg font-semibold text-primary">
              {formatRank(profile.globalRank)}
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
              <SolvedRing profile={profile} focus={focus} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {difficulties.map((difficulty) => (
                <DifficultyMetric
                  key={difficulty.label}
                  config={difficulty}
                  active={focus === difficulty.label}
                  onFocus={(value) => setFocus(value ?? 'All')}
                />
              ))}
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
        <SubmissionHeatmap cells={cells} today={today} />
      </div>
    </section>
  )
}
