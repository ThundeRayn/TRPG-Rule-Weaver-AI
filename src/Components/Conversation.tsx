import { useState, useRef, useEffect } from "react"
import { Input } from "@/Components/ui/input"
import { Button } from "@/Components/ui/button"
import { useAuth } from "@/context/AuthContext"
import ReactMarkdown from "react-markdown"

type Message = { role: "user" | "assistant"; text: string; streaming?: boolean }

const API = "http://localhost:5000"

type Props = {
  sessionId: string
  onMessageSent?: () => void
}

function parseCitations(text: string) {
  const matches = [...text.matchAll(/\[([^\]]+),\s*p\.(\d+)\]/g)]
  const seen = new Set<string>()
  return matches
    .map(m => ({ source: m[1].trim(), page: parseInt(m[2]) }))
    .filter(c => {
      const key = `${c.source}-${c.page}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function isDescription(text: string) {
  const t = text.trim()
  return t.startsWith("*") && t.endsWith("*") && !t.startsWith("**") && t.length > 2
}

function stripAsterisks(text: string) {
  return text.trim().slice(1, -1).trim()
}

// Splits a paragraph into chunks, extracting *...* description lines
function splitIntoChunks(text: string): string[] {
  if (!text.trim()) return []
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const result: string[] = []

  for (const para of paragraphs) {
    const lines = para.split("\n")
    let current: string[] = []

    for (const line of lines) {
      if (isDescription(line.trim())) {
        if (current.length > 0) {
          result.push(current.join("\n").trim())
          current = []
        }
        result.push(line.trim())
      } else {
        current.push(line)
      }
    }
    if (current.length > 0) result.push(current.join("\n").trim())
  }

  return result.filter(Boolean)
}

const mdComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p:      ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-[var(--primary-text-color)]">{children}</strong>,
  em:     ({ children }) => <em className="italic text-[var(--secondary-text-color)]">{children}</em>,
  ul:     ({ children }) => <ul className="list-disc list-inside mt-1 space-y-0.5">{children}</ul>,
  ol:     ({ children }) => <ol className="list-decimal list-inside mt-1 space-y-0.5">{children}</ol>,
  li:     ({ children }) => <li className="ml-2">{children}</li>,
}

function CitationBadges({ text }: { text: string }) {
  const citations = parseCitations(text)
  if (citations.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {citations.map((c, i) => (
        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[var(--sidebar-color)] border border-[var(--border-color)] text-[var(--secondary-text-color)]">
          📖 {c.source} p.{c.page}
        </span>
      ))}
    </div>
  )
}

function AssistantBubble({ text }: { text: string }) {
  if (isDescription(text)) {
    return (
      <div className="flex justify-start">
        <div className="italic text-[var(--secondary-text-color)] bg-[var(--sidebar-color)] border-l-2 border-[var(--theme-color)] px-5 py-3 max-w-[85%] rounded-r-xl text-sm leading-relaxed">
          <ReactMarkdown components={mdComponents}>{stripAsterisks(text)}</ReactMarkdown>
          <CitationBadges text={text} />
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-start">
      <div className="bg-[var(--primary-color)] max-w-[80%] border border-white px-5 p-2 rounded-xl leading-relaxed">
        <ReactMarkdown components={mdComponents}>{text}</ReactMarkdown>
        <CitationBadges text={text} />
      </div>
    </div>
  )
}

// Raw text while streaming — no markdown parsing overhead
function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-start">
      <div className="bg-[var(--primary-color)] max-w-[80%] border border-white px-5 p-2 rounded-xl leading-relaxed whitespace-pre-wrap min-h-[2rem]">
        {text || <span className="opacity-40">···</span>}
      </div>
    </div>
  )
}

export default function Conversation({ sessionId, onMessageSent }: Props) {
  const { token } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  // Tracks the paragraph being typed — lives outside React state to avoid stale closures
  const paraBuffer = useRef("")

  useEffect(() => {
    setLoading(true)
    setMessages([])
    paraBuffer.current = ""
    fetch(`${API}/api/session/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.messages?.length > 0) {
          setMessages(data.messages)
        } else {
          setMessages([{ role: "assistant", text: "Welcome new player, let's create a new character!" }])
        }
      })
      .catch(() => {
        setMessages([{ role: "assistant", text: "Welcome new player, let's create a new character!" }])
      })
      .finally(() => setLoading(false))
  }, [sessionId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input || loading) return

    const userMessage = input
    setMessages((prev) => [...prev, { role: "user", text: userMessage }])
    setInput("")
    setLoading(true)
    paraBuffer.current = ""
    // Start with one empty streaming bubble
    setMessages((prev) => [...prev, { role: "assistant", text: "", streaming: true }])

    let doneReceived = false

    const handleToken = (tok: string) => {
      paraBuffer.current += tok

      if (!paraBuffer.current.includes("\n\n")) {
        // Still within the same paragraph — just update the streaming bubble
        const buf = paraBuffer.current
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: buf }
          return updated
        })
        return
      }

      // Paragraph boundary detected — freeze completed paragraphs, start a new bubble
      const parts = paraBuffer.current.split(/\n\n+/)
      const completedParts = parts.slice(0, -1).map((p) => p.trim()).filter(Boolean)
      const remainder = parts[parts.length - 1] ?? ""
      paraBuffer.current = remainder

      // Collect all frozen chunks (handles description lines within completed paragraphs)
      const frozenChunks: string[] = []
      for (const part of completedParts) {
        frozenChunks.push(...splitIntoChunks(part))
      }

      setMessages((prev) => {
        const updated = [...prev]

        if (frozenChunks.length === 0) {
          // Nothing to freeze — just reset streaming bubble to remainder
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: remainder }
          return updated
        }

        // Freeze the current streaming bubble with the first completed chunk
        updated[updated.length - 1] = { role: "assistant", text: frozenChunks[0], streaming: false }

        // Add any additional completed chunks
        for (let i = 1; i < frozenChunks.length; i++) {
          updated.push({ role: "assistant", text: frozenChunks[i], streaming: false })
        }

        // Start a fresh streaming bubble for the remainder
        updated.push({ role: "assistant", text: remainder, streaming: true })
        return updated
      })
    }

    // Called when stream ends — finalizes the last streaming bubble
    const finalize = () => {
      setMessages((prev) => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (!last?.streaming) return prev

        const chunks = splitIntoChunks(last.text)

        if (chunks.length === 0) {
          return updated.slice(0, -1) // remove empty trailing bubble
        }

        const withoutLast = updated.slice(0, -1)
        return [
          ...withoutLast,
          ...chunks.map((text) => ({ role: "assistant" as const, text, streaming: false })),
        ]
      })

      setLoading(false)
      onMessageSent?.()
    }

    try {
      const response = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage, history: messages, sessionId }),
      })

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === "token") handleToken(event.token)
            if (event.type === "done") { doneReceived = true; finalize() }
          } catch {}
        }
      }

      if (!doneReceived) finalize()
    } catch (error) {
      console.error("Error calling AI:", error)
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: "assistant",
          text: "Error: Failed to get AI response.",
          streaming: false,
        }
        return updated
      })
      setLoading(false)
    }
  }

  const isStreamingNow = messages.some((m) => m.streaming)

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-[var(--primary-color)] rounded"
      >
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div
                className="bg-[var(--dialog-color)] text-white ml-auto px-5 max-w-[70%] w-fit min-w-[2.5rem] p-2 rounded-xl"
                style={{ wordBreak: "break-word" }}
              >
                {msg.text}
              </div>
            </div>
          ) : msg.streaming ? (
            <StreamingBubble key={i} text={msg.text} />
          ) : (
            <AssistantBubble key={i} text={msg.text} />
          )
        )}
        {loading && !isStreamingNow && (
          <div className="flex justify-start">
            <div className="bg-[var(--sidebar-color)] border border-[var(--border-color)] px-4 py-2 rounded-xl text-sm text-[var(--secondary-text-color)]">
              ···
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 p-2 pt-5 pb-0 border-t">
        <Input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={loading}
        />
        <Button onClick={sendMessage} disabled={loading}>Send</Button>
      </div>
    </div>
  )
}
