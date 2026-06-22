import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { computeLeetCodeProfileFromDb } from '@/lib/profile/compute-leetcode-profile'
import { computeLeetCodeProfileUpsertForUser } from '@/lib/profile/compute-leetcode-profile-upsert'

export type DashboardLeetCodeProfile = {
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

export function isMissingLeetCodeProfileTable(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021'
}

function toDashboardProfile(profile: DashboardLeetCodeProfile): DashboardLeetCodeProfile {
  return {
    username: profile.username,
    totalSolved: profile.totalSolved,
    easySolved: profile.easySolved,
    mediumSolved: profile.mediumSolved,
    hardSolved: profile.hardSolved,
    activeDaysCount: profile.activeDaysCount,
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    submissionCount: profile.submissionCount,
    lastYearSubmissionCount: profile.lastYearSubmissionCount,
    globalRank: profile.globalRank,
    heatmap: profile.heatmap
  }
}

export async function getDashboardLeetCodeProfile(userId: string): Promise<DashboardLeetCodeProfile | null> {
  try {
    const saved = await prisma.leetCodeProfile.findUnique({ where: { userId } })
    if (saved) return toDashboardProfile(saved)

    await computeLeetCodeProfileUpsertForUser(userId)
    const created = await prisma.leetCodeProfile.findUnique({ where: { userId } })
    if (created) return toDashboardProfile(created)
  } catch (error) {
    if (!isMissingLeetCodeProfileTable(error)) throw error
  }

  return computeLeetCodeProfileFromDb(userId)
}
