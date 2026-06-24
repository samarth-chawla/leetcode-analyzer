'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type Problem = {
  id: string
  title: string
  slug: string
  topic: string
  difficulty: string
  reason: string
  leetcodeUrl: string
  order: number
  completed: boolean
}

export function DashboardProblemsList({ initialProblems }: { initialProblems: Problem[] }) {
  const router = useRouter()
  const [problems, setProblems] = useState<Problem[]>(initialProblems)
  const [toggling, setToggling] = useState<Record<string, boolean>>({})

  // Keep local state in sync if prop changes
  const [lastInitial, setLastInitial] = useState(initialProblems)
  if (JSON.stringify(initialProblems) !== JSON.stringify(lastInitial)) {
    setProblems(initialProblems)
    setLastInitial(initialProblems)
  }

  async function handleToggle(problemId: string, currentCompleted: boolean) {
    if (toggling[problemId]) return

    const nextCompleted = !currentCompleted

    // Optimistically update UI
    setProblems((prev) =>
      prev.map((p) => (p.id === problemId ? { ...p, completed: nextCompleted } : p))
    )

    setToggling((prev) => ({ ...prev, [problemId]: true }))

    try {
      const response = await fetch('/api/plan/toggle-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, completed: nextCompleted })
      })

      if (!response.ok) {
        // Revert on error
        setProblems((prev) =>
          prev.map((p) => (p.id === problemId ? { ...p, completed: currentCompleted } : p))
        )
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to toggle completion status', err)
      // Revert on error
      setProblems((prev) =>
        prev.map((p) => (p.id === problemId ? { ...p, completed: currentCompleted } : p))
      )
    } finally {
      setToggling((prev) => ({ ...prev, [problemId]: false }))
    }
  }

  return (
    <div className="divide-y divide-border">
      {problems.map((problem) => {
        const isBusy = toggling[problem.id]

        return (
          <div key={problem.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className={`flex-1 transition-opacity ${problem.completed ? 'opacity-65' : ''}`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(problem.id, problem.completed)}
                  disabled={isBusy}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                    problem.completed
                      ? 'border-success bg-success text-white'
                      : 'border-secondary/40 bg-white hover:border-brand text-transparent hover:text-secondary/40'
                  }`}
                  title={problem.completed ? "Mark incomplete" : "Mark completed"}
                >
                  {isBusy ? (
                    <Loader2 className="h-3 w-3 animate-spin text-secondary" />
                  ) : problem.completed ? (
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  ) : (
                    <span className="text-xs font-semibold">{problem.order}</span>
                  )}
                </button>
                <h3 className={`text-lg font-semibold text-primary ${problem.completed ? 'line-through' : ''}`}>
                  {problem.title}
                </h3>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {problem.reason.startsWith('Revisit:') ? <Badge tone="brand">Revisit</Badge> : null}
                <Badge tone="neutral">{problem.topic}</Badge>
                <Badge tone={problem.difficulty === 'Easy' ? 'success' : problem.difficulty === 'Hard' ? 'danger' : 'warning'}>
                  {problem.difficulty}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-secondary">{problem.reason}</p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={problem.leetcodeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition-all hover:bg-brand/90 hover:shadow-sm"
              >
                Start <ExternalLink className="ml-2 h-4 w-4" />
              </a>

              {/* <button
                onClick={() => handleToggle(problem.id, problem.completed)}
                disabled={isBusy}
                className={`h-10 px-4 text-sm font-medium border rounded-lg flex items-center gap-1.5 transition-all ${
                  problem.completed
                    ? 'bg-success/10 border-success/20 text-success hover:bg-success/20'
                    : 'border-border bg-white text-secondary hover:bg-surface hover:text-primary'
                }`}
              >
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : problem.completed ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Solved
                  </>
                ) : (
                  'Mark Done'
                )}
              </button> */}
            </div>
          </div>
        )
      })}
    </div>
  )
}
