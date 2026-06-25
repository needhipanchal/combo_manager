import axios from 'axios'

// ============================================================
// Axios instance
// ============================================================
const api = axios.create({
  baseURL: 'http://demotest.co.in:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        // FIX: was '/api/v1/auth/refresh/' (wrong prefix, doesn't exist).
        // Real confirmed route from main urls.py: api/token/refresh/
        const { data } = await axios.post('/api/token/refresh/', { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ============================================================
// AUTH
// FIX: real routes (confirmed from main urls.py) are:
//   POST /api/token/          → login (TokenObtainPairView)
//   POST /api/token/refresh/  → refresh
//   POST /api/signup/         → signup
// There is no /api/auth/login/ or /api/auth/logout/ — SimpleJWT has
// no built-in logout endpoint by default (no blacklist app confirmed).
// ============================================================
export const authAPI = {
  login:   (data)    => api.post('/token/', data),
  refresh: (refresh) => api.post('/token/refresh/', { refresh }),
  signup:  (data)    => api.post('/signup/', data),
}

// ============================================================
// DASHBOARD
// ============================================================
export const dashboardAPI = {
  get: () => api.get('/dashboard/'),
}

// ============================================================
// ITEMS
// FIX: update should be PATCH (partial update), not PUT (which requires
// every field). Using PATCH is safer/standard for edit-one-field forms.
// ============================================================
export const itemsAPI = {
  list:   (params)    => api.get('/items/', { params }),
  get:    (id)         => api.get(`/items/${id}/`),
  create: (data)        => api.post('/items/create/', data),
  update: (id, data)     => api.patch(`/items/${id}/update/`, data),
  delete: (id)            => api.delete(`/items/${id}/delete/`),
}

// ============================================================
// COMBOS
// FIX: removed 6 methods that call endpoints which do not exist on
// the backend (listBarcodes, addQty pointed at wrong shape, addItem,
// removeItem, deleteBarcode, listItems). Confirmed from
// apps/combo/urls.py + barcode_urls.py + serializers.py:
//   - Items can ONLY be set at combo creation time (ComboCreateSerializer)
//   - Items/barcodes are returned NESTED inside list/detail responses
//     (ComboListSerializer.get_items/get_barcodes) — no separate endpoint
//   - The only barcode-related POST is generate/, which creates new
//     barcodes; it does not take arbitrary "add qty" semantics
//   - update only accepts {name} per ComboUpdateSerializer
// ============================================================
export const combosAPI = {
  list:   (params)    => api.get('/combo/', { params }),
  get:    (id)          => api.get(`/combo/${id}/`),
  create: (data)         => api.post('/combo/create/', data),
  update: (id, data)      => api.patch(`/combo/${id}/update/`, data),
  delete: (id)             => api.delete(`/combo/${id}/delete/`),

  // Generates new barcodes for a combo — POST /api/combo/<combo_id>/generate/
  // Body: { quantity: <int> }. Returns only a success message, not the
  // barcode list — re-fetch the combo (get) afterward to see the new ones.
  generateBarcodes: (comboId, quantity) => api.post(`/combo/${comboId}/generate/`, { quantity }),
}

// ============================================================
// CLIENTS
// FIX: update should be PATCH, not PUT, same reasoning as items.
// ============================================================
export const clientsAPI = {
  list:   (params)    => api.get('/client/', { params }),
  get:    (id)         => api.get(`/client/${id}/`),
  create: (data)        => api.post('/client/create/', data),
  update: (id, data)     => api.patch(`/client/${id}/update/`, data),
  delete: (id)             => api.delete(`/client/${id}/delete/`),
}

// ============================================================
// BOOKINGS
// ============================================================
export const bookingsAPI = {
  list:   (params) => api.get('/booking/', { params }),
  get:    (id)     => api.get(`/booking/${id}/`),
  create: (data)   => api.post('/booking/create/', data),
  delete: (id)     => api.delete(`/booking/${id}/delete/`),
}

// ============================================================
// SCAN
// Confirmed shapes from apps/scan/views.py (GenericAPIView versions):
//   POST /api/scan/validate/  body: { barcode }
//   POST /api/scan/submit/    body: { client_id, combo_barcodes, items_barcodes }
//   GET  /api/scan/           list bookings (search supported)
//   GET  /api/scan/<id>/      single booking detail
// All wrapped as { success, message, data }
// ============================================================
export const scanAPI = {
  list:            (params)  => api.get('/scan/', { params }),
  validateBarcode: (barcode) => api.post('/scan/validate/', { barcode }),
  submit:          (data)     => api.post('/scan/submit/', data),
  detail:          (id)       => api.get(`/scan/${id}/`),
}

// ============================================================
// REPORTS
// ============================================================
export const reportsAPI = {
  get: (params) => api.get('/reports/', { params }),
}

// ============================================================
// LOGS
// Confirmed real method names used by LogsPage.jsx: list(), byModule()
// ============================================================
export const logsAPI = {
  list:     (params)         => api.get('/logs/', { params }),
  byModule: (module, params) => api.get(`/logs/${module}/`, { params }),
}

// ============================================================
// QR CODE — combo barcode images, generated on-the-fly, nothing stored.
// Confirmed real route: GET /api/combo_barcode/<barcode_STRING>/qr/
// Requires Authorization header, so fetch via the authenticated `api`
// instance with responseType: 'blob' — do NOT use as a plain <img src>.
// Example usage (see ComboList.jsx openQR()):
//   const res = await api.get(`/combo_barcode/${barcode}/qr/`, { responseType: 'blob' })
//   const url = URL.createObjectURL(res.data)
// ============================================================
export const barcodeImageAPI = {
  qrUrl:     (barcode) => `/combo_barcode/${barcode}/qr/`,
  linearUrl: (barcode) => `/combo_barcode/${barcode}/image/`,
}

export default api