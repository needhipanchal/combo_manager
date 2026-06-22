import { useEffect, useState } from 'react'
import { dashboardAPI } from '../../api'
import { LoadingCenter } from '../../components/ui'
import { Package, Layers, CalendarCheck, AlertTriangle, IndianRupee, Tag } from 'lucide-react'

const fmt = (n) => Number(n || 0).toLocaleString('en-IN')
const fmtCurr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

export default function Dashboard() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardAPI.get()
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingCenter />

  const stats = [
    { label: 'Total Items',        value: fmt(data.total_items),        icon: Package,      color: 'var(--accent)'   },
    { label: 'Total Combos',       value: fmt(data.total_combos),       icon: Layers,       color: 'var(--success)'  },
    { label: 'Total Bookings',     value: fmt(data.total_bookings),     icon: CalendarCheck, color: 'var(--info)'    },
    { label: 'Low Stock Items',    value: fmt(data.low_stock),          icon: AlertTriangle, color: 'var(--warning)' },
    { label: 'Stock Value',        value: fmtCurr(data.stock_value),    icon: IndianRupee,  color: 'var(--success)'  },
    { label: 'Available Barcodes', value: fmt(data.available_barcodes), icon: Tag,          color: 'var(--accent)'   },
  ]

  const maxActivity = Math.max(...(data.booking_activity || []).map(a => a.count), 1)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Overview of your combo manager</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon" style={{ background: color + '22', color }}>
              <Icon size={18} />
            </div>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ fontSize: 22 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Booking Activity */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Booking Activity — Last 7 Days</div>
          {data.booking_activity?.length ? (
            <>
              <div className="bar-chart">
                {data.booking_activity.map((a) => (
                  <div key={a.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div title={`${a.count} bookings`} style={{
                      width: '100%',
                      height: `${Math.max(8, (a.count / maxActivity) * 80)}px`,
                      background: 'var(--accent)',
                      borderRadius: '4px 4px 0 0',
                      opacity: 0.85,
                      transition: 'height .3s',
                    }} />
                    <div className="bar-label">{String(a.day).slice(5)}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-muted text-sm">No activity in last 7 days</div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Recent Bookings</div>
          {data.recent_bookings?.length ? (
            <div>
              {data.recent_bookings.map(b => (
                <div key={b.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{b.client_name}</div>
                    <div className="text-muted text-sm">Qty: {b.quantity}</div>
                  </div>
                  <div className="text-muted text-sm">{String(b.created_at).slice(0, 10)}</div>
                </div>
              ))}
            </div>
          ) : <div className="text-muted text-sm">No recent bookings</div>}
        </div>

        {/* Low Stock Items */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16, color: 'var(--warning)' }}>
            ⚠ Low Stock Items
          </div>
          {data.low_stock_items?.length ? (
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '4px 0', color: 'var(--text-muted)', fontWeight: 600 }}>Name</th>
                  <th style={{ textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Qty</th>
                  <th style={{ textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.low_stock_items.map(i => (
                  <tr key={i.id}>
                    <td style={{ padding: '7px 0' }}>{i.name}</td>
                    <td style={{ textAlign: 'right', color: 'var(--warning)', fontWeight: 700 }}>{i.quantity}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{fmtCurr(i.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="text-muted text-sm" style={{ color: 'var(--success)' }}>✓ All items well stocked</div>}
        </div>

        {/* Combo Stock */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Combo Stock</div>
          {data.combo_stock?.length ? (
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '4px 0', color: 'var(--text-muted)', fontWeight: 600 }}>Combo</th>
                  <th style={{ textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Qty</th>
                  <th style={{ textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Barcodes</th>
                </tr>
              </thead>
              <tbody>
                {data.combo_stock.map(c => (
                  <tr key={c.id}>
                    <td style={{ padding: '7px 0' }}>{c.name}</td>
                    <td style={{ textAlign: 'right' }}>{c.quantity}</td>
                    <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{c.barcode_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="text-muted text-sm">No combos</div>}
        </div>

        {/* Top Items */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Top Items by Combo Usage</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {data.top_items?.map((item, i) => (
              <div key={item.id} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '12px 16px', flex: '1', minWidth: 140,
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>#{i + 1}</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                <div style={{ color: 'var(--accent)', fontWeight: 700, marginTop: 4 }}>{item.combo_usage} used</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}