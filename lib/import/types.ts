export type NormalizedSubmission = {
  submissionId: string
  problemId: string | null
  title: string
  slug: string
  difficulty: string
  topicTags: string[]
  statusCode: number | null
  status: string
  statusDisplay: string
  runtime: string | null
  memory: string | null
  language: string | null
  timestamp: Date
  submissionUrl: string | null
}

export type ExtensionExport = {
  version: string
  exportMethod?: string
  exportedAt?: string
  user: {
    username: string
    totalSolved?: number
    easySolved?: number
    mediumSolved?: number
    hardSolved?: number
    exportSource?: string
  }
  submissions: unknown[]
}

export type ImportResult = {
  imported: number
  skipped: number
  message: string
}
