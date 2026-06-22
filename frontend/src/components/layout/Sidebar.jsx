import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Layers, Users,
  CalendarCheck, ScanLine, BarChart3, FileText, LogOut
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/items',    icon: Package,         label: 'Items'       },
  { to: '/combos',   icon: Layers,          label: 'Combos'      },
  { to: '/clients',  icon: Users,           label: 'Clients'     },
  { to: '/bookings', icon: CalendarCheck,   label: 'Bookings'    },
  { to: '/scan',     icon: ScanLine,        label: 'Scan'        },
  { to: '/reports',  icon: BarChart3,       label: 'Reports'     },
  { to: '/logs',     icon: FileText,        label: 'Logs'        },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{
        padding: '22px 20px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 16, color: '#fff', flexShrink: 0,
          }}>C</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              Combo Manager
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>v2.0</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-light)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: 13,
              transition: 'all .15s',
              textDecoration: 'none',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{
        padding: '14px 14px 18px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, padding: '0 4px' }}>
          {user?.email}
        </div>
        <button className="btn btn-ghost w-full" onClick={handleLogout} style={{ justifyContent: 'center' }}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </aside>
  )
}