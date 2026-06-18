'use client'

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function DifficultyChart({ data }: { data: Array<{ name: string; solved: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
        <CartesianGrid stroke="#E5E7EB" horizontal={false} />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={70} />
        <Tooltip />
        <Bar dataKey="solved" fill="#6366F1" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function EfficiencyChart() {
  const data = [
    { week: 'W1', attempts: 4.8 },
    { week: 'W2', attempts: 4.2 },
    { week: 'W3', attempts: 3.7 },
    { week: 'W4', attempts: 3.1 },
    { week: 'W5', attempts: 2.6 }
  ]

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid stroke="#E5E7EB" />
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="attempts" stroke="#10B981" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
