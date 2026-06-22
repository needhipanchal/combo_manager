import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { reportsAPI } from '../../api'

export default function ReportsPage() {
  const [type, setType] = useState('booking')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const r = await reportsAPI.get({
  type,
  search,
  from: dateFrom,
  to: dateTo,
  page,
  per_page: 20
})

console.log("REPORT RESPONSE:", r.data)

const d = r.data

setRows(d.data || [])
setTotal(d.total || 0)
setTotalPages(d.last_page || 1)
    } catch {
      toast.error('Failed to load report')
    }
    setLoading(false)
  }, [type, search, dateFrom, dateTo, page])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const fmt = (dt) =>
    dt
      ? new Date(dt).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : '—'

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
      </div>

      <div className="card">

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <select
            value={type}
            onChange={e => {
              setType(e.target.value)
              setPage(1)
            }}
            style={{ width: 180 }}
          >
            <option value="booking">Booking Report</option>
            <option value="items">Items Report</option>
            <option value="combo">Combo Report</option>
          </select>

          <input
            placeholder="Search..."
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setPage(1)
            }}
            style={{ width: 220 }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
            <label>From:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => {
                setDateFrom(e.target.value)
                setPage(1)
              }}
              style={{ width: 150 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
            <label>To:</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => {
                setDateTo(e.target.value)
                setPage(1)
              }}
              style={{ width: 150 }}
            />
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearch('')
              setDateFrom('')
              setDateTo('')
              setPage(1)
            }}
          >
            Clear
          </button>
        </div>

        <div style={{ marginBottom: 10, fontSize: '0.82rem', color: '#888' }}>
          {total} record(s) found
        </div>

        {/* Loading */}
        {loading ? (
          <div className="loading">Loading report...</div>
        ) : (
          <div className="table-wrapper">

            {/* BOOKING REPORT */}
            {type === 'booking' && (
              <table>
                <thead>
                  <tr>
                    <th>Booking #</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Phone</th>
                    <th>Combo</th>
                    <th>Combo Barcode</th>
                    <th>Items Barcode</th>
                    <th>Total Qty</th>
                    <th>Total Value (₹)</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={9} className="empty">No data.</td></tr>
                  )}

                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td>{row.booking_id}</td>
                      <td>{fmt(row.created_at)}</td>
                      <td>{row.client_name}</td>
                      <td>{row.client_phone}</td>
                      <td>{row.combo_name || '—'}</td>
                      <td><code>{row.combo_barcode || '—'}</code></td>
                      <td><code>{row.items_barcode || '—'}</code></td>
                      <td>{row.total_qty || '—'}</td>
                      <td>
                        {row.total_value != null
                          ? `₹${parseFloat(row.total_value).toFixed(2)}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ITEMS REPORT */}
            {type === 'items' && (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>HSN/SAC</th>
                    <th>Quantity</th>
                    <th>Amount (₹)</th>
                    <th>Created</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={7} className="empty">No data.</td></tr>
                  )}

                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td>{row.id}</td>
                      <td><strong>{row.name}</strong></td>
                      <td>{row.description || '—'}</td>
                      <td>{row.hsn_sac || '—'}</td>
                      <td>
                        <span className={`badge ${row.quantity <= 10 ? 'badge-danger' : 'badge-success'}`}>
                          {row.quantity}
                        </span>
                      </td>
                      <td>₹{parseFloat(row.amount || 0).toFixed(2)}</td>
                      <td>{fmt(row.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* COMBO REPORT */}
            {type === 'combo' && (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Qty</th>
                    <th>Total Barcodes</th>
                    <th>Used</th>
                    <th>Available</th>
                    <th>Total Items</th>
                    <th>Value (₹)</th>
                    <th>Created</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={9} className="empty">No data.</td></tr>
                  )}

                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td>{row.id}</td>
                      <td><strong>{row.name}</strong></td>
                      <td><span className="badge badge-info">{row.quantity}</span></td>
                      <td>{row.total_barcodes}</td>
                      <td><span className="badge badge-warning">{row.used_barcodes}</span></td>
                      <td><span className="badge badge-success">{row.available_barcodes}</span></td>
                      <td>{row.total_items}</td>
                      <td>₹{parseFloat(row.total_value || 0).toFixed(2)}</td>
                      <td>{fmt(row.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              ‹ Prev
            </button>

            <span>
              Page {page} of {totalPages} ({total} total)
            </span>

            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Next ›
            </button>
          </div>
        )}

      </div>
    </div>
  )
}