'use client'

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const difficultyColors: Record<string, string> = {
  Easy: '#10B981',
  Medium: '#F59E0B',
  Hard: '#EF4444'
}

export function DifficultyChart({ data }: { data: Array<{ name: string; solved: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
        <CartesianGrid stroke="#E5E7EB" horizontal={false} />
        <XAxis type="number" allowDecimals={false} />
        <YAxis dataKey="name" type="category" width={70} />
        <Tooltip formatter={(value: number) => [value, 'Solved']} />
        <Bar dataKey="solved" radius={[0, 6, 6, 0]}>
          {data.map((entry) => <Cell key={entry.name} fill={difficultyColors[entry.name] ?? '#6366F1'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function EfficiencyChart({ data }: { data: Array<{ week: string; attempts: number | null }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid stroke="#E5E7EB" />
        <XAxis dataKey="week" />
        <YAxis allowDecimals domain={[0, 'auto']} />
        <Tooltip formatter={(value: number) => [value, 'Avg attempts']} />
        <Line connectNulls type="monotone" dataKey="attempts" stroke="#10B981" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}