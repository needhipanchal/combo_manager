import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { bookingsAPI } from '../../api'
import { Search, Eye, Trash2 } from 'lucide-react'
import { EmptyState, LoadingCenter, Pagination, Badge } from '../../components/ui'

export default function BookingList() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deletingId, setDeletingId] = useState(null)

  const fetchBookings = useCallback(async () => {
  setLoading(true)

  try {
    const r = await bookingsAPI.list({
      page,
      per_page: 20,
      search,
    })

    const body = r.data

    console.log('BOOKING RESPONSE:', body)

    // Django REST Framework Pagination
    if (body?.results) {
      setBookings(body.results)
      setTotal(body.count || 0)
      setTotalPages(Math.ceil((body.count || 0) / 20))
    }

    // Custom API format
    else if (body?.data) {
      setBookings(body.data)
      setTotal(body.total || body.data.length)
      setTotalPages(body.total_pages || body.last_page || 1)
    }

    // Plain Array
    else if (Array.isArray(body)) {
      setBookings(body)
      setTotal(body.length)
      setTotalPages(1)
    }

    // Fallback
    else {
      setBookings([])
      setTotal(0)
      setTotalPages(1)
    }

  } catch (err) {
    console.error(err)
    toast.error('Failed to load bookings')
  } finally {
    setLoading(false)
  }
}, [page, search])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleDelete = async (b) => {
    const ok = confirm('Delete Booking #' + b.id + '? This will restore combo stock.')
    if (!ok) return

    setDeletingId(b.id)
    try {
      await bookingsAPI.delete(b.id)
      toast.success('Booking deleted and stock restored')
      fetchBookings()
    } catch (err) {
      const msg = err.response && err.response.data && err.response.data.message
      toast.error(msg || 'Cannot delete')
    } finally {
      setDeletingId(null)
    }
  }

  const fmt = (dt) => {
    if (!dt) return 'N/A'
    return new Date(dt).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Bookings</div>
          <div className="page-subtitle">Use the Scan page to create new bookings</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="input-group" style={{ width: 320 }}>
          <Search size={14} className="input-icon" />
          <input
            className="input"
            placeholder="Search by client name, phone, email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Client</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Items</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7}>
                    <LoadingCenter />
                  </td>
                </tr>
              )}

              {!loading && bookings.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={'\u{1F4CB}'}
                      title="No bookings found"
                      sub="Go to the Scan page to create one"
                    />
                  </td>
                </tr>
              )}

              {!loading && bookings.length > 0 && bookings.map((b) => {
                const clientName = b.client_name || (b.client && b.client.name) || 'N/A'
                const clientPhone = b.client_phone || b.client_number || (b.client && b.client.phone) || 'N/A'
                const clientEmail = b.client_email || (b.client && b.client.email) || 'N/A'
                const itemCount = b.quantity != null ? b.quantity
                  : (b.booking_items_count != null ? b.booking_items_count
                  : (b.item_count != null ? b.item_count : 'N/A'))

                return (
                  <tr key={b.id}>
                    <td className="td-id">#{b.id}</td>
                    <td style={{ fontWeight: 600 }}>{clientName}</td>
                    <td className="font-mono text-sm">{clientPhone}</td>
                    <td className="td-muted">{clientEmail}</td>
                    <td>
                      <Badge type="info">{itemCount}</Badge>
                    </td>
                    <td className="td-muted" style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                      {fmt(b.created_at)}
                    </td>
                    <td>
                      <div className="actions-cell">
                        <Link to={'/bookings/' + b.id} className="btn btn-secondary btn-sm">
                          <Eye size={12} /> View
                        </Link>
                        <button
                          className="btn-icon danger"
                          onClick={() => handleDelete(b)}
                          disabled={deletingId === b.id}
                          title="Delete booking"
                        >
                          {deletingId === b.id ? <span className="spinner" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: '0 16px 16px' }}>
            <Pagination
              page={page}
              lastPage={totalPages}
              total={total}
              perPage={20}
              onChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}