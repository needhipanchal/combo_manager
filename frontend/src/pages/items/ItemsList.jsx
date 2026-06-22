import { useEffect, useState, useCallback } from 'react'
import { itemsAPI } from '../../api'
import { Modal, ConfirmModal, Pagination, EmptyState, LoadingCenter } from '../../components/ui'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = { name: '', description: '', hsn_sac: '', quantity: '', amount: '' }
const fmtCurr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// Helper to parse any API response format
const parseListResponse = (res, perPage = 20) => {
  // DRF default: { count, results: [] }
  if (res?.results) {
    return {
      data: res.results,
      total: res.count || 0,
      last_page: Math.ceil((res.count || 0) / perPage) || 1,
    }
  }
  // Custom: { data: { data: [], total, total_pages } }
  if (res?.data?.data) {
    return {
      data: res.data.data,
      total: res.data.total || 0,
      last_page: res.data.total_pages || 1,
    }
  }
  // Custom: { data: [], total, total_pages }
  if (res?.data && Array.isArray(res.data)) {
    return {
      data: res.data,
      total: res.total || 0,
      last_page: res.total_pages || 1,
    }
  }
  // Direct array
  if (Array.isArray(res)) {
    return { data: res, total: res.length, last_page: 1 }
  }
  return { data: [], total: 0, last_page: 1 }
}

export default function ItemsList() {
  const [data, setData]             = useState({ data: [], total: 0, last_page: 1 })
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(EMPTY)
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    itemsAPI.list({ page, per_page: 20, search })
      .then(r => setData(parseListResponse(r.data, 20)))
      .catch(() => toast.error('Failed to load items'))
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name: item.name,
      description: item.description || '',
      hsn_sac: item.hsn_sac_code || '',
      quantity: item.quantity,
      amount: item.rate,
    })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name,
      description: form.description || '',
      hsn_sac_code: form.hsn_sac || '',
      quantity: parseInt(form.quantity) || 0,
      rate: parseFloat(form.amount) || 0,
    }
    try {
      if (editing) {
        await itemsAPI.update(editing.id, payload)
        toast.success('Item updated')
      } else {
        await itemsAPI.create(payload)
        toast.success('Item created')
      }
      setShowForm(false)
      load()
    } catch (err) {
      console.log('Save error:', JSON.stringify(err.response?.data))
      const errors = err.response?.data
      if (errors?.message) {
        toast.error(errors.message)
      } else if (errors) {
        const firstKey = Object.keys(errors)[0]
        const firstVal = errors[firstKey]
        toast.error(Array.isArray(firstVal) ? firstVal[0] : String(firstVal))
      } else {
        toast.error('Save failed')
      }
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(confirmDel.id)
    try {
      await itemsAPI.delete(confirmDel.id)
      toast.success('Item deleted')
      setConfirmDel(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally { setDeleting(null) }
  }

  const totalValue = data.data?.reduce(
    (s, i) => s + (Number(i.quantity) * Number(i.rate)), 0
  ) || 0

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">All Items</div>
          <div className="page-subtitle">
            {data.total} items · Total value {fmtCurr(totalValue)}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Add Item
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="input-group" style={{ width: 280 }}>
          <Search size={14} className="input-icon" />
          <input
            className="input"
            placeholder="Search name / HSN…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Description</th>
                <th>HSN/SAC</th>
                <th>Stock</th>
                <th>Rate (₹)</th>
                <th>Value</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9}><LoadingCenter /></td></tr>
              ) : data.data?.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState icon="📦" title="No items found" sub="Add your first item" />
                  </td>
                </tr>
              ) : (data.data || []).map(item => (
                <tr key={item.id}>
                  <td className="td-id">#{item.id}</td>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td className="td-muted">{item.description || '—'}</td>
                  <td className="font-mono text-sm">{item.hsn_sac_code || '—'}</td>
                  <td>
                    <span style={{
                      color: item.quantity <= 10 ? 'var(--warning)' : 'var(--success)',
                      fontWeight: 600,
                    }}>
                      {item.quantity}
                    </span>
                  </td>
                  <td>{fmtCurr(item.rate)}</td>
                  <td style={{ color: 'var(--accent)', fontWeight: 600 }}>
                    {fmtCurr(item.quantity * item.rate)}
                  </td>
                  <td className="td-muted">
                    {String(item.updated_at || item.created_at || '').slice(0, 10)}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-icon" title="Edit" onClick={() => openEdit(item)}>
                        <Pencil size={13} />
                      </button>
                      <button className="btn-icon danger" title="Delete" onClick={() => setConfirmDel(item)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.total > 20 && (
          <div style={{ padding: '0 16px 16px' }}>
            <Pagination
              page={page}
              lastPage={data.last_page}
              total={data.total}
              perPage={20}
              onChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit Item' : 'Add Item'}
      >
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Item name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">HSN/SAC</label>
              <input
                className="input"
                value={form.hsn_sac}
                onChange={e => setForm(p => ({ ...p, hsn_sac: e.target.value }))}
                placeholder="123456"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="input"
                rows={2}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  required
                  value={form.quantity}
                  onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rate (₹) *</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmModal
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        loading={!!deleting}
        title="Delete Item"
        message={`Delete "${confirmDel?.name}"? This cannot be undone.`}
      />
    </div>
  )
}