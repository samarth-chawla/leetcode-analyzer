import { prisma } from '@/lib/prisma'

type HeatmapCell = {
  date: string // YYYY-MM-DD
  count: number
}

type ComputedLeetCodeProfile = {
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
  heatmap: { cells: HeatmapCell[] } | null
  globalRank: number | null
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function ymd(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function computeStreaks(days: Set<string>) {
  // days contains YYYY-MM-DD strings.
  if (days.size === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  const dateFromYmd = (s: string) => {
    const [y, m, d] = s.split('-').map((v) => Number(v))
    const dt = new Date(y, m - 1, d)
    dt.setHours(0, 0, 0, 0)
    return dt
  }

  const sorted = Array.from(days)
    .map(dateFromYmd)
    .sort((a, b) => a.getTime() - b.getTime())

  // Longest streak
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const cur = sorted[i]
    const diffDays = Math.round((startOfDay(cur).getTime() - startOfDay(prev).getTime()) / 86400000)
    if (diffDays === 1) {
      run += 1
    } else {
      run = 1
    }
    longest = Math.max(longest, run)
  }

  // Current streak: consecutive days ending at today.
  const today = startOfDay(new Date())
  let current = 0
  for (;;) {
    const key = ymd(today)
    if (!days.has(key)) break
    current += 1
    today.setDate(today.getDate() - 1)
  }

  return { currentStreak: current, longestStreak: longest }
}

export async function computeLeetCodeProfileFromDb(userId: string): Promise<ComputedLeetCodeProfile> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.leetcodeUsername) {
    throw new Error('Cannot compute profile: user.leetcodeUsername missing')
  }

  // Source of truth: accepted submissions.
  const accepted = await prisma.submission.findMany({
    where: { userId, statusDisplay: 'Accepted' },
    select: { problemId: true, difficulty: true, slug: true, timestamp: true }
  })

  // submissionCount: all submissions (attempts)
  const submissionCount = await prisma.submission.count({ where: { userId } })

  const lastYear = new Date()
  lastYear.setFullYear(lastYear.getFullYear() - 1)
  const lastYearSubmissionCount = await prisma.submission.count({
    where: { userId, timestamp: { gte: lastYear } }
  })

  // totalSolved = count distinct accepted problems by canonical problem id, falling back to slug.
  const distinct = new Set<string>()
  const easySlugs = new Set<string>()
  const mediumSlugs = new Set<string>()
  const hardSlugs = new Set<string>()

  const activeDays = new Set<string>()
  for (const s of accepted) {
    const problemKey = s.problemId ?? s.slug
    distinct.add(problemKey)
    const diff = s.difficulty
    if (diff === 'Easy') easySlugs.add(problemKey)
    else if (diff === 'Medium') mediumSlugs.add(problemKey)
    else if (diff === 'Hard') hardSlugs.add(problemKey)
    activeDays.add(ymd(s.timestamp))
  }

  const { currentStreak, longestStreak } = computeStreaks(activeDays)

  // Heatmap: count accepted submissions per day.
  // Build by formatting timestamps into YYYY-MM-DD.
  const acceptedTimestamps = await prisma.submission.findMany({
    where: { userId, statusDisplay: 'Accepted' },
    select: { timestamp: true }
  })


  const map = new Map<string, number>()
  for (const row of acceptedTimestamps) {
    const key = ymd(row.timestamp)
    map.set(key, (map.get(key) ?? 0) + 1)
  }

  const cells: HeatmapCell[] = Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    username: user.leetcodeUsername,
    totalSolved: distinct.size,
    easySolved: easySlugs.size,
    mediumSolved: mediumSlugs.size,
    hardSolved: hardSlugs.size,
    activeDaysCount: activeDays.size,
    currentStreak,
    longestStreak,
    submissionCount,
    lastYearSubmissionCount,
    heatmap: cells.length ? { cells } : null,
    globalRank: null
  }
}



