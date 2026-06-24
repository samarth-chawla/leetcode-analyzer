'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [messages, setMessages] = useState(initial)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      router.refresh()
    } catch {
      updateLastAssistant('The mentor could not connect right now. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 3000)
      return
    }

    setResetting(true)
    setConfirmReset(false)
    try {
      const response = await fetch('/api/mentor/reset', {
        method: 'POST'
      })
      if (response.ok) {
        setMessages([])
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to reset chat history.', err)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="card flex h-[calc(100vh-300px)] md:h-[calc(100vh-190px)] min-h-[460px] flex-col">
      {/* Chat Header */}
      <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-sm font-semibold text-primary">Chat Session</h2>
          <p className="hidden sm:block text-xs text-secondary">Your profile context is loaded and active</p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={busy || resetting}
            className={`h-8 px-3 text-xs flex items-center gap-1.5 transition-all ${
              confirmReset
                ? 'border-danger bg-danger/10 text-danger hover:bg-danger/20 hover:text-danger'
                : 'text-secondary hover:text-danger hover:border-danger/30'
            }`}
          >
            {resetting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RotateCcw className="h-3 w-3" />
            )}
            {confirmReset ? 'Confirm' : 'Reset Chat'}
          </Button>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-4 text-sm text-secondary">
            Ask about what to practice next, why a topic is weak, or how to adjust your interview plan.
          </div>
        ) : null}
        {messages.map((item, index) => (
          <div
            key={`${item.role}-${index}`}
            className={`max-w-[90%] md:max-w-[85%] rounded-xl p-3 text-sm leading-6 ${
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
        <div ref={messagesEndRef} />
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
