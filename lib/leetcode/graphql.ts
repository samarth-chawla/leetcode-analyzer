import type { GraphQLSubmission } from '@/lib/import/normalize'

export type LeetCodeQuestionMetadata = {
  questionId: string
  title: string
  titleSlug: string
  difficulty: string
  topicTags: Array<{ name: string }>
  isPaidOnly?: boolean
}

export type LeetCodeSolvedProfile = {
  username: string
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  globalRank: number | null
  activeDaysCount: number | null
  currentStreak: number | null
  longestStreak: number | null
  heatmap: { cells: Array<{ date: string; count: number }> } | null
}

type Page = {
  submissions: GraphQLSubmission[]
  // We can't reliably paginate without an offset argument.
  hasNext: boolean
}

async function leetCodeGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: JSON.stringify({ query, variables })
  })

  if (!response.ok) {
    const text = await response.text()
    console.error(`LeetCode request failed with ${response.status}:`, text)
    throw new Error(`LeetCode request failed with ${response.status}`)
  }

  const payload = await response.json()
  if (payload.errors) {
    console.error('LeetCode GraphQL errors:', payload.errors)
    throw new Error(`LeetCode GraphQL error: ${JSON.stringify(payload.errors)}`)
  }

  return payload.data
}

function ymdFromEpochSeconds(epochSeconds: string) {
  const date = new Date(Number(epochSeconds) * 1000)
  if (Number.isNaN(date.getTime())) return null
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export async function fetchSubmissionPage(username: string, limit: number): Promise<Page> {
  try {
    const payload = await leetCodeGraphQL<{ recentSubmissionList?: GraphQLSubmission[] }>(
      `
        query recentSubmissions($username: String!, $limit: Int!) {
          recentSubmissionList(username: $username, limit: $limit) {
            id
            title
            titleSlug
            timestamp
            statusDisplay
            lang
            runtime
            memory
            url
          }
        }
      `,
      { username, limit }
    )

    return {
      submissions: payload.recentSubmissionList ?? [],
      hasNext: false
    }
  } catch (error) {
    console.error('fetchSubmissionPage error:', error)
    throw error
  }
}

export async function fetchQuestionMetadata(
  titleSlug: string
): Promise<LeetCodeQuestionMetadata | null> {
  const payload = await leetCodeGraphQL<{ question?: LeetCodeQuestionMetadata }>(
    `
      query questionMetadata($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          title
          titleSlug
          difficulty
          topicTags {
            name
          }
          isPaidOnly
        }
      }
    `,
    { titleSlug }
  )

  return payload.question ?? null
}

export async function fetchUserSolvedProfile(username: string): Promise<LeetCodeSolvedProfile | null> {
  const payload = await leetCodeGraphQL<{
    matchedUser?: {
      username: string
      profile?: { ranking?: number | null }
      submitStatsGlobal?: {
        acSubmissionNum?: Array<{ difficulty: string; count: number }>
      }
      userCalendar?: {
        streak?: number
        totalActiveDays?: number
        submissionCalendar?: string
      }
    } | null
  }>(
    `
      query userSolvedProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
          }
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
          userCalendar {
            streak
            totalActiveDays
            submissionCalendar
          }
        }
      }
    `,
    { username }
  )

  const user = payload.matchedUser
  if (!user) return null

  const solved = new Map(
    (user.submitStatsGlobal?.acSubmissionNum ?? []).map((row) => [row.difficulty, row.count])
  )

  let heatmap: LeetCodeSolvedProfile['heatmap'] = null
  if (user.userCalendar?.submissionCalendar) {
    try {
      const parsed = JSON.parse(user.userCalendar.submissionCalendar) as Record<string, number>
      const cells = Object.entries(parsed)
        .map(([epoch, count]) => {
          const date = ymdFromEpochSeconds(epoch)
          return date ? { date, count } : null
        })
        .filter((cell): cell is { date: string; count: number } => Boolean(cell))
        .sort((a, b) => a.date.localeCompare(b.date))
      heatmap = cells.length ? { cells } : null
    } catch {
      heatmap = null
    }
  }

  return {
    username: user.username,
    totalSolved: solved.get('All') ?? 0,
    easySolved: solved.get('Easy') ?? 0,
    mediumSolved: solved.get('Medium') ?? 0,
    hardSolved: solved.get('Hard') ?? 0,
    globalRank: user.profile?.ranking ?? null,
    activeDaysCount: user.userCalendar?.totalActiveDays ?? null,
    currentStreak: user.userCalendar?.streak ?? null,
    longestStreak: null,
    heatmap
  }
}

export async function fetchSubmissionsSince(
  username: string,
  cutoff: Date
): Promise<GraphQLSubmission[]> {
  // LeetCode pagination in this schema doesn't support `offset` (and `question` isn't available),
  // so this endpoint can only provide the latest batch reliably.
  const page = await fetchSubmissionPage(username, 50)
  const parsed = page.submissions
    .map((s) => ({ raw: s, ts: new Date(parseInt(s.timestamp, 10) * 1000) }))
    .filter((x) => !Number.isNaN(x.ts.getTime()) && x.ts > cutoff)

  const seen = new Set<string>()
  const deduped: GraphQLSubmission[] = []
  for (const { raw } of parsed) {
    if (seen.has(raw.id)) continue
    seen.add(raw.id)
    deduped.push(raw)
  }

  return deduped
}
