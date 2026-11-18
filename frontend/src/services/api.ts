const API_URL = '/api'

export interface AuthResponse {
  token: string
  id: number
  fullName: string
  email: string
  role: 'OWNER' | 'ADMIN' | 'MASTER' | 'CLIENT'
}

async function apiFetch(url: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem('authToken')

  const headers = new Headers(options.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Ошибка запроса')
  }

  return response
}

export async function register(data: {
  fullName: string
  email: string
  phone: string
  password: string
}) {
  const response = await apiFetch(`${API_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return response.text()
}

export async function login(data: { email: string; password: string }) {
  const response = await apiFetch(`${API_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  const result: AuthResponse = await response.json()
  sessionStorage.setItem('authToken', result.token)
  sessionStorage.setItem('authUser', JSON.stringify({
    id: result.id,
    fullName: result.fullName,
    email: result.email,
    role: result.role,
  }))

  return result
}

export async function verifyEmail(token: string) {
  const response = await apiFetch(
    `${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`
  )
  return response.text()
}

export function logout() {
  sessionStorage.removeItem('authToken')
  sessionStorage.removeItem('authUser')
}

export function getCurrentUser() {
  const user = sessionStorage.getItem('authUser')
  return user ? JSON.parse(user) : null
}

export async function getClients() {
  const response = await apiFetch(`${API_URL}/clients`)
  return response.json()
}

export async function createClient(client: {
  fullName: string
  phone: string
  email: string
  notes: string
}) {
  const response = await apiFetch(`${API_URL}/clients`, {
    method: 'POST',
    body: JSON.stringify(client),
  })
  return response.json()
}

export async function updateClient(id: number, client: {
  fullName: string
  phone: string
  email: string
  notes: string
}) {
  const response = await apiFetch(`${API_URL}/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(client),
  })
  return response.json()
}

export async function deleteClient(id: number) {
  await apiFetch(`${API_URL}/clients/${id}`, { method: 'DELETE' })
}

export async function getAppointments() {
  const response = await apiFetch(`${API_URL}/appointments`)
  return response.json()
}

export async function uploadClientPhoto(id: number, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiFetch(`${API_URL}/clients/${id}/photo`, {
    method: 'POST',
    body: formData,
  })

  return response.json()
}

export async function getMasters() {
  const response = await apiFetch(`${API_URL}/masters`)
  return response.json()
}

export async function createMaster(master: {
  fullName: string
  specialization: string
  phone: string
  email: string
}) {
  const response = await apiFetch(`${API_URL}/masters`, {
    method: 'POST',
    body: JSON.stringify(master),
  })
  return response.json()
}

export async function updateMaster(id: number, master: {
  fullName: string
  specialization: string
  phone: string
  email: string
}) {
  const response = await apiFetch(`${API_URL}/masters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(master),
  })
  return response.json()
}

export async function deleteMaster(id: number) {
  await apiFetch(`${API_URL}/masters/${id}`, { method: 'DELETE' })
}
export interface Staff {
  id: number
  fullName: string
  email: string
  phone: string
  role: 'ADMIN' | 'MASTER'
  enabled: boolean
  masterId: number | null
  createdAt: string
}

export interface StaffRequest {
  fullName?: string
  email?: string
  phone?: string
  password?: string
  role: 'ADMIN' | 'MASTER'
  masterId: number | null
}

export async function getStaff(): Promise<Staff[]> {
  const response = await apiFetch(`${API_URL}/staff`)
  return response.json()
}

export async function createStaff(staff: StaffRequest): Promise<Staff> {
  const response = await apiFetch(`${API_URL}/staff`, {
    method: 'POST',
    body: JSON.stringify(staff),
  })
  return response.json()
}

export async function updateStaff(id: number, staff: StaffRequest): Promise<Staff> {
  const response = await apiFetch(`${API_URL}/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(staff),
  })
  return response.json()
}

export async function setStaffEnabled(id: number, enabled: boolean): Promise<Staff> {
  const response = await apiFetch(
    `${API_URL}/staff/${id}/status?enabled=${enabled}`,
    { method: 'PATCH' }
  )
  return response.json()
}
