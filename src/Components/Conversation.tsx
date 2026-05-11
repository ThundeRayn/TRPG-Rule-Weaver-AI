
import { useState, useRef, useEffect } from "react"
import { Input } from "@/Components/ui/input"
import { Button } from "@/Components/ui/button"

type Message = { role: "user" | "assistant"; text: string }

export default function Conversation() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Welcome new player, let's create a new character!" }
  ])
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
  if (!input) return;

  const userMessage = input;
  setMessages(prev => [...prev, { role: "user", text: userMessage }]);
  setInput("");

  try {
    const response = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage, history: messages }),
    });

    const data = await response.json();

    // Add AI-generated reply
    setMessages(prev => [
      ...prev,
      { role: "assistant", text: data.reply || "No response from AI." },
    ]);
  } catch (error) {
    console.error("Error calling AI:", error);
    setMessages(prev => [
      ...prev,
      { role: "assistant", text: "Error: Failed to get AI response." },
    ]);
  }
};

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
              className={
                msg.role === "user"
                  ? "flex justify-end"
                  : "flex justify-start"
              }
            >
              <div
                className={`p-2 rounded-xl ${
                  msg.role === "user"
                    ? "bg-[var(--dialog-color)] text-white ml-auto px-5 max-w-[70%] w-fit min-w-[2.5rem]"
                    : "bg-[var(--primary-color)] max-w-[80%] border px-5 border-white"
                }`}
                style={msg.role === "user" ? { wordBreak: 'break-word' } : {}}
              >
                {msg.text}
              </div>
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
