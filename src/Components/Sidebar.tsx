import { useState, useEffect } from "react"
import { Button } from "@/Components/ui/button"
import { Menu, X, Plus, Trash2, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"

type SessionItem = {
  sessionId: string
  title: string
  updatedAt: string
}

type Props = {
  currentSessionId: string
  refreshKey: number
  onSelectSession: (id: string) => void
  onNewSession: () => void
}

const API = "http://localhost:5000"

const Sidebar = ({ currentSessionId, refreshKey, onSelectSession, onNewSession }: Props) => {
  const [open, setOpen] = useState(true)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) return
    fetch(`${API}/api/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions || []))
      .catch(() => {})
  }, [token, refreshKey])

  async function deleteSession(sessionId: string, e: React.MouseEvent) {
    e.stopPropagation()
    await fetch(`${API}/api/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId))
    if (sessionId === currentSessionId) onNewSession()
  }

  function handleLogout() {
    logout()
    navigate("/auth")
  }

  return (
    <div
      className={cn(
        "bg-[var(--sidebar-color)] transition-all duration-300 ease-in-out h-full flex flex-col",
        open ? "w-64" : "w-16"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-[var(--border-color)]">
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </Button>
        {open && (
          <Button variant="ghost" size="icon" onClick={onNewSession} title="New chat">
            <Plus />
          </Button>
        )}
      </div>

      {/* Session List */}
      <nav className="flex-1 overflow-y-auto mt-2 flex flex-col gap-1 px-2">
        {open && sessions.map((s) => (
          <div
            key={s.sessionId}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer group hover:bg-[var(--border-color)] transition-colors",
              s.sessionId === currentSessionId && "bg-[var(--border-color)]"
            )}
            onClick={() => onSelectSession(s.sessionId)}
          >
            <span className="text-sm truncate text-[var(--primary-text-color)] flex-1">
              {s.title}
            </span>
            <button
              onClick={(e) => deleteSession(s.sessionId, e)}
              className="opacity-0 group-hover:opacity-100 text-[var(--secondary-text-color)] hover:text-red-400 transition-opacity ml-2 shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {open && sessions.length === 0 && (
          <p className="text-xs text-[var(--secondary-text-color)] px-3 mt-2">No saved sessions yet</p>
        )}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-[var(--border-color)] p-2">
        {open ? (
          <div className="flex items-center justify-between px-2 py-1">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--primary-text-color)] truncate">{user?.name}</p>
              <p className="text-xs text-[var(--secondary-text-color)] truncate">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="ml-2 shrink-0">
              <LogOut size={16} />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="icon" onClick={handleLogout} className="w-full" title="Logout">
            <LogOut size={16} />
          </Button>
        )}
      </div>
    </div>
  )
}

export default Sidebar
