import { useState, useRef, useEffect } from "react"
import { Input } from "@/Components/ui/input"
import { Button } from "@/Components/ui/button"
import { useAuth } from "@/context/AuthContext"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type ToolCallEvent = {
  name:   string
  args:   Record<string, unknown>
  result: Record<string, unknown>
}

type Message =
  | { role: "user" | "assistant"; text: string; streaming?: boolean }
  | { role: "tool_call"; toolCall: ToolCallEvent }
  | { role: "step_divider"; step: string }

const STEP_INFO: Record<string, { number: number; label: string; hint: string }> = {
  CONCEPT:         { number: 1, label: "Character Concept",   hint: "Name · Age · Background" },
  CHARACTERISTICS: { number: 2, label: "Characteristics",     hint: "STR · CON · SIZ · DEX · APP · INT · POW · EDU" },
  DERIVED:         { number: 3, label: "Derived Attributes",  hint: "HP · Sanity · Luck · Magic Points · Damage Bonus" },
  OCCUPATION:      { number: 4, label: "Occupation",          hint: "Job · Skill Points" },
  SKILLS:          { number: 5, label: "Skills",              hint: "Spend occupation & personal interest points" },
  BACKSTORY:       { number: 6, label: "Backstory",           hint: "Ideology · People · Places · Possessions · Traits" },
  FINALIZE:        { number: 7, label: "Finalize",            hint: "Appearance · Final review" },
}

type Sheet = Record<string, unknown>

const API = "http://localhost:5000"

type Props = {
  sessionId:      string
  onMessageSent?: () => void
  onStepChange?:  (step: string, sheet: Sheet) => void
}

function parseChoices(text: string): string[] {
  const matches = [...text.matchAll(/\[CHOICE:\s*([^\]]+)\]/g)]
  return matches.map(m => m[1].trim())
}

function stripChoices(text: string): string {
  return text.replace(/\[CHOICE:[^\]]+\]/g, "").replace(/\n{3,}/g, "\n\n").trim()
}

function stripAdvance(text: string): string {
  return text.replace(/\[ADVANCE:\s*\{[\s\S]*?\}\]/g, "").replace(/\n{3,}/g, "\n\n").trim()
}

function stripDsml(text: string): string {
  // Strip DeepSeek DSML markup (<｜｜DSML... U+FF5C U+FF5C) if it slips through
  const idx = text.search(/<｜｜DSML/)
  return idx >= 0 ? text.slice(0, idx).trimEnd() : text
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
  p:     ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
  strong:({ children }) => <strong className="font-bold text-[var(--primary-text-color)]">{children}</strong>,
  em:    ({ children }) => <em className="italic text-[var(--secondary-text-color)]">{children}</em>,
  ul:    ({ children }) => <ul className="list-disc list-inside mt-1 space-y-0.5">{children}</ul>,
  ol:    ({ children }) => <ol className="list-decimal list-inside mt-1 space-y-0.5">{children}</ol>,
  li:    ({ children }) => <li className="ml-2">{children}</li>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="w-full text-xs border-collapse border border-[var(--border-color)]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[var(--sidebar-color)]">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr:    ({ children }) => <tr className="border-b border-[var(--border-color)]">{children}</tr>,
  th:    ({ children }) => <th className="px-2 py-1 text-left font-semibold text-[var(--theme-color)] border-r border-[var(--border-color)] last:border-r-0">{children}</th>,
  td:    ({ children }) => <td className="px-2 py-1 border-r border-[var(--border-color)] last:border-r-0">{children}</td>,
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

function ChoiceButtons({ text, onChoose }: { text: string; onChoose: (choice: string) => void }) {
  const choices = parseChoices(text)
  if (choices.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {choices.map((choice, i) => (
        <button
          key={i}
          onClick={() => onChoose(choice)}
          className="text-sm px-3 py-1.5 rounded-lg border border-[var(--theme-color)] text-[var(--theme-color)] hover:bg-[var(--theme-color)] hover:text-white transition-colors cursor-pointer"
        >
          {choice}
        </button>
      ))}
    </div>
  )
}

function ToolCallBubble({ event }: { event: ToolCallEvent }) {
  const icon =
    event.name === "roll_dice"              ? "🎲" :
    event.name === "calculate_derived_stats"? "⚙️" :
    event.name === "validate_character_sheet"? "✅" : "🔧"

  let summary = ""
  if (event.name === "roll_dice") {
    const r = event.result as { rolls?: number[]; total?: number; formula?: string; error?: string }
    summary = r.error
      ? r.error
      : `${r.formula} → [${r.rolls?.join(", ")}] = **${r.total}**`
  } else if (event.name === "calculate_derived_stats") {
    const r = event.result as Record<string, unknown>
    summary = Object.entries(r).map(([k, v]) => `${k}: ${v}`).join("  ·  ")
  } else if (event.name === "validate_character_sheet") {
    const r = event.result as { valid?: boolean; errors?: Array<{ message: string }> }
    summary = r.valid ? "Sheet is valid ✓" : (r.errors?.map(e => e.message).join("; ") || "Errors found")
  } else {
    summary = JSON.stringify(event.result)
  }

  return (
    <div className="flex justify-start">
      <div className="text-xs font-mono bg-[var(--sidebar-color)] border border-[var(--border-color)] px-3 py-1.5 rounded-lg max-w-[85%]">
        <span className="mr-1">{icon}</span>
        <span className="text-[var(--theme-color)] font-semibold">{event.name}</span>
        <span className="text-[var(--secondary-text-color)] ml-2">{summary}</span>
      </div>
    </div>
  )
}

function StepDivider({ step }: { step: string }) {
  const info = STEP_INFO[step]
  if (!info) return null
  return (
    <div className="flex flex-col items-center gap-1 my-4 select-none">
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-px bg-[var(--theme-color)] opacity-30" />
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--theme-color)] whitespace-nowrap px-1">
          Step {info.number} / 7 — {info.label}
        </span>
        <div className="flex-1 h-px bg-[var(--theme-color)] opacity-30" />
      </div>
      <p className="text-[10px] text-[var(--secondary-text-color)] tracking-wide">{info.hint}</p>
    </div>
  )
}

