const API_URL = '/api'

export async function getClients() {
  const response = await fetch(`${API_URL}/clients`)
  if (!response.ok) throw new Error('Не удалось загрузить клиентов')
  return response.json()
}

export async function createClient(client: {
  fullName: string
  phone: string
  email: string
  notes: string
}) {
  const response = await fetch(`${API_URL}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  })
  if (!response.ok) throw new Error('Не удалось создать клиента')
  return response.json()
}

export async function updateClient(id: number, client: {
  fullName: string
  phone: string
  email: string
  notes: string
}) {
  const response = await fetch(`${API_URL}/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  })
  if (!response.ok) throw new Error('Не удалось обновить клиента')
  return response.json()
}

export async function deleteClient(id: number) {
  const response = await fetch(`${API_URL}/clients/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Не удалось удалить клиента')
}

export async function getAppointments() {
  const response = await fetch(`${API_URL}/appointments`)
  if (!response.ok) throw new Error('Не удалось загрузить записи')
  return response.json()
}
export async function uploadClientPhoto(id: number, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/clients/${id}/photo`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Не удалось загрузить фотографию')
  }

  return response.json()
}

export async function getMasters() {
  const response = await fetch(`${API_URL}/masters`)
  if (!response.ok) throw new Error('Не удалось загрузить мастеров')
  return response.json()
}

export async function createMaster(master: {
  fullName: string
  specialization: string
  phone: string
  email: string
}) {
  const response = await fetch(`${API_URL}/masters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(master),
  })
  if (!response.ok) throw new Error('Не удалось добавить мастера')
  return response.json()
}

export async function updateMaster(id: number, master: {
  fullName: string
  specialization: string
  phone: string
  email: string
}) {
  const response = await fetch(`${API_URL}/masters/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(master),
  })
  if (!response.ok) throw new Error('Не удалось обновить мастера')
  return response.json()
}

export async function deleteMaster(id: number) {
  const response = await fetch(`${API_URL}/masters/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Не удалось удалить мастера')
}