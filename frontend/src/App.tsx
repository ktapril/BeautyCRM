import { useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users,
  Sparkles, BriefcaseBusiness, ChartNoAxesCombined, Settings,
  Sun, Moon, Search, Pencil, Trash2
} from 'lucide-react'
import { getClients, createClient, updateClient, deleteClient, uploadClientPhoto, getMasters, createMaster, updateMaster, deleteMaster } from './services/api'
import './App.css'

interface Client {
  id: number
  fullName: string
  phone: string
  email: string
  notes: string
  photoUrl: string | null
  deleted: boolean
}

interface Master {
  id: number
  fullName: string
  specialization: string
  phone: string
  email: string
  deleted: boolean
  photoUrl: string | null
}
const menu = [
  { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { id: 'calendar', label: 'Календарь', icon: CalendarDays },
  { id: 'schedule', label: 'Записи', icon: ClipboardList },
  { id: 'clients', label: 'Клиенты', icon: Users },
  { id: 'masters', label: 'Мастера', icon: BriefcaseBusiness },
  { id: 'services', label: 'Услуги', icon: Sparkles },
  { id: 'stats', label: 'Статистика', icon: ChartNoAxesCombined },
  { id: 'settings', label: 'Настройки', icon: Settings },
]

const titles: Record<string, string> = {
  dashboard: 'Добро пожаловать!',
  calendar: 'Календарь',
  schedule: 'Все записи',
  clients: 'Клиенты',
  masters: 'Мастера',
  services: 'Услуги',
  stats: 'Статистика',
  settings: 'Настройки',
}

async function getCroppedImage(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image()
  image.src = imageSrc

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Не удалось открыть изображение'))
  })

  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Не удалось обработать изображение')
  }

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Ошибка кадрирования')),
      'image/jpeg',
      0.92
    )
  })
}
function App() {
  const [activePage, setActivePage] = useState(() => localStorage.getItem('activePage') || 'dashboard')
  const [dark, setDark] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showClientModal, setShowClientModal] = useState(false)
  const [editingClientId, setEditingClientId] = useState<number | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientForm, setClientForm] = useState({ fullName: '', phone: '', email: '', notes: '' })
  const [savingClient, setSavingClient] = useState(false)
  const [clientError, setClientError] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [cropImage, setCropImage] = useState<string | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  useEffect(() => {
    getClients()
      .then((data) => setClients(data.filter((client: Client) => !client.deleted)))
      .catch(() => setError('Не удалось загрузить клиентов'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
    return () => document.body.classList.remove('dark')
  }, [dark])

  const handleSaveClient = async () => {
    if (!clientForm.fullName.trim() || !clientForm.phone.trim()) {
      setClientError('Заполни имя и телефон')
      return
    }

    setSavingClient(true)
    setClientError('')

    const data = {
      fullName: clientForm.fullName.trim(),
      phone: clientForm.phone.trim(),
      email: clientForm.email.trim(),
      notes: clientForm.notes.trim(),
    }

    try {
      if (editingClientId !== null) {
        const updatedClient = await updateClient(editingClientId, data)
        setClients((prev) => prev.map((client) =>
          client.id === editingClientId ? updatedClient : client
        ))
      } else {
        const newClient = await createClient(data)
        setClients((prev) => [...prev, newClient])
      }

      setClientForm({ fullName: '', phone: '', email: '', notes: '' })
      setEditingClientId(null)
      setShowClientModal(false)
    } catch {
      setClientError('Не удалось сохранить клиента. Попробуй ещё раз.')
    } finally {
      setSavingClient(false)
    }
  }
  const handleSaveCroppedPhoto = async () => {
    if (!cropImage || !croppedAreaPixels || !selectedClient) return

    setUploadingPhoto(true)

    try {
      const blob = await getCroppedImage(cropImage, croppedAreaPixels)
      const file = new File([blob], 'client-photo.jpg', { type: 'image/jpeg' })
      const updatedClient = await uploadClientPhoto(selectedClient.id, file)

      setClients((previous) =>
        previous.map((client) =>
          client.id === updatedClient.id ? updatedClient : client
        )
      )

      setSelectedClient(updatedClient)
      URL.revokeObjectURL(cropImage)
      setCropImage(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ошибка обработки фотографии')
    } finally {
      setUploadingPhoto(false)
    }
  }
  const filteredClients = clients.filter((client) => {
    const query = search.toLowerCase()
    return (
      client.fullName.toLowerCase().includes(query) ||
      client.phone.toLowerCase().includes(query) ||
      (client.email || '').toLowerCase().includes(query)
    )
  })

  return (
    <>
      <header className="header">
        <div className="logo">
          <div className="logo-icon"><Sparkles size={19} /></div>
          <span>Beauty CRM</span>
        </div>

        <div className="header-actions">
          <button className="icon-btn" onClick={() => setDark(!dark)}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{dark ? 'Светлая тема' : 'Тёмная тема'}</span>
          </button>
          <div className="user-avatar">Л</div>
        </div>
      </header>

      <div className="container">
        <aside className="sidebar">
          {menu.map(({ id, label, icon: Icon }) => (
            <div
              key={id}
              className={`menu-item ${activePage === id ? 'active' : ''}`}
              onClick={() => { setActivePage(id); localStorage.setItem('activePage', id) }}
            >
              <Icon className="menu-icon" size={18} />
              <span>{label}</span>
            </div>
          ))}
        </aside>

        <main className="main-content">
          <div className="page active">
            <h1 className="page-title">{titles[activePage]}</h1>

            {activePage === 'dashboard' && (
              <>
                <p className="page-subtitle">
                  Обзор работы косметологического центра
                </p>
                <div className="stats-grid">
                  <div className="stat-card featured">
                    <div className="stat-label">Записи сегодня</div>
                    <div className="stat-value">0</div>
                  </div>
                  <div className="stat-card sage">
                    <div className="stat-label">Клиенты</div>
                    <div className="stat-value">
                      {loading ? '...' : error ? '!' : clients.length}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Мастера</div>
                    <div className="stat-value">0</div>
                  </div>
                </div>
                {error && <p>{error}</p>}
              </>
            )}

            {activePage === 'clients' && (
              <>
                <p className="page-subtitle">
                  База клиентов косметологического центра
                </p>

                <div style={{ marginBottom: 16 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setClientError('')
                      setShowClientModal(true)
                    }}
                  >
                    <Users size={16} />
                    Добавить клиента
                  </button>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ position: 'relative', maxWidth: 360 }}>
                    <Search
                      size={17}
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: 11,
                        color: 'var(--text-light)',
                      }}
                    />
                    <input
                      className="search-box"
                      style={{ width: '100%', paddingLeft: 38 }}
                      placeholder="Поиск по имени, телефону или email"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                </div>

                {loading ? (
                  <p>Загружаем клиентов...</p>
                ) : error ? (
                  <p>{error}</p>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Имя клиента</th>
                          <th>Телефон</th>
                          <th>Email</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClients.map((client) => (
                          <tr key={client.id}>
                            <td>
  <button
    onClick={() => setSelectedClient(client)}
    style={{
      background: 'none',
      border: 'none',
      padding: 0,
      color: 'var(--primary)',
      cursor: 'pointer',
      font: 'inherit',
      fontWeight: 600,
    }}
  >
    {client.fullName}
  </button>
</td>
                            <td>{client.phone}</td>
                            <td>{client.email || 'Не указан'}</td>
                            <td>
                              <button
                                className="btn btn-outline"
                                title="Редактировать"
                                onClick={() => {
                                  setEditingClientId(client.id)
                                  setClientForm({
                                    fullName: client.fullName,
                                    phone: client.phone,
                                    email: client.email || '',
                                    notes: client.notes || '',
                                  })
                                  setClientError('')
                                  setShowClientModal(true)
                                }}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                className="btn btn-outline"
                                title="Удалить"
                                onClick={async () => {
                                  if (!window.confirm(`Удалить клиента ${client.fullName}?`)) return
                                  try {
                                    await deleteClient(client.id)
                                    setClients((prev) => prev.filter((item) => item.id !== client.id))
                                  } catch {
                                    window.alert('Не удалось удалить клиента')
                                  }
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredClients.length === 0 && (
                          <tr>
                            <td colSpan={4}>
                              Клиенты не найдены
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="page-subtitle" style={{ marginTop: 16 }}>
                  Всего клиентов: {clients.length}
                </p>
              </>
            )}

            {!['dashboard', 'clients'].includes(activePage) && (
              <p className="page-subtitle">
                Раздел «{titles[activePage]}». Работа над ним ещё впереди.
              </p>
            )}
          </div>
        </main>
      </div>
      {selectedClient && (
        <div
          className="modal-overlay active"
          onClick={() => setSelectedClient(null)}
        >
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2 className="modal-title">Карточка клиента</h2>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'var(--primary-light, #eadde2)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: 32,
                fontWeight: 600,
              }}>
                {selectedClient.photoUrl ? (
                  <img
                    src={selectedClient.photoUrl}
                    alt={selectedClient.fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  selectedClient.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
                )}
              </div>
              <label className="btn btn-outline" style={{ display: 'inline-block', cursor: 'pointer', marginBottom: 12 }}>
                {uploadingPhoto ? 'Загрузка...' : selectedClient.photoUrl ? 'Изменить фото' : 'Добавить фото'}
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  disabled={uploadingPhoto}
                  style={{ display: 'none' }}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      setCropImage(URL.createObjectURL(file))
                      setCrop({ x: 0, y: 0 })
                      setZoom(1)
                    }
                    event.target.value = ''
                  }}
                />
              </label>
              <h3>{selectedClient.fullName}</h3>
            </div>

            <div className="form-group">
              <label className="form-label">Телефон</label>
              <p>{selectedClient.phone || 'Не указан'}</p>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <p>{selectedClient.email || 'Не указан'}</p>
            </div>
            <div className="form-group">
              <label className="form-label">Заметки</label>
              <p>{selectedClient.notes || 'Заметок пока нет'}</p>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-outline"
                onClick={() => setSelectedClient(null)}
              >
                Закрыть
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingClientId(selectedClient.id)
                  setClientForm({
                    fullName: selectedClient.fullName,
                    phone: selectedClient.phone,
                    email: selectedClient.email || '',
                    notes: selectedClient.notes || '',
                  })
                  setSelectedClient(null)
                  setClientError('')
                  setShowClientModal(true)
                }}
              >
                <Pencil size={16} />
                Редактировать
              </button>
            </div>
          </div>
        </div>
      )}      {cropImage && (
        <div
          className="modal-overlay active"
          style={{ zIndex: 1000 }}
          onClick={() => {
            URL.revokeObjectURL(cropImage)
            setCropImage(null)
          }}
        >
          <div
            className="modal"
            style={{ maxWidth: 460 }}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="modal-title">Настройка фотографии</h2>

            <p className="page-subtitle" style={{ marginBottom: 16 }}>
              Перемещай фотографию и настрой масштаб, чтобы выбрать нужную область.
            </p>

            <div style={{
              position: 'relative',
              width: '100%',
              height: 320,
              background: '#222',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
              />
            </div>

            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label">Масштаб</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-outline"
                disabled={uploadingPhoto}
                onClick={() => {
                  URL.revokeObjectURL(cropImage)
                  setCropImage(null)
                }}
              >
                Отмена
              </button>

              <button
                className="btn btn-primary"
                disabled={uploadingPhoto || !croppedAreaPixels}
                onClick={handleSaveCroppedPhoto}
              >
                {uploadingPhoto ? 'Сохранение...' : 'Сохранить фото'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showClientModal && (
        <div
          className="modal-overlay active"
          onClick={() => setShowClientModal(false)}
        >
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2 className="modal-title">Новый клиент</h2>

            <div className="form-group">
              <label className="form-label">Имя клиента *</label>
              <input
                className="form-input"
                placeholder="Например, Анна Иванова"
                value={clientForm.fullName}
                onChange={(event) => setClientForm({ ...clientForm, fullName: event.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Телефон *</label>
              <input
                className="form-input"
                placeholder="+7 (___) ___-__-__"
                value={clientForm.phone}
                onChange={(event) => setClientForm({ ...clientForm, phone: event.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="example@mail.ru"
                value={clientForm.email}
                onChange={(event) => setClientForm({ ...clientForm, email: event.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Заметки</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Дополнительная информация"
                value={clientForm.notes}
                onChange={(event) => setClientForm({ ...clientForm, notes: event.target.value })}
              />
            </div>

            {clientError && (
              <p style={{ color: '#B54545', fontSize: 13 }}>{clientError}</p>
            )}

            <div className="modal-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowClientModal(false)}
                disabled={savingClient}
              >
                Отмена
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveClient}
                disabled={savingClient}
              >
                {savingClient ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App