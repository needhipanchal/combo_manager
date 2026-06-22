import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { scanAPI, clientsAPI } from '../../api'
import { Search, ScanLine, Package, X, Send, RotateCcw, User, Check } from 'lucide-react'

export default function ScanPage() {
  const [clients, setClients]               = useState([])
  const [clientId, setClientId]             = useState('')
  const [clientSearch, setClientSearch]     = useState('')
  const [scanInput, setScanInput]           = useState('')
  const [scannedCombos, setScannedCombos]   = useState([])   // [{barcode, comboName, comboId}]
  const [scannedItems, setScannedItems]     = useState([])   // [barcode strings]
  const [activeTab, setActiveTab]           = useState('combo')
  const [validating, setValidating]         = useState(false)
  const [submitting, setSubmitting]         = useState(false)

  const scanRef = useRef()

  // ── Load active clients ──────────────────────────
  useEffect(() => {
    clientsAPI.list({ per_page: 500 })
      .then(res => {
        const raw = res.data
        const list = raw?.data || raw?.results || (Array.isArray(raw) ? raw : [])
        setClients(list)
      })
      .catch(() => toast.error('Failed to load clients'))
  }, [])

  useEffect(() => { scanRef.current?.focus() }, [activeTab])

  const filteredClients = clients.filter(c => {
    if (c.status && c.status !== 'active') return false
    const name  = (c.name || '').toLowerCase()
    const phone = c.phone || ''
    const q     = clientSearch.toLowerCase()
    return name.includes(q) || phone.includes(q)
  })

  const selectedClient = clients.find(c => String(c.id) === String(clientId))

  // ── Scan handler ──────────────────────────────────
  const handleScan = async (e) => {
    e.preventDefault()
    const bc = scanInput.trim()
    if (!bc) return
    setScanInput('')

    if (activeTab === 'combo') {
      if (scannedCombos.some(s => s.barcode === bc)) {
        toast.error('Already scanned')
        scanRef.current?.focus()
        return
      }

      setValidating(true)
      try {
        const res = await scanAPI.validateBarcode(bc)
        const body = res.data
        if (!body?.success) {
          toast.error(body?.message || 'Invalid barcode')
        } else {
          const d = body.data
          setScannedCombos(prev => [...prev, {
            barcode:   bc,
            comboName: d?.combo_name || (d?.type === 'external' ? 'External' : 'Unknown'),
            comboId:   d?.combo_id || null,
            type:      d?.type || 'combo',
          }])
          toast.success(body.message || 'Barcode validated')
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Invalid barcode')
      } finally {
        setValidating(false)
      }
    } else {
      if (scannedItems.includes(bc)) {
        toast.error('Already scanned')
      } else {
        setScannedItems(prev => [...prev, bc])
        toast.success('Item barcode added')
      }
    }
    scanRef.current?.focus()
  }

  const removeCombo = (bc) => setScannedCombos(prev => prev.filter(s => s.barcode !== bc))
  const removeItem  = (i)  => setScannedItems(prev => prev.filter((_, idx) => idx !== i))

  // ── Submit booking ────────────────────────────────
  const handleSubmit = async () => {
    if (!clientId) return toast.error('Select a client first')
    if (scannedCombos.length === 0) return toast.error('Scan at least one combo barcode')

    setSubmitting(true)
    try {
      const res = await scanAPI.submit({
        client_id:       Number(clientId),
        combo_barcodes:  scannedCombos.map(s => s.barcode),
        items_barcodes:  scannedItems,
      })
      const body = res.data
      if (body?.success) {
        toast.success(`Booking #${body.data.booking_id} created successfully`)
        setClientId(''); setClientSearch('')
        setScannedCombos([]); setScannedItems([])
      } else {
        toast.error(body?.message || 'Booking failed')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    if (scannedCombos.length === 0 && scannedItems.length === 0 && !clientId) return
    setClientId(''); setClientSearch('')
    setScannedCombos([]); setScannedItems([])
    toast.success('Cleared')
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Scan & Book</div>
          <div className="page-subtitle">Select a client, scan combo + item barcodes, then submit</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ───────────── LEFT: Client + Summary ───────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Client selector */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <User size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Client</span>
            </div>

            <div className="input-group" style={{ marginBottom: 10 }}>
              <Search size={14} className="input-icon" />
              <input
                className="input"
                placeholder="Search name / phone…"
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
              />
            </div>

            <div style={{
              maxHeight: 220, overflowY: 'auto',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            }}>
              {filteredClients.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No active clients found
                </div>
              ) : filteredClients.map(c => {
                const active = String(c.id) === String(clientId)
                return (
                  <div
                    key={c.id}
                    onClick={() => setClientId(c.id)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      background: active ? 'var(--accent-light)' : 'transparent',
                      borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: active ? 'var(--text-primary)' : 'var(--text-primary)' }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.phone || '—'}</div>
                    </div>
                    {active && <Check size={15} style={{ color: 'var(--accent)' }} />}
                  </div>
                )
              })}
            </div>

            {selectedClient && (
              <div style={{
                marginTop: 12, padding: '10px 12px',
                background: 'var(--success-light)', borderRadius: 'var(--radius-sm)',
                fontSize: 13, color: 'var(--success)', fontWeight: 600,
              }}>
                ✓ Selected: {selectedClient.name}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Summary</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
              <span className="text-secondary">Combo barcodes</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{scannedCombos.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
              <span className="text-secondary">Item barcodes</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{scannedItems.length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              <button
                className="btn btn-primary w-full"
                style={{ justifyContent: 'center' }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <span className="spinner" /> : <><Send size={14} /> Submit Booking</>}
              </button>
              <button
                className="btn btn-ghost w-full"
                style={{ justifyContent: 'center' }}
                onClick={handleReset}
              >
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* ───────────── RIGHT: Scanner + Lists ───────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Tabs + Scan input */}
          <div className="scan-zone active">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                className={activeTab === 'combo' ? 'btn btn-primary' : 'btn btn-secondary'}
                onClick={() => setActiveTab('combo')}
              >
                <Package size={14} /> Combo Barcodes
                <span style={{
                  background: activeTab === 'combo' ? 'rgba(255,255,255,.25)' : 'var(--bg-surface)',
                  borderRadius: 99, padding: '1px 8px', fontSize: 11, marginLeft: 4,
                }}>{scannedCombos.length}</span>
              </button>
              <button
                className={activeTab === 'items' ? 'btn btn-primary' : 'btn btn-secondary'}
                onClick={() => setActiveTab('items')}
              >
                <ScanLine size={14} /> Item Barcodes
                <span style={{
                  background: activeTab === 'items' ? 'rgba(255,255,255,.25)' : 'var(--bg-surface)',
                  borderRadius: 99, padding: '1px 8px', fontSize: 11, marginLeft: 4,
                }}>{scannedItems.length}</span>
              </button>
            </div>

            <form onSubmit={handleScan} className="scan-input-row">
              <div className="input-group" style={{ flex: 1 }}>
                <ScanLine size={15} className="input-icon" />
                <input
                  ref={scanRef}
                  className="input"
                  autoFocus
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  placeholder={activeTab === 'combo' ? 'Scan or type combo barcode…' : 'Scan or type item barcode…'}
                  style={{ fontSize: 14 }}
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={validating}>
                {validating ? <span className="spinner" /> : 'Add'}
              </button>
            </form>
          </div>

          {/* Combo barcodes list */}
          {activeTab === 'combo' && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
                Scanned Combo Barcodes
              </div>
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr><th>#</th><th>Barcode</th><th>Combo</th><th></th></tr>
                  </thead>
                  <tbody>
                    {scannedCombos.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        No combo barcodes scanned yet
                      </td></tr>
                    ) : scannedCombos.map((s, i) => (
                      <tr key={s.barcode}>
                        <td className="td-id">{i + 1}</td>
                        <td className="font-mono" style={{ color: 'var(--accent)' }}>{s.barcode}</td>
                        <td>{s.comboName}</td>
                        <td>
                          <button className="btn-icon danger" onClick={() => removeCombo(s.barcode)}>
                            <X size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Item barcodes list */}
          {activeTab === 'items' && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
                Scanned Item Barcodes <span className="text-muted" style={{ fontWeight: 400 }}>(external)</span>
              </div>
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr><th>#</th><th>Barcode</th><th></th></tr>
                  </thead>
                  <tbody>
                    {scannedItems.length === 0 ? (
                      <tr><td colSpan={3} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        No item barcodes scanned yet
                      </td></tr>
                    ) : scannedItems.map((bc, i) => (
                      <tr key={i}>
                        <td className="td-id">{i + 1}</td>
                        <td className="font-mono" style={{ color: 'var(--accent)' }}>{bc}</td>
                        <td>
                          <button className="btn-icon danger" onClick={() => removeItem(i)}>
                            <X size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}