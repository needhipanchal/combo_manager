import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { bookingsAPI } from '../../api'

export default function BookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    bookingsAPI.get(id)
      .then(r => {
        setBooking(r.data?.data || r.data)
      })
      .catch((err) => {
        console.error(err)
        toast.error('Booking not found')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Delete this booking and restore combo stock?')) return
    setDeleting(true)
    try {
      await bookingsAPI.delete(id)
      toast.success('Booking deleted')
      navigate('/bookings')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete')
    } finally {
      setDeleting(false)
    }
  }

  const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-IN') : '—'

  if (loading) {
    return (
      <div className="page">
        <div className="loading-center"><span className="spinner" /> Loading…</div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">Booking not found</div>
          <div className="empty-state-sub">
            <Link to="/bookings">← Go back to bookings</Link>
          </div>
        </div>
      </div>
    )
  }

  const pairs = booking.booking_items || []

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Booking #{booking.id}</div>
          <div className="page-subtitle">{fmt(booking.created_at)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/bookings" className="btn btn-secondary">← Back</Link>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <span className="spinner" /> : 'Delete Booking'}
          </button>
        </div>
      </div>

      {/* Client Info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 15 }}>Client Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div>
            <div className="form-label" style={{ marginBottom: 4 }}>Client Name</div>
            <div>{booking.client_name || '—'}</div>
          </div>
          <div>
            <div className="form-label" style={{ marginBottom: 4 }}>Phone</div>
            <div>{booking.client_phone || '—'}</div>
          </div>
          <div>
            <div className="form-label" style={{ marginBottom: 4 }}>Email</div>
            <div>{booking.client_email || '—'}</div>
          </div>
          <div>
            <div className="form-label" style={{ marginBottom: 4 }}>Address</div>
            <div>{booking.client_address || '—'}</div>
          </div>
          <div>
            <div className="form-label" style={{ marginBottom: 4 }}>Status</div>
            <span className={`badge badge-${booking.client_status === 'active' ? 'success' : 'danger'}`}>
              {booking.client_status || '—'}
            </span>
          </div>
          <div>
            <div className="form-label" style={{ marginBottom: 4 }}>Date</div>
            <div>{fmt(booking.created_at)}</div>
          </div>
          <div>
            <div className="form-label" style={{ marginBottom: 4 }}>Total Qty</div>
            <span className="badge badge-info">{booking.item_count ?? pairs.length}</span>
          </div>
          <div>
            <div className="form-label" style={{ marginBottom: 4 }}>Pairs</div>
            <span className="badge badge-info">{pairs.length}</span>
          </div>
        </div>
      </div>

      {/* Booking Items / Pairs */}
      {pairs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">No items in this booking</div>
          </div>
        </div>
      ) : (
        pairs.map((bi, idx) => (
          <div className="card" key={bi.id} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Pair #{idx + 1}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 14 }}>
              <div>
                <div className="form-label" style={{ marginBottom: 4 }}>Combo Barcode</div>
                <span className="font-mono text-sm" style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  padding: '2px 10px', borderRadius: 6, color: 'var(--accent)',
                }}>
                  {bi.barcode || '—'}
                </span>
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: 4 }}>Combo Name</div>
                <div>{bi.combo_name || '—'}</div>
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: 4 }}>Barcode Status</div>
                <span className={`badge badge-${
                  bi.combo_status === 'active' ? 'success' :
                  bi.combo_status === 'used' ? 'warning' : 'danger'
                }`}>
                  {bi.combo_status === 'active' ? 'Available' : bi.combo_status === 'used' ? 'Used' : 'Deleted'}
                </span>
              </div>
            </div>

            <div className="form-label" style={{ marginBottom: 8 }}>Items in this combo</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Description</th>
                    <th>HSN/SAC</th>
                    <th>Qty/Unit</th>
                    <th>Rate (₹)</th>
                    <th>Line Value (₹)</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {(bi.combo_items || []).length === 0 ? (
                    <tr><td colSpan={7} className="td-muted">No items found.</td></tr>
                  ) : (bi.combo_items || []).map((it) => (
                    <tr key={it.id}>
                      <td style={{ fontWeight: 600 }}>{it.item_name}</td>
                      <td className="td-muted">{it.description || '—'}</td>
                      <td className="font-mono text-sm">{it.hsn_sac || '—'}</td>
                      <td>{it.quantity}</td>
                      <td>₹{parseFloat(it.rate ?? 0).toFixed(2)}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 600 }}>
                        ₹{(parseFloat(it.rate ?? 0) * it.quantity).toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge badge-${(it.item_stock ?? 0) <= 10 ? 'danger' : 'success'}`}>
                          {it.item_stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}