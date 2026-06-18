from pathlib import Path

graphql_path = Path(r"d:\Desktop\ME\leetcode-analyzer\lib\leetcode\graphql.ts")
normalize_path = Path(
    r"d:\Desktop\ME\leetcode-analyzer\lib\import\normalize.ts")

graphql_path.write_text("""import type { GraphQLSubmission } from '@/lib/import/normalize'

type Page = {
  submissions: GraphQLSubmission[]
  hasNext: boolean
}

export async function fetchSubmissionPage(username: string, limit: number): Promise<Page> {
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        query: `
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
        variables: { username, limit }
      })
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

    const submissions = payload.data?.recentSubmissionList ?? []
    return {
      submissions,
      hasNext: submissions.length === limit
    }
  } catch (error) {
    console.error('fetchSubmissionPage error:', error)
    throw error
  }
}

export async function fetchSubmissionsSince(username: string, cutoff: Date): Promise<GraphQLSubmission[]> {
  const page = await fetchSubmissionPage(username, 100)
  return page.submissions.filter(
    (submission) => new Date(parseInt(submission.timestamp, 10) * 1000) > cutoff
  )
}
""", encoding="utf-8")

normalize_path.write_text("""import { prisma } from '@/lib/prisma'
import type { ExtensionExport, NormalizedSubmission } from './types'

type ExtensionSubmission = Record<string, unknown>

export function normalizeExtensionSubmission(raw: unknown): NormalizedSubmission {
  const s = raw as ExtensionSubmission
  return {
    submissionId: String(s.submissionId ?? s.id ?? crypto.randomUUID()),
    problemId: s.problemId ? String(s.problemId) : null,
    title: String(s.title ?? 'Unknown Problem'),
    slug: String(s.slug ?? s.titleSlug ?? ''),
    difficulty: String(s.difficulty ?? 'Medium'),
    topicTags: Array.isArray(s.topicTags) ? s.topicTags.map(String) : [],
    statusCode: typeof s.statusCode === 'number' ? s.statusCode : null,
    status: String(s.status ?? s.statusDisplay ?? 'Unknown'),
    statusDisplay: String(s.statusDisplay ?? s.status ?? 'Unknown'),
    runtime: s.runtime ? String(s.runtime) : null,
    memory: s.memory ? String(s.memory) : null,
    language: s.language ? String(s.language) : null,
    timestamp: new Date(Number(s.timestamp) * 1000),
    submissionUrl: s.submissionUrl ? String(s.submissionUrl) : null
  }
}

export type GraphQLSubmission = {
  id: string
  title: string
  titleSlug: string
  statusDisplay: string
  runtime?: string
  memory?: string
  lang?: string
  timestamp: string
  url?: string
}

export async function normalizeGraphQLSubmissionWithFallback(
  raw: GraphQLSubmission
): Promise<NormalizedSubmission> {
  const catalogProblem = await prisma.problemCatalog.findUnique({ where: { slug: raw.titleSlug } })

  return {
    submissionId: raw.id,
    problemId: catalogProblem?.problemId ?? null,
    title: raw.title,
    slug: raw.titleSlug,
    difficulty: catalogProblem?.difficulty ?? 'Medium',
    topicTags: catalogProblem?.topicTags ?? [],
    statusCode: null,
    status: raw.statusDisplay,
    statusDisplay: raw.statusDisplay,
    runtime: raw.runtime ?? null,
    memory: raw.memory ?? null,
    language: raw.lang ?? null,
    timestamp: new Date(parseInt(raw.timestamp, 10) * 1000),
    submissionUrl: raw.url ? `https://leetcode.com${raw.url}` : null
  }
}

export function normalizeExtensionExport(data: ExtensionExport) {
  return data.submissions
    .map(normalizeExtensionSubmission)
    .filter((submission) => submission.slug && !Number.isNaN(submission.timestamp.getTime()))
}
""", encoding="utf-8")
