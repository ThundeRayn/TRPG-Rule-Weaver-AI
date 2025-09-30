
import { useState, useRef, useEffect } from "react"
import { Input } from "@/Components/ui/input"
import { Button } from "@/Components/ui/button"

type Message = { role: "user" | "assistant"; text: string }

export default function Conversation() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const sendMessage = () => {
    if (!input) return

    // Add user message
    setMessages(prev => [...prev, { role: "user", text: input }])
    setInput("")

    // Fake assistant reply for now
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", text: "This is a reply." }])
    }, 500)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Conversation messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-[var(--primary-color)] rounded"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] p-2 rounded-xl ${
              msg.role === "user" ? "bg-[var(--dialog-color)] text-white self-end" : "bg-gray-200 self-start"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div className="flex gap-2 p-2 pt-5 pb-0 border-t">
        <Input
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </div>
  )
}
