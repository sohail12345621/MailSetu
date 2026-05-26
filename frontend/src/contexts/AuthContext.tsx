import React, { createContext, useContext, useState, useEffect } from 'react'
import { getMe, login as apiLogin, logout as apiLogout } from '../lib/api'

interface Account { id: number; email: string; smtp_host: string; smtp_port: number; is_active: boolean }
interface AuthCtx {
  account: Account | null
  loading: boolean
  login: (email: string, password: string, host?: string, port?: number) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then(r => setAccount(r.data))
      .catch(() => setAccount(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string, host = 'smtp.gmail.com', port = 587) => {
    const r = await apiLogin(email, password, host, port)
    setAccount(r.data)
  }

  const logout = async () => {
    await apiLogout()
    setAccount(null)
  }

  return <AuthContext.Provider value={{ account, loading, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
