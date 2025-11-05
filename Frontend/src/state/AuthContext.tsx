import React, { createContext, useContext, useEffect, useState } from 'react'
import { http } from '../lib/http'

export type User = { id: string; name: string; email: string } | null

type Ctx = {
  user: User
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<Ctx | undefined>(undefined)

// ensure base http is configured

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    http
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
  const res = await http.post('/auth/login', { email, password })
    setUser(res.data)
  }

  async function signup(name: string, email: string, password: string) {
  const res = await http.post('/auth/signup', { name, email, password })
    setUser(res.data)
  }

  async function logout() {
  await http.post('/auth/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
