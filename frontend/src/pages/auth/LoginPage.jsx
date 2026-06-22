import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  // CHANGE email → username
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // CHANGE email → username
      await login(form.username, form.password)

      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            fontSize: 24,
            fontWeight: 800,
            color: '#fff',
          }}>
            C
          </div>

          <h1 style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)'
          }}>
            Combo Manager
          </h1>

          <p style={{
            color: 'var(--text-muted)',
            fontSize: 13,
            marginTop: 4
          }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <div className="form-grid">

            {/* USERNAME FIELD */}
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="input"
                type="text"
                placeholder="Enter username"
                value={form.username}
                onChange={e =>
                  setForm(p => ({ ...p, username: e.target.value }))
                }
                required
              />
            </div>

            {/* PASSWORD FIELD */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e =>
                  setForm(p => ({ ...p, password: e.target.value }))
                }
                required
              />
            </div>

            <button
              className="btn btn-primary btn-lg w-full"
              type="submit"
              disabled={loading}
              style={{ marginTop: 8, justifyContent: 'center' }}
            >
              {loading ? <span className="spinner" /> : <><LogIn size={16} /> Sign In</>}
            </button>

          </div>
        </form>
      </div>
    </div>
  )
}