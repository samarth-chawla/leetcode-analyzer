'use client'

import { useState } from 'react'
import { Check, ExternalLink, Award, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const mockDays = [
  {
    topic: 'Dynamic Programming',
    difficulty: 'Easy/Medium Focus',
    streak: '8 days',
    problems: [
      {
        name: 'Climbing Stairs',
        diff: 'Easy',
        topicTag: 'Dynamic Programming',
        reason: 'Dynamic Programming is one of your highest-impact topics right now.',
        completed: true
      },
      {
        name: 'House Robber',
        diff: 'Medium',
        topicTag: 'Dynamic Programming',
        reason: 'Your Dynamic Programming scores show weakness in optimization logic.',
        completed: false
      },
      {
        name: 'Longest Increasing Subsequence',
        diff: 'Medium',
        topicTag: 'Dynamic Programming',
        reason: 'State transitions and subproblems are key interview-grade DP patterns.',
        completed: false
      }
    ]
  },
  {
    topic: 'Graphs',
    difficulty: 'Medium Focus',
    streak: '9 days',
    problems: [
      {
        name: 'Number of Islands',
        diff: 'Medium',
        topicTag: 'Graphs',
        reason: 'Graphs is one of your highest-impact topics right now.',
        completed: true
      },
      {
        name: 'Rotting Oranges',
        diff: 'Medium',
        topicTag: 'Graphs',
        reason: 'BFS recursion and path queueing need some additional practice.',
        completed: true
      },
      {
        name: 'Course Schedule',
        diff: 'Medium',
        topicTag: 'Graphs',
        reason: 'Topological sort is highly tested for graph dependency analysis.',
        completed: false
      }
    ]
  },
  {
    topic: 'Trees',
    difficulty: 'Mixed Focus',
    streak: '10 days',
    problems: [
      {
        name: 'Invert Binary Tree',
        diff: 'Easy',
        topicTag: 'Trees',
        reason: 'Trees is one of your highest-impact topics right now.',
        completed: true
      },
      {
        name: 'Lowest Common Ancestor',
        diff: 'Medium',
        topicTag: 'Trees',
        reason: 'LCA recursion traversal is a common pattern in coding interviews.',
        completed: true
      },
      {
        name: 'Binary Tree Maximum Path Sum',
        diff: 'Hard',
        topicTag: 'Trees',
        reason: 'Revisit: you last touched this 64 days ago, and Trees still needs attention.',
        completed: true
      }
    ]
  }
]

export function InteractivePlanPreview() {
  const [activeDay, setActiveDay] = useState(0)
  const [completedStates, setCompletedStates] = useState<Record<string, boolean>>({})

  const currentDay = mockDays[activeDay]

  const toggleProblem = (problemName: string) => {
    setCompletedStates((prev) => ({
      ...prev,
      [problemName]: !prev[problemName]
    }))
  }

  const getStatus = (problem: typeof currentDay.problems[0]) => {
    if (completedStates[problem.name] !== undefined) {
      return completedStates[problem.name]
    }
    return problem.completed
  }

  const solvedCount = currentDay.problems.filter((p) => getStatus(p)).length
  const totalCount = currentDay.problems.length
  const progressPercent = Math.round((solvedCount / totalCount) * 100)

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
            Interactive Preview
          </span>
          <h3 className="text-lg font-bold text-primary mt-0.5 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-brand" />
            Today's Practice Plan
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="neutral" className="font-semibold">{currentDay.streak} streak</Badge>
        </div>
      </div>

      {/* Tabs to switch Days */}
      <div className="mt-4 flex gap-1 rounded-lg bg-surface p-1 text-xs">
        {mockDays.map((day, idx) => (
          <button
            key={day.topic}
            onClick={() => setActiveDay(idx)}
            className={`flex-1 rounded-md py-1.5 font-medium transition-all ${
              activeDay === idx ? 'bg-white text-brand shadow-sm font-semibold' : 'text-secondary hover:text-primary'
            }`}
          >
            Day {idx + 1}: {day.topic}
          </button>
        ))}
      </div>

      {/* Problems List styled like dashboard problems list */}
      <div className="mt-2 divide-y divide-border">
        {currentDay.problems.map((problem, index) => {
          const isDone = getStatus(problem)
          const isRevisit = problem.reason.startsWith('Revisit:')

          return (
            <div
              key={problem.name}
              className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className={`flex-1 transition-opacity ${isDone ? 'opacity-65' : ''}`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleProblem(problem.name)}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                      isDone
                        ? 'border-success bg-success text-white'
                        : 'border-secondary/40 bg-white hover:border-brand text-transparent hover:text-secondary/40'
                    }`}
                    title={isDone ? "Mark incomplete" : "Mark completed"}
                  >
                    {isDone ? (
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    ) : (
                      <span className="text-xs font-semibold text-secondary">{index + 1}</span>
                    )}
                  </button>
                  <h3 className={`text-lg font-semibold text-primary ${isDone ? 'line-through' : ''}`}>
                    {problem.name}
                  </h3>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {isRevisit ? <Badge tone="brand">Revisit</Badge> : null}
                  <Badge tone="neutral">{problem.topicTag}</Badge>
                  <Badge
                    tone={
                      problem.diff === 'Easy'
                        ? 'success'
                        : problem.diff === 'Hard'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {problem.diff}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-secondary">{problem.reason}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleProblem(problem.name)}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition-all hover:bg-brand/90 hover:shadow-sm"
                >
                  Start <ExternalLink className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress Footer */}
      <div className="mt-5 border-t border-border pt-4">
        <div className="flex items-center justify-between text-xs font-semibold text-secondary">
          <span>DAILY COMPLETION</span>
          <span className="text-primary">
            {solvedCount}/{totalCount} PROBLEMS ({progressPercent}%)
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              progressPercent === 100 ? 'bg-success' : 'bg-brand'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {progressPercent === 100 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-success animate-bounce">
            <Award className="h-4 w-4" />
            <span>Amazing! You completed today's practice set! +15 XP</span>
          </div>
        )}
      </div>
    </div>
  )
}
