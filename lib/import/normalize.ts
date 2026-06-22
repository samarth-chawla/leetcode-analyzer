import { prisma } from '@/lib/prisma'
import { fetchQuestionMetadata } from '@/lib/leetcode/graphql'
import type { ExtensionExport, NormalizedSubmission } from './types'

type ExtensionSubmission = Record<string, unknown>

export function normalizeExtensionSubmission(raw: unknown): NormalizedSubmission {
  const s = raw as ExtensionSubmission
  return {
    submissionId: String(s.submissionId ?? s.id ?? crypto.randomUUID()),
    problemId: s.problemId ? String(s.problemId) : null,
    title: String(s.title ?? 'Unknown Problem'),
    slug: String(s.slug ?? s.titleSlug ?? ''),
    difficulty: String(s.difficulty ?? 'Unknown'),
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
  question?: {
    questionId?: string
    difficulty?: string
    topicTags?: Array<{ name: string }>
  }
  title: string
  titleSlug: string
  statusDisplay: string
  runtime?: string
  memory?: string
  lang?: string
  timestamp: string
  url?: string
}

async function getQuestionMetadata(titleSlug: string) {
  const catalogProblem = await prisma.problemCatalog.findUnique({ where: { slug: titleSlug } })
  if (catalogProblem) return catalogProblem

  const metadata = await fetchQuestionMetadata(titleSlug)
  if (!metadata) return null

  return prisma.problemCatalog.upsert({
    where: { slug: metadata.titleSlug },
    create: {
      problemId: metadata.questionId,
      title: metadata.title,
      slug: metadata.titleSlug,
      difficulty: metadata.difficulty,
      topicTags: metadata.topicTags.map((topic) => topic.name),
      isPremium: metadata.isPaidOnly ?? false,
      leetcodeUrl: `https://leetcode.com/problems/${metadata.titleSlug}/`
    },
    update: {
      problemId: metadata.questionId,
      title: metadata.title,
      difficulty: metadata.difficulty,
      topicTags: metadata.topicTags.map((topic) => topic.name),
      isPremium: metadata.isPaidOnly ?? false,
      leetcodeUrl: `https://leetcode.com/problems/${metadata.titleSlug}/`
    }
  })
}

export async function normalizeGraphQLSubmissionWithFallback(
  raw: GraphQLSubmission
): Promise<NormalizedSubmission> {
  const graphqlDifficulty = raw.question?.difficulty
  const graphqlTopicTags = raw.question?.topicTags?.map((t) => t.name) ?? []

  const needsMetadata = !raw.question?.questionId || !graphqlDifficulty || graphqlTopicTags.length === 0
  const metadata = needsMetadata ? await getQuestionMetadata(raw.titleSlug) : null

  return {
    submissionId: raw.id,
    problemId: raw.question?.questionId ?? metadata?.problemId ?? null,
    title: metadata?.title ?? raw.title,
    slug: raw.titleSlug,
    difficulty: graphqlDifficulty ?? metadata?.difficulty ?? 'Unknown',
    topicTags: graphqlTopicTags.length > 0 ? graphqlTopicTags : metadata?.topicTags ?? [],
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
