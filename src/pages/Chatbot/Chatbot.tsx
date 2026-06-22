import { useState, useCallback } from "react"
import Conversation from "@/Components/Conversation"
import Sidebar from "../../Components/Sidebar"
import CharacterSheet from "@/Components/CharacterSheet"

type Sheet = Record<string, unknown>

const Chatbot = () => {
  const [sessionId,     setSessionId]     = useState<string>(() => crypto.randomUUID())
  const [refreshKey,    setRefreshKey]    = useState(0)
  const [currentStep,   setCurrentStep]   = useState("CONCEPT")
  const [characterSheet,setCharacterSheet]= useState<Sheet>({})

  const handleNewSession = useCallback(() => {
    setSessionId(crypto.randomUUID())
    setCurrentStep("CONCEPT")
    setCharacterSheet({})
  }, [])

  const handleMessageSent = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const handleStepChange = useCallback((step: string, sheet: Sheet) => {
    setCurrentStep(step)
    setCharacterSheet(sheet)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--primary-color)] text-[var(--primary-text-color)]">
      <Sidebar
        currentSessionId={sessionId}
        refreshKey={refreshKey}
        onSelectSession={setSessionId}
        onNewSession={handleNewSession}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="shrink-0 px-6 pt-6 pb-3 border-b border-[var(--border-color)]">
          <h1 className="text-2xl font-bold text-center">Rule-Weaver AI Assistant</h1>
        </header>

        <div className="flex-1 overflow-hidden flex">
          {/* Conversation */}
          <div className="flex-1 overflow-hidden p-5">
            <Conversation
              sessionId={sessionId}
              onMessageSent={handleMessageSent}
              onStepChange={handleStepChange}
            />
          </div>

          {/* Character sheet panel */}
          <div className="w-64 shrink-0 overflow-hidden">
            <CharacterSheet currentStep={currentStep} sheet={characterSheet} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default Chatbot