function AssistantBubble({ text }: { text: string }) {
  const displayText = stripChoices(stripAdvance(stripDsml(text)))
  if (isDescription(text)) {
    return (
      <div className="flex justify-start">
        <div className="italic text-[var(--secondary-text-color)] bg-[var(--sidebar-color)] border-l-2 border-[var(--theme-color)] px-5 py-3 max-w-[85%] rounded-r-xl text-sm leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{stripAsterisks(displayText)}</ReactMarkdown>
          <CitationBadges text={text} />
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-start">
      <div className="bg-[var(--primary-color)] max-w-[80%] border border-white px-5 p-2 rounded-xl leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{displayText}</ReactMarkdown>
        <CitationBadges text={text} />
      </div>
    </div>
  )
}

// Raw text while streaming — no markdown parsing overhead
function StreamingBubble({ text }: { text: string }) {
  const display = stripDsml(text)
  return (
    <div className="flex justify-start">
      <div className="bg-[var(--primary-color)] max-w-[80%] border border-white px-5 p-2 rounded-xl leading-relaxed whitespace-pre-wrap min-h-[2rem]">
        {display || <span className="opacity-40">···</span>}
      </div>
    </div>
  )
}

export default function Conversation({ sessionId, onMessageSent, onStepChange }: Props) {
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
        onStepChange?.(data.currentStep || "CONCEPT", data.characterSheet || {})
      })
      .catch(() => {
        setMessages([{ role: "assistant", text: "Welcome new player, let's create a new character!" }])
        onStepChange?.("CONCEPT", {})
      })
      .finally(() => setLoading(false))
  }, [sessionId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const sendText = async (userMessage: string) => {
    if (!userMessage || loading) return

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

    // Called when stream ends — finds and finalizes the last streaming bubble
    const finalize = () => {
      setMessages((prev) => {
        const idx = prev.findLastIndex(
          (m): m is { role: "assistant"; text: string; streaming: boolean } =>
            m.role === "assistant" && "streaming" in m && (m as { streaming?: boolean }).streaming === true
        )
        if (idx < 0) return prev

        const streamingMsg = prev[idx] as { role: "assistant"; text: string; streaming: boolean }
        const chunks = splitIntoChunks(stripAdvance(stripDsml(streamingMsg.text)))

        const updated = [...prev]
        if (chunks.length === 0) {
          updated.splice(idx, 1) // remove empty bubble
        } else {
          updated.splice(idx, 1, ...chunks.map((text) => ({ role: "assistant" as const, text, streaming: false })))
        }
        return updated
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
        body: JSON.stringify({
          message: userMessage,
          history: messages.filter((m): m is { role: "user" | "assistant"; text: string } =>
            (m.role === "user" || m.role === "assistant") && !("streaming" in m && (m as { streaming?: boolean }).streaming)
          ),
          sessionId,
        }),
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
            if (event.type === "tool_call") {
              setMessages((prev) => [
                ...prev.filter((m) => !(m.role === "assistant" && "streaming" in m && m.streaming && m.text === "")),
                { role: "tool_call" as const, toolCall: { name: event.name, args: event.args, result: event.result } },
                { role: "assistant" as const, text: "", streaming: true },
              ])
            }
            if (event.type === "sheet_update") onStepChange?.(event.step, event.sheet)
            if (event.type === "step_advance") {
              onStepChange?.(event.step, event.sheet)
              setMessages((prev) => [...prev, { role: "step_divider" as const, step: event.step }])
            }
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

  const sendMessage = () => sendText(input)

  const isStreamingNow = messages.some((m) => m.streaming)

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-[var(--primary-color)] rounded"
      >
        {(() => {
          const lastAssistantIdx = messages.reduce(
            (last, m, i) => m.role === "assistant" && !("streaming" in m && (m as {streaming?:boolean}).streaming) ? i : last, -1
          )
          return messages.map((msg, i) => {
            if (msg.role === "step_divider") {
              return <StepDivider key={i} step={msg.step} />
            }
            if (msg.role === "tool_call") {
              return <ToolCallBubble key={i} event={msg.toolCall} />
            }
            if (msg.role === "user") {
              return (
                <div key={i} className="flex justify-end">
                  <div
                    className="bg-[var(--dialog-color)] text-white ml-auto px-5 max-w-[70%] w-fit min-w-[2.5rem] p-2 rounded-xl"
                    style={{ wordBreak: "break-word" }}
                  >
                    {msg.text}
                  </div>
                </div>
              )
            }
            if ("streaming" in msg && msg.streaming) {
              return <StreamingBubble key={i} text={msg.text} />
            }
            return (
              <div key={i}>
                <AssistantBubble text={msg.text} />
                {i === lastAssistantIdx && !loading && (
                  <ChoiceButtons text={msg.text} onChoose={sendText} />
                )}
              </div>
            )
          })
        })()}
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
