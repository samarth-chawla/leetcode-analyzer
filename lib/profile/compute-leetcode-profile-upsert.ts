import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { fetchUserSolvedProfile } from '@/lib/leetcode/graphql'
import { computeLeetCodeProfileFromDb } from '@/lib/profile/compute-leetcode-profile'

function isMissingLeetCodeProfileTable(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021'
}


function computeLongestStreak(dates: string[]) {
  if (dates.length === 0) return 0

  const sorted = dates
    .map((date) => {
      const [year, month, day] = date.split('-').map(Number)
      return new Date(year, month - 1, day)
    })
    .sort((a, b) => a.getTime() - b.getTime())

  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    const diffDays = Math.round((sorted[i].getTime() - sorted[i - 1].getTime()) / 86400000)
    if (diffDays === 1) {
      run += 1
    } else if (diffDays > 1) {
      run = 1
    }
    longest = Math.max(longest, run)
  }

  return longest
}

function countLastYearSubmissions(heatmap: { cells: Array<{ date: string; count: number }> } | null) {
  if (!heatmap) return null
  const lastYear = new Date()
  lastYear.setFullYear(lastYear.getFullYear() - 1)
  const yyyy = lastYear.getFullYear()
  const mm = String(lastYear.getMonth() + 1).padStart(2, '0')
  const dd = String(lastYear.getDate()).padStart(2, '0')
  const cutoff = `${yyyy}-${mm}-${dd}`

  return heatmap.cells
    .filter((cell) => cell.date >= cutoff)
    .reduce((sum, cell) => sum + cell.count, 0)
}

export async function computeLeetCodeProfileUpsertForUser(userId: string) {
  const profile = await computeLeetCodeProfileFromDb(userId)

  let official: Awaited<ReturnType<typeof fetchUserSolvedProfile>> = null
  try {
    official = await fetchUserSolvedProfile(profile.username)
  } catch (error) {
    console.warn('Could not fetch official LeetCode profile; falling back to imported submissions.', error)
  }

  const officialHeatmap = official?.heatmap ?? null
  const heatmap = officialHeatmap ?? profile.heatmap ?? Prisma.JsonNull
  const officialSubmissionCount = officialHeatmap
    ? officialHeatmap.cells.reduce((sum, cell) => sum + cell.count, 0)
    : null
  const officialLastYearSubmissionCount = countLastYearSubmissions(officialHeatmap)
  const officialLongestStreak = officialHeatmap
    ? computeLongestStreak(officialHeatmap.cells.filter((cell) => cell.count > 0).map((cell) => cell.date))
    : null

  const data = {
    username: official?.username ?? profile.username,
    totalSolved: official?.totalSolved ?? profile.totalSolved,
    easySolved: official?.easySolved ?? profile.easySolved,
    mediumSolved: official?.mediumSolved ?? profile.mediumSolved,
    hardSolved: official?.hardSolved ?? profile.hardSolved,
    activeDaysCount: official?.activeDaysCount ?? profile.activeDaysCount,
    currentStreak: official?.currentStreak ?? profile.currentStreak,
    longestStreak: officialLongestStreak ?? official?.longestStreak ?? profile.longestStreak,
    submissionCount: officialSubmissionCount ?? profile.submissionCount,
    lastYearSubmissionCount: officialLastYearSubmissionCount ?? profile.lastYearSubmissionCount,
    globalRank: official?.globalRank ?? profile.globalRank,
    heatmap
  }

  try {
    const existing = await prisma.leetCodeProfile.findUnique({ where: { userId } })
    if (!existing) {
      await prisma.leetCodeProfile.create({
        data: {
          userId,
          ...data
        }
      })
      return
    }

    await prisma.leetCodeProfile.update({
      where: { userId },
      data
    })
  } catch (error) {
    if (isMissingLeetCodeProfileTable(error)) {
      console.warn('LeetCodeProfile table is missing; computed profile was not persisted. Run `npx prisma db push`.')
      return
    }
    throw error
  }
}
