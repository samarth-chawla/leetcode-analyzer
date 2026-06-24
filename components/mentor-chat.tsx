'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type MentorMessage = { role: string; content: string }

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }

    return <span key={index}>{part}</span>
  })
}

function FormattedMessage({ content }: { content: string }) {
  const blocks = content
    .replace(/---/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (blocks.length === 0) return null

  return (
    <div className="space-y-2">
      {blocks.map((line, index) => {
        const heading = line.match(/^#{1,4}\s+(.+)$/)
        const numbered = line.match(/^(\d+)\.\s+(.+)$/)
        const bullet = line.match(/^[-*]\s+(.+)$/)

        if (heading) {
          return (
            <p key={index} className="pt-1 text-[15px] font-semibold text-primary">
              {renderInlineMarkdown(heading[1])}
            </p>
          )
        }

        if (numbered) {
          return (
            <div key={index} className="grid grid-cols-[24px_1fr] gap-2">
              <span className="font-semibold text-brand">{numbered[1]}.</span>
              <p>{renderInlineMarkdown(numbered[2])}</p>
            </div>
          )
        }

        if (bullet) {
          return (
            <div key={index} className="grid grid-cols-[14px_1fr] gap-2">
              <span className="text-brand">-</span>
              <p>{renderInlineMarkdown(bullet[1])}</p>
            </div>
          )
        }

        return <p key={index}>{renderInlineMarkdown(line)}</p>
      })}
    </div>
  )
}

export function MentorChat({ initial }: { initial: MentorMessage[] }) {
  const [messages, setMessages] = useState(initial)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  function updateLastAssistant(chunk: string) {
    setMessages((current) => {
      const next = [...current]
      const last = next[next.length - 1]

      if (!last || last.role !== 'assistant') {
        return [...next, { role: 'assistant', content: chunk }]
      }

      next[next.length - 1] = { ...last, content: `${last.content}${chunk}` }
      return next
    })
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = message.trim()
    if (!text || busy) return

    setMessages((current) => [...current, { role: 'user', content: text }, { role: 'assistant', content: '' }])
    setMessage('')
    setBusy(true)

    try {
      const response = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })

      if (!response.ok || !response.body) {
        const result = await response.json().catch(() => null)
        updateLastAssistant(result?.error ?? 'The mentor could not answer right now. Please try again.')
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        updateLastAssistant(decoder.decode(value, { stream: true }))
      }

      const remaining = decoder.decode()
      if (remaining) updateLastAssistant(remaining)
    } catch {
      updateLastAssistant('The mentor could not connect right now. Please try again.')
    } finally {
      setBusy(false)
    }
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
            {item.role === 'assistant' ? (
              item.content ? <FormattedMessage content={item.content} /> : <span className="text-secondary">Preparing your answer...</span>
            ) : (
              item.content
            )}
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
