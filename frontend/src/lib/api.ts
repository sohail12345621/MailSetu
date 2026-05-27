import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

export default api

// --- Auth ---
export const login = (email: string, password: string, smtp_host = 'smtp.gmail.com', smtp_port = 587) =>
  api.post('/auth/login', { email, app_password: password, smtp_host, smtp_port })

export const getMe = () => api.get('/auth/me')
export const logout = () => api.post('/auth/logout')
export const listAccounts = () => api.get('/auth/accounts')

// --- Emails ---
export const sendEmail = (data: any) => api.post('/emails/send', data)
export const sendBulk = (data: any) => api.post('/emails/bulk', data)
export const getLogs = (page = 1, per_page = 50, status?: string) =>
  api.get('/emails/logs', { params: { page, per_page, status } })
export const getStats = () => api.get('/emails/stats')
export const deleteLog = (id: number) => api.delete(`/emails/logs/${id}`)
export const parseCsv = (file: File) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/emails/parse-csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// --- Templates ---
export const getTemplates = () => api.get('/templates/')
export const getTemplate = (id: number) => api.get(`/templates/${id}`)
export const createTemplate = (data: any) => api.post('/templates/', data)
export const updateTemplate = (id: number, data: any) => api.put(`/templates/${id}`, data)
export const deleteTemplate = (id: number) => api.delete(`/templates/${id}`)

// --- Schedule ---
export const getSchedules = () => api.get('/schedule/')
export const createSchedule = (data: any) => api.post('/schedule/', data)
export const cancelSchedule = (job_id: string) => api.delete(`/schedule/${job_id}`)

// --- Uploads ---
export const uploadFiles = (files: File[]) => {
  const fd = new FormData()
  files.forEach(f => fd.append('files', f))
  return api.post('/uploads/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}
