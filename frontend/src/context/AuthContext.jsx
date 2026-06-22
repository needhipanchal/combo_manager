import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({
          username: payload.username || payload.user_id,
          id: payload.user_id
        })
      } catch {
        localStorage.clear()
        setUser(null)
      }
    } else {
      setUser(null)
    }

    setLoading(false)
  }, [])

  // ✅ FIXED: username instead of email
  const login = async (username, password) => {
    const { data } = await authAPI.login({ username, password })

    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)

    const payload = JSON.parse(atob(data.access.split('.')[1]))

    setUser({
      username: payload.username || username,
      id: payload.user_id
    })
  }

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) await authAPI.logout(refresh)
    } catch {}

    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)