import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

export default function ScanInfoPage() {
  const { barcode } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`http://192.168.1.19:8000/api/combo/public/scan-info/${barcode}/`)
      .then(res => setData(res.data))
      .catch(() => setError('Barcode not found or invalid.'))
      .finally(() => setLoading(false))
  }, [barcode])

  if (loading) {
    return <div style={{ padding: 24, fontFamily: 'sans-serif' }}>Loading…</div>
  }

  if (error) {
    return <div style={{ padding: 24, fontFamily: 'sans-serif', color: 'red' }}>{error}</div>
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 4 }}>{data.combo_name}</h2>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
        Barcode: <code>{data.barcode}</code>
      </div>

      <div style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        marginBottom: 20,
        background: data.status === 'active' ? '#d1fae5' : data.status === 'used' ? '#fee2e2' : '#e5e7eb',
        color: data.status === 'active' ? '#065f46' : data.status === 'used' ? '#991b1b' : '#374151',
      }}>
        {data.status === 'active' ? 'Available' : data.status === 'used' ? 'Used' : 'Deleted'}
      </div>

      {data.booked_by_client_name && (
        <div style={{ marginBottom: 20, padding: 12, background: '#f3f4f6', borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: '#666' }}>Booked by</div>
          <div style={{ fontWeight: 600 }}>{data.booked_by_client_name}</div>
          <div style={{ fontSize: 13 }}>{data.booked_by_client_phone}</div>
        </div>
      )}

      <h3 style={{ fontSize: 15, marginBottom: 10 }}>Items in this combo</h3>
      {data.items.map((it, i) => (
        <div key={i} style={{
          padding: 12,
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          marginBottom: 8,
        }}>
          <div style={{ fontWeight: 600 }}>{it.item_name}</div>
          {it.description && <div style={{ fontSize: 13, color: '#666' }}>{it.description}</div>}
          <div style={{ display: 'flex', gap: 16, fontSize: 13, marginTop: 6 }}>
            <span>HSN: {it.hsn_sac || '—'}</span>
            <span>Qty: {it.quantity}</span>
            <span>Rate: ₹{it.rate}</span>
            <span>Stock: {it.stock}</span>
          </div>
        </div>
      ))}
    </div>
  )
}