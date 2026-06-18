import { prisma } from '@/lib/prisma'
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

export async function normalizeGraphQLSubmissionWithFallback(
  raw: GraphQLSubmission
): Promise<NormalizedSubmission> {
  const difficulty = raw.question?.difficulty
  const topicTags = raw.question?.topicTags?.map((t) => t.name) ?? []
  
  const needsCatalog = !difficulty || topicTags.length === 0
  const catalogProblem = needsCatalog
    ? await prisma.problemCatalog.findUnique({ where: { slug: raw.titleSlug } })
    : null

  return {
    submissionId: raw.id,
    problemId: raw.question?.questionId ?? catalogProblem?.problemId ?? null,
    title: raw.title,
    slug: raw.titleSlug,
    difficulty: difficulty ?? catalogProblem?.difficulty ?? 'Medium',
    topicTags: topicTags.length > 0 ? topicTags : catalogProblem?.topicTags ?? [],
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
