'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function MentorChat({ initial }: { initial: Array<{ role: string; content: string }> }) {
  const [messages, setMessages] = useState(initial)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = message.trim()
    if (!text) return
    setMessages((current) => [...current, { role: 'user', content: text }])
    setMessage('')
    setBusy(true)
    const response = await fetch('/api/mentor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
    const result = await response.json()
    setMessages((current) => [...current, { role: 'assistant', content: result.answer ?? 'I could not answer that yet.' }])
    setBusy(false)
  }

  return (
    <div className="card flex min-h-[640px] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-4 text-sm text-secondary">
            Ask about what to practice next, why a topic is weak, or how to adjust your interview plan.
          </div>
        ) : null}
        {messages.map((item, index) => (
          <div
            key={`${item.role}-${index}`}
            className={`max-w-[85%] rounded-xl p-3 text-sm leading-6 ${
              item.role === 'user' ? 'ml-auto bg-brand text-white' : 'bg-surface text-primary'
            }`}
          >
            {item.content}
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="mt-4 flex gap-2">
        <Input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask your AI mentor..." />
        <Button type="submit" disabled={busy} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
