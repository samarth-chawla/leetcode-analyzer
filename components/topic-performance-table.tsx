'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export type TopicPerformanceRow = {
  topic: string
  solved: number
  avgAttempts: number | null
  firstAttemptRate: number | null
  score: number | null
  status: string | null
}

const pageSize = 10

function statusLabel(status: string | null) {
  if (status === 'strong') return 'Strong'
  if (status === 'weak') return 'Weak'
  if (status === 'needs_work') return 'Needs Work'
  return 'History Needed'
}

function statusTone(status: string | null) {
  if (status === 'strong') return 'success'
  if (status === 'weak') return 'danger'
  if (status === 'needs_work') return 'warning'
  return 'neutral'
}

export function TopicPerformanceTable({ rows }: { rows: TopicPerformanceRow[] }) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const visibleRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [page, rows])

  if (rows.length === 0) {
    return <p className="mt-4 text-sm text-secondary">No LeetCode topic statistics are available yet.</p>
  }

  return (
    <div className="mt-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-secondary">
            <tr>
              <th className="py-3">Topic</th>
              <th>Solved</th>
              <th>Avg Attempts</th>
              <th>1st Attempt Rate</th>
              <th>Score (higher is better)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleRows.map((topic) => (
              <tr key={topic.topic}>
                <td className="py-3 font-medium text-primary">{topic.topic}</td>
                <td>{topic.solved}</td>
                <td>{topic.avgAttempts === null ? '-' : topic.avgAttempts.toFixed(1)}</td>
                <td>{topic.firstAttemptRate === null ? '-' : `${Math.round(topic.firstAttemptRate * 100)}%`}</td>
                <td>{topic.score === null ? '-' : `${topic.score}/100`}</td>
                <td>
                  <Badge tone={statusTone(topic.status)}>{statusLabel(topic.status)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-secondary">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, rows.length)} of {rows.length} topics
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-9 gap-2 px-3"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="min-w-16 text-center text-sm text-secondary">
              {page}/{totalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              className="h-9 gap-2 px-3"
              disabled={page === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
