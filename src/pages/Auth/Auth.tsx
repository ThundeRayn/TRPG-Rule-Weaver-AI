import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Input } from "@/Components/ui/input"
import { Button } from "@/Components/ui/button"
import styles from "./Auth.module.css"

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { token, login, signup } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (token) navigate("/chat", { replace: true })
  }, [token, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (mode === "signup" && !name.trim()) {
      setError("Name is required")
      return
    }

    setLoading(true)
    try {
      if (mode === "login") {
        await login(email, password)
      } else {
        await signup(email, password, name.trim())
      }
      navigate("/chat")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function switchMode() {
    setMode(mode === "login" ? "signup" : "login")
    setError("")
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Rule-Weaver AI</h1>
        <p className={styles.subtitle}>
          {mode === "login" ? "Sign in to continue your adventure" : "Create your account"}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === "signup" && (
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <p className={styles.toggle}>
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button type="button" onClick={switchMode} className={styles.toggleBtn}>
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  )
}
