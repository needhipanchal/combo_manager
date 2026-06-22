import { X } from 'lucide-react'

// ── Modal ──────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = '' }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size}`}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Pagination ─────────────────────────────────────────────
export function Pagination({ page, lastPage, total, perPage, onChange }) {
  const from = ((page - 1) * perPage) + 1
  const to   = Math.min(page * perPage, total)
  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing {from}–{to} of {total} results
      </span>
      <div className="pagination-btns">
        <button className="btn btn-secondary btn-sm"
          disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ‹ Prev
        </button>
        <span style={{ padding: '5px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
          {page} / {lastPage}
        </span>
        <button className="btn btn-secondary btn-sm"
          disabled={page >= lastPage} onClick={() => onChange(page + 1)}>
          Next ›
        </button>
      </div>
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────
export function EmptyState({ icon = '📭', title = 'No data found', sub = '' }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {sub && <div className="empty-state-sub">{sub}</div>}
    </div>
  )
}

// ── Spinner ────────────────────────────────────────────────
export function LoadingCenter({ text = 'Loading…' }) {
  return (
    <div className="loading-center">
      <span className="spinner" />
      <span>{text}</span>
    </div>
  )
}

// ── Confirm Dialog ─────────────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title, message, loading }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 className="modal-title">{title || 'Confirm'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{message}</p>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────
export function Badge({ children, type = 'default' }) {
  return <span className={`badge badge-${type}`}>{children}</span>
}