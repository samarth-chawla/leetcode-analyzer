'use client'

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const difficultyColors: Record<string, string> = {
  Easy: '#10B981',
  Medium: '#F59E0B',
  Hard: '#EF4444'
}

export function DifficultyChart({ data }: { data: Array<{ name: string; solved: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
        <CartesianGrid stroke="#E5E7EB" horizontal={false} />
        <XAxis type="number" allowDecimals={false} />
        <YAxis dataKey="name" type="category" width={55} tick={{ fontSize: 11, fill: '#4B5563' }} />
        <Tooltip formatter={(value: number) => [value, 'Solved']} />
        <Bar dataKey="solved" radius={[0, 6, 6, 0]}>
          {data.map((entry) => <Cell key={entry.name} fill={difficultyColors[entry.name] ?? '#6366F1'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function TopTopicsChart({ data }: { data: Array<{ topic: string; solved: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
        <CartesianGrid stroke="#E5E7EB" horizontal={false} />
        <XAxis type="number" allowDecimals={false} />
        <YAxis dataKey="topic" type="category" width={90} tick={{ fontSize: 10, fill: '#4B5563' }} />
        <Tooltip formatter={(value: number) => [value, 'Solved']} />
        <Bar dataKey="solved" fill="#6366F1" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

