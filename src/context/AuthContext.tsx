import { createContext, useContext, useState, type ReactNode } from "react"

const API = "http://localhost:5000"

type User = { id: string; email: string; name: string }

type AuthContextType = {
  token: string | null
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("rw_token"))
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("rw_user")
    return raw ? JSON.parse(raw) : null
  })

  function persist(t: string, u: User) {
    localStorage.setItem("rw_token", t)
    localStorage.setItem("rw_user", JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  async function login(email: string, password: string) {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Login failed")
    persist(data.token, data.user)
  }

  async function signup(email: string, password: string, name: string) {
    const res = await fetch(`${API}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Signup failed")
    persist(data.token, data.user)
  }

  function logout() {
    localStorage.removeItem("rw_token")
    localStorage.removeItem("rw_user")
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
