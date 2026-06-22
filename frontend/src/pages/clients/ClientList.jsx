import { useEffect, useState, useCallback } from 'react'
import { clientsAPI } from '../../api'
import { Modal, ConfirmModal, Pagination, EmptyState, LoadingCenter, Badge } from '../../components/ui'
import { Plus, Search, Pencil, Trash2, PauseCircle, PlayCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = { name: '', phone: '', email: '', address: '', status: 'active' }

const parseListResponse = (res, perPage = 20) => {
  if (res?.results) {
    return { data: res.results, total: res.count || 0, last_page: Math.ceil((res.count || 0) / perPage) || 1 }
  }
  if (res?.data?.data) {
    return { data: res.data.data, total: res.data.total || 0, last_page: res.data.total_pages || 1 }
  }
  if (res?.data && Array.isArray(res.data)) {
    return { data: res.data, total: res.total || 0, last_page: res.total_pages || 1 }
  }
  if (Array.isArray(res)) return { data: res, total: res.length, last_page: 1 }
  return { data: [], total: 0, last_page: 1 }
}

export default function ClientList() {
  const [data, setData]         = useState({ data: [], total: 0, last_page: 1 })
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]         = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    clientsAPI.list({ page, per_page: 20, search, status: statusFilter })
      .then(r => setData(parseListResponse(r.data, 20)))
      .catch(() => toast.error('Failed to load clients'))
      .finally(() => setLoading(false))
  }, [page, search, statusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, statusFilter])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit   = (c) => {
    setEditing(c)
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', status: c.status })
    setShowForm(true)
  }

  const toggleStatus = async (client) => {
    try {
      const newStatus = client.status === 'active' ? 'inactive' : 'active'
      await clientsAPI.update(client.id, { status: newStatus })
      toast.success(`Client ${newStatus}`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await clientsAPI.update(editing.id, form)
        toast.success('Client updated')
      } else {
        await clientsAPI.create(form)
        toast.success('Client created')
      }
      setShowForm(false)
      load()
    } catch (err) {
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
    setDeleting(true)
    try {
      await clientsAPI.delete(confirmDel.id)
      toast.success('Client deleted')
      setConfirmDel(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally { setDeleting(false) }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">All Clients</div>
          <div className="page-subtitle">{data.total} clients</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> Add Client</button>
      </div>

      <div className="toolbar">
        <select className="select" style={{ width: 140 }} value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="input-group" style={{ width: 280 }}>
          <Search size={14} className="input-icon" />
          <input className="input" placeholder="Search name / phone / email…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><LoadingCenter /></td></tr>
              ) : data.data?.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon="👥" title="No clients found" sub="Add your first client" /></td></tr>
              ) : (data.data || []).map(c => (
                <tr key={c.id}>
                  <td className="td-id">#{c.id}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td className="font-mono text-sm">{c.phone || '—'}</td>
                  <td className="td-muted">{c.email || '—'}</td>
                  <td className="td-muted">{c.address || '—'}</td>
                  <td>
                    <Badge type={c.status === 'active' ? 'success' : 'danger'}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="td-muted">{String(c.created_at || '').slice(0, 10)}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-icon" title="Edit" onClick={() => openEdit(c)}>
                        <Pencil size={13} />
                      </button>
                      <button className="btn-icon warning" title={c.status === 'active' ? 'Deactivate' : 'Activate'}
                        onClick={() => toggleStatus(c)}>
                        {c.status === 'active' ? <PauseCircle size={13} /> : <PlayCircle size={13} />}
                      </button>
                      <button className="btn-icon danger" title="Delete" onClick={() => setConfirmDel(c)}>
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
            <Pagination page={page} lastPage={data.last_page} total={data.total} perPage={20} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Client' : 'Add Client'}>
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="input" required value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="input" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="input" type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="input" rows={2} value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Address" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="select" value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!confirmDel} onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Client" message={`Delete "${confirmDel?.name}"? This cannot be undone.`} />
    </div>
  )
}