import { useEffect, useState, useCallback } from 'react'
import { combosAPI, itemsAPI } from '../../api'
import api from '../../api'
import { Modal, ConfirmModal, EmptyState, LoadingCenter, Badge } from '../../components/ui'
import { Plus, Search, Pencil, Trash2, Tag, LayoutList, X, QrCode, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY_COMBO = { name: '', items: [] }

export default function ComboList() {
  const [combos, setCombos]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  // Create combo
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(EMPTY_COMBO)
  const [allItems, setAllItems]     = useState([])
  const [pickItemId, setPickItemId] = useState('')
  const [pickQty, setPickQty]       = useState(1)
  const [saving, setSaving]         = useState(false)

  // Edit combo (name only — confirmed from ComboUpdateSerializer)
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Delete
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting, setDeleting]     = useState(false)

  // Generate barcodes — confirmed real endpoint: POST /combo/<id>/generate/
  const [barcodeCombo, setBarcodeCombo] = useState(null)
  const [genQty, setGenQty]             = useState(10)
  const [generating, setGenerating]     = useState(false)

  // View items/barcodes — nested data already in the combo list response,
  // no separate API call needed (confirmed from ComboListSerializer)
  const [viewCombo, setViewCombo] = useState(null)

  // QR code viewer
  const [qrBarcode, setQrBarcode]   = useState(null)
  const [qrImageUrl, setQrImageUrl] = useState(null)
  const [qrLoading, setQrLoading]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    combosAPI.list({ search })
      .then(r => setCombos(r.data?.results || r.data || []))
      .catch(() => toast.error('Failed to load combos'))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { load() }, [load])

  // ── Create ──────────────────────────────────
  const openCreate = async () => {
    setForm(EMPTY_COMBO)
    setPickItemId(''); setPickQty(1)
    setShowForm(true)
    try {
      const r = await itemsAPI.list({ per_page: 500 })
      setAllItems(r.data?.data || r.data?.results || r.data || [])
    } catch {
      toast.error('Failed to load items list')
    }
  }

  const addItemToForm = () => {
    if (!pickItemId) return
    const item = allItems.find(i => String(i.id) === String(pickItemId))
    if (!item) return
    if (form.items.some(i => i.item === item.id)) {
      toast.error('Item already added')
      return
    }
    setForm(p => ({ ...p, items: [...p.items, { item: item.id, item_name: item.name, quantity: pickQty }] }))
    setPickItemId(''); setPickQty(1)
  }

  const removeItemFromForm = (itemId) => {
    setForm(p => ({ ...p, items: p.items.filter(i => i.item !== itemId) }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (form.items.length === 0) {
      toast.error('Add at least one item')
      return
    }
    setSaving(true)
    try {
      await combosAPI.create({
        name: form.name,
        items: form.items.map(i => ({ item: i.item, quantity: i.quantity })),
      })
      toast.success('Combo created')
      setShowForm(false)
      load()
    } catch (err) {
      const data = err.response?.data
      const msg = data?.name?.[0] || data?.items?.[0] || data?.detail || 'Save failed'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // ── Edit (name only) ─────────────────────────
  const openEdit = (combo) => {
    setEditing(combo)
    setEditName(combo.name)
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    setEditSaving(true)
    try {
      await combosAPI.update(editing.id, { name: editName })
      toast.success('Combo updated')
      setEditing(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || 'Update failed')
    } finally {
      setEditSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await combosAPI.delete(confirmDel.id)
      toast.success('Combo deleted')
      setConfirmDel(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  // ── Generate Barcodes ─────────────────────────
  const openGenerate = (combo) => { setBarcodeCombo(combo); setGenQty(10) }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const r = await combosAPI.generateBarcodes(barcodeCombo.id, genQty)
      toast.success(r.data?.message || 'Barcodes generated')
      setBarcodeCombo(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.quantity?.[0] || err.response?.data?.detail || 'Failed to generate barcodes')
    } finally {
      setGenerating(false)
    }
  }

  // ── QR Code viewer ────────────────────────────
  const openQR = async (barcodeObj) => {
    setQrBarcode(barcodeObj)
    setQrLoading(true)
    setQrImageUrl(null)
    try {
      // Confirmed real route: GET /api/combo_barcode/<barcode_STRING>/qr/
      const res = await api.get(`/combo_barcode/${barcodeObj.barcode}/qr/`, {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(res.data)
      setQrImageUrl(url)
    } catch {
      toast.error('Failed to generate QR code')
    } finally {
      setQrLoading(false)
    }
  }

  const closeQR = () => {
    if (qrImageUrl) URL.revokeObjectURL(qrImageUrl)
    setQrBarcode(null)
    setQrImageUrl(null)
  }

  const downloadQR = () => {
    if (!qrImageUrl || !qrBarcode) return
    const a = document.createElement('a')
    a.href = qrImageUrl
    a.download = `${qrBarcode.barcode}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">All Combos</div>
          <div className="page-subtitle">{combos.length} combos</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Add Combo
        </button>
      </div>

      <div className="toolbar">
        <div className="input-group" style={{ width: 280 }}>
          <Search size={14} className="input-icon" />
          <input
            className="input"
            placeholder="Search combo name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Items</th>
                <th>Barcodes</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><LoadingCenter /></td></tr>
              ) : combos.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon="🎁" title="No combos found" /></td></tr>
              ) : combos.map(c => {
                const itemCount    = c.items?.length || 0
                const barcodeCount = c.barcodes?.length || 0
                const available    = c.barcodes?.filter(b => b.status === 'active').length ?? 0
                return (
                  <tr key={c.id}>
                    <td className="td-id">#{c.id}</td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>
                      <span className="text-secondary text-sm">
                        {itemCount} item{itemCount !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{barcodeCount}</span>
                      <span className="text-muted text-sm"> ({available} available)</span>
                    </td>
                    <td className="td-muted">{String(c.created_at || '').slice(0, 10)}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-secondary btn-sm" title="Generate Barcodes" onClick={() => openGenerate(c)}>
                          <Tag size={12} /> Barcodes
                        </button>
                        <button className="btn btn-secondary btn-sm" title="View Items & QR" onClick={() => setViewCombo(c)}>
                          <LayoutList size={12} /> View
                        </button>
                        <button className="btn-icon" title="Edit name" onClick={() => openEdit(c)}>
                          <Pencil size={13} />
                        </button>
                        <button className="btn-icon danger" title="Delete" onClick={() => setConfirmDel(c)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Combo Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Combo" size="modal-lg">
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Combo name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Items *</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <select
                  className="select"
                  style={{ flex: 2 }}
                  value={pickItemId}
                  onChange={e => setPickItemId(e.target.value)}
                >
                  <option value="">— Select item —</option>
                  {allItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <input
                  className="input"
                  type="number"
                  min={1}
                  style={{ width: 80 }}
                  value={pickQty}
                  onChange={e => setPickQty(Number(e.target.value))}
                />
                <button type="button" className="btn btn-secondary" onClick={addItemToForm}>
                  <Plus size={14} />
                </button>
              </div>

              {form.items.length === 0 ? (
                <div className="text-muted text-sm">No items added yet</div>
              ) : (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  {form.items.map(i => (
                    <div key={i.item} className="scan-row">
                      <span>{i.item_name} <span className="text-muted">x{i.quantity}</span></span>
                      <button type="button" className="btn-icon danger" onClick={() => removeItemFromForm(i.item)}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Combo Name Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit Combo — ${editing?.name}`}>
        <form onSubmit={handleEditSave}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              className="input"
              required
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />
          </div>
          <div className="text-muted text-sm" style={{ marginTop: 10 }}>
            Note: items can only be set when creating a combo.
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={editSaving}>
              {editSaving ? <span className="spinner" /> : 'Update'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Generate Barcodes Modal */}
      <Modal open={!!barcodeCombo} onClose={() => setBarcodeCombo(null)} title={`Generate Barcodes — ${barcodeCombo?.name}`}>
        <div className="form-group">
          <label className="form-label">Quantity to generate</label>
          <input
            className="input"
            type="number"
            min={1}
            max={1000}
            value={genQty}
            onChange={e => setGenQty(Number(e.target.value))}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setBarcodeCombo(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? <span className="spinner" /> : 'Generate'}
          </button>
        </div>
      </Modal>

      {/* View Items + Barcodes — nested data, no extra API call needed */}
      <Modal open={!!viewCombo} onClose={() => setViewCombo(null)} title={`${viewCombo?.name} — Details`} size="modal-lg">
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Items</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Item</th><th>Qty</th></tr></thead>
              <tbody>
                {(viewCombo?.items || []).length === 0 ? (
                  <tr><td colSpan={3}><EmptyState icon="📦" title="No items" /></td></tr>
                ) : viewCombo.items.map((ci, i) => (
                  <tr key={ci.id}>
                    <td className="td-id">{i + 1}</td>
                    <td>{ci.item_name}</td>
                    <td>{ci.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Barcodes</div>
          <div className="table-wrap" style={{ maxHeight: 260, overflowY: 'auto' }}>
            <table>
              <thead><tr><th>#</th><th>Barcode</th><th>Status</th><th>QR</th></tr></thead>
              <tbody>
                {(viewCombo?.barcodes || []).length === 0 ? (
                  <tr><td colSpan={4}><EmptyState icon="🏷️" title="No barcodes yet" sub="Use the Barcodes button to generate" /></td></tr>
                ) : viewCombo.barcodes.map((b, i) => (
                  <tr key={b.id}>
                    <td className="td-id">{i + 1}</td>
                    <td className="font-mono text-sm" style={{ color: 'var(--accent)' }}>{b.barcode}</td>
                    <td>
                      <Badge type={b.status === 'active' ? 'success' : b.status === 'used' ? 'warning' : 'danger'}>
                        {b.status}
                      </Badge>
                    </td>
                    <td>
                      <button className="btn-icon" title="View QR code" onClick={() => openQR(b)}>
                        <QrCode size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* QR Code Viewer Modal */}
      <Modal open={!!qrBarcode} onClose={closeQR} title={`QR Code — ${qrBarcode?.barcode}`}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {qrLoading ? (
            <LoadingCenter text="Generating QR code…" />
          ) : qrImageUrl ? (
            <>
              <div style={{
                background: '#fff', padding: 16, borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src={qrImageUrl} alt={qrBarcode?.barcode} style={{ width: 220, height: 220, display: 'block' }} />
              </div>
              <div className="font-mono text-sm text-secondary">{qrBarcode?.barcode}</div>
              <button className="btn btn-primary" onClick={downloadQR}>
                <Download size={14} /> Download PNG
              </button>
            </>
          ) : (
            <div className="text-muted text-sm">Failed to load QR code</div>
          )}
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Combo"
        message={`Delete "${confirmDel?.name}"? This cannot be undone.`}
      />
    </div>
  )
}