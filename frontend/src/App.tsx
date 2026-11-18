import { useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users,
  Sparkles, BriefcaseBusiness, ChartNoAxesCombined, Settings,
  Sun, Moon, Search, Pencil, Trash2
} from 'lucide-react'
import { getClients, createClient, updateClient, deleteClient, uploadClientPhoto, getMasters, createMaster, updateMaster, deleteMaster, login, register, verifyEmail, logout, getCurrentUser } from './services/api'
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
type FormErrors = {
  fullName?: string
  phone?: string
  email?: string
  specialization?: string
  notes?: string
}

function validateForm(
  form: { fullName: string; phone: string; email: string },
  phoneRequired: boolean
): FormErrors {
  const errors: FormErrors = {}
  const name = form.fullName.trim()
  const phone = form.phone.trim()
  const email = form.email.trim()

  if (!name) {
    errors.fullName = 'Укажи имя'
  } else if (name.length < 2 || name.length > 60) {
    errors.fullName = 'Имя должно содержать от 2 до 60 символов'
  } else if (!/^[\p{L}\s.'’-]+$/u.test(name)) {
    errors.fullName = 'Используй только буквы, пробелы и дефис'
  }

  if (!phone && phoneRequired) {
    errors.phone = 'Укажи телефон'
  } else if (phone) {
    const digits = phone.replace(/\D/g, '')
    const validLength = digits.length === 10 ||
      (digits.length === 11 && /^[78]/.test(digits))

    if (!/^[+\d()\s-]+$/.test(phone) || !validLength) {
      errors.phone = 'Введи корректный российский номер'
    }
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = 'Проверь формат почты'
  }

  return errors
}
function App() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser())
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authForm, setAuthForm] = useState({ fullName: '', phone: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (window.location.pathname === '/verify-email' && token) {
      verifyEmail(token)
        .then(setAuthMessage)
        .catch((error) => setAuthError(error.message))
        .finally(() => window.history.replaceState({}, '', '/'))
    }
  }, [])

  const handleAuth = async () => {
    setAuthError('')
    setAuthMessage('')
    setAuthLoading(true)

    try {
      if (authMode === 'register') {
        const message = await register(authForm)
        setAuthMessage(message)
        setAuthMode('login')
      } else {
        const user = await login({
          email: authForm.email,
          password: authForm.password,
        })
        setCurrentUser(user)
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Ошибка авторизации')
    } finally {
      setAuthLoading(false)
    }
  }
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
  const [masters, setMasters] = useState<Master[]>([])
  const [mastersLoading, setMastersLoading] = useState(false)
  const [masterError, setMasterError] = useState('')
  const [showMasterModal, setShowMasterModal] = useState(false)
  const [editingMasterId, setEditingMasterId] = useState<number | null>(null)
  const [masterForm, setMasterForm] = useState({ fullName: '', specialization: '', phone: '', email: '' })
  const [clientFieldErrors, setClientFieldErrors] = useState<FormErrors>({})
  const [masterFieldErrors, setMasterFieldErrors] = useState<FormErrors>({})
  const [savingClient, setSavingClient] = useState(false)
  const [clientError, setClientError] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [cropImage, setCropImage] = useState<string | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  useEffect(() => {
    if (!currentUser || !['OWNER', 'ADMIN'].includes(currentUser.role)) {
      setLoading(false)
      return
    }

    getClients()
      .then((data) => setClients(data.filter((client: Client) => !client.deleted)))
      .catch(() => setError('Не удалось загрузить клиентов'))
      .finally(() => setLoading(false))
  }, [currentUser])

  useEffect(() => {
    if (!currentUser || !['OWNER', 'ADMIN'].includes(currentUser.role)) return

    setMastersLoading(true)
    getMasters()
      .then((data) => setMasters(data.filter((master: Master) => !master.deleted)))
      .catch(() => setMasterError('Не удалось загрузить мастеров'))
      .finally(() => setMastersLoading(false))
  }, [currentUser])

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
    return () => document.body.classList.remove('dark')
  }, [dark])

  const handleSaveClient = async () => {
    const validationErrors = validateForm(clientForm, true)

    if (clientForm.notes.trim().length > 1000) {
      validationErrors.notes = 'Не более 1000 символов'
    }

    setClientFieldErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

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
      setClientFieldErrors({})
      setEditingClientId(null)
      setShowClientModal(false)
    } catch {
      setClientError('Не удалось сохранить клиента. Попробуй ещё раз.')
    } finally {
      setSavingClient(false)
    }
  }
  const handleEditMaster = (master: Master) => {
    setEditingMasterId(master.id)
    setMasterForm({
      fullName: master.fullName,
      specialization: master.specialization || '',
      phone: master.phone || '',
      email: master.email || '',
    })
    setMasterError('')
    setShowMasterModal(true)
  }

  const handleDeleteMaster = async (id: number) => {
    if (!window.confirm('Удалить мастера?')) return

    try {
      await deleteMaster(id)
      setMasters((prev) => prev.filter((master) => master.id !== id))
    } catch {
      setMasterError('Не удалось удалить мастера')
    }
  }
  const handleSaveMaster = async () => {
    const validationErrors = validateForm(masterForm, false)

    if (masterForm.specialization.trim().length > 100) {
      validationErrors.specialization = 'Не более 100 символов'
    }

    setMasterFieldErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setMasterError('')

    const data = {
      fullName: masterForm.fullName.trim(),
      specialization: masterForm.specialization.trim(),
      phone: masterForm.phone.trim(),
      email: masterForm.email.trim(),
    }

    try {
      if (editingMasterId !== null) {
        const updatedMaster = await updateMaster(editingMasterId, data)
        setMasters((prev) => prev.map((master) =>
          master.id === editingMasterId ? updatedMaster : master
        ))
      } else {
        const newMaster = await createMaster(data)
        setMasters((prev) => [...prev, newMaster])
      }

      setMasterForm({ fullName: '', specialization: '', phone: '', email: '' })
      setMasterFieldErrors({})
      setEditingMasterId(null)
      setShowMasterModal(false)
    } catch {
      setMasterError('Не удалось сохранить мастера')
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

  if (!currentUser) {
    return (
      <div className="auth-screen">
        <form className="auth-card" onSubmit={(event) => { event.preventDefault(); handleAuth() }}>
          <div className="auth-logo"><Sparkles size={24} /></div>
          <h1>Ангельский лик</h1>
          <p className="auth-subtitle">Beauty CRM</p>

          <div className="auth-tabs">
            <button type="button" className={authMode === 'login' ? 'selected' : ''} onClick={() => { setAuthMode('login'); setAuthError(''); setAuthMessage('') }}>Вход</button>
            <button type="button" className={authMode === 'register' ? 'selected' : ''} onClick={() => { setAuthMode('register'); setAuthError(''); setAuthMessage('') }}>Регистрация</button>
          </div>

          {authMode === 'register' && (
            <>
              <label>Ваше имя</label>
              <input required value={authForm.fullName} onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })} placeholder="Имя и фамилия" />
              <label>Телефон</label>
              <input required value={authForm.phone} onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })} placeholder="+7..." />
            </>
          )}

          <label>Email</label>
          <input required type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="example@mail.com" />

          <label>Пароль</label>
          <input required type="password" minLength={8} maxLength={72} value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="Минимум 8 символов" />

          {authError && <p className="auth-error">{authError}</p>}
          {authMessage && <p className="auth-message">{authMessage}</p>}

          <button className="auth-submit" type="submit" disabled={authLoading}>
            {authLoading ? 'Подождите...' : authMode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>
      </div>
    )
  }

  if (!['OWNER', 'ADMIN'].includes(currentUser.role)) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-logo"><Sparkles size={24} /></div>
          <h1>Здравствуйте, {currentUser.fullName}!</h1>
          <p className="auth-subtitle">Личный кабинет для вашей роли пока находится в разработке.</p>
          <button className="auth-submit" onClick={() => { logout(); setCurrentUser(null) }}>Выйти</button>
        </div>
      </div>
    )
  }
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
          <span className="header-user">{currentUser.fullName}</span><button className="icon-btn" onClick={() => { logout(); setCurrentUser(null) }}>Выйти</button>
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

            {activePage === 'masters' && (
              <>
                <p className="page-subtitle">
                  Список сотрудников косметологического центра
                </p>

                <div style={{ marginBottom: 16 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setMasterForm({ fullName: '', specialization: '', phone: '', email: '' })
                      setEditingMasterId(null)
                      setMasterError('')
                      setShowMasterModal(true)
                    }}
                  >
                    <Users size={16} />
                    Добавить мастера
                  </button>
                </div>

                {masterError && <p style={{ color: '#B54545' }}>{masterError}</p>}

                {mastersLoading ? (
                  <p>Загружаем мастеров...</p>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Имя мастера</th>
                          <th>Специализация</th>
                          <th>Телефон</th>
                          <th>Email</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {masters.map((master) => (
                          <tr key={master.id}>
                            <td>{master.fullName}</td>
                            <td>{master.specialization || 'Не указана'}</td>
                            <td>{master.phone || 'Не указан'}</td>
                            <td>{master.email || 'Не указан'}</td>
                            <td>
                              <button
                                className="btn btn-outline"
                                title="Редактировать"
                                onClick={() => handleEditMaster(master)}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                className="btn btn-outline"
                                title="Удалить"
                                onClick={() => handleDeleteMaster(master.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {masters.length === 0 && (
                          <tr>
                            <td colSpan={5}>Мастеров пока нет</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="page-subtitle" style={{ marginTop: 16 }}>
                  Всего мастеров: {masters.length}
                </p>
              </>
            )}

            {!['dashboard', 'clients', 'masters'].includes(activePage) && (
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
      {showMasterModal && (
        <div
          className="modal-overlay active"
          onClick={() => setShowMasterModal(false)}
        >
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2 className="modal-title">
              {editingMasterId !== null ? 'Редактировать мастера' : 'Новый мастер'}
            </h2>

            <div className="form-group">
              <label className="form-label">Имя мастера *</label>
              <input
                className="form-input"
                placeholder="Например, Анна Иванова"
                value={masterForm.fullName}
                onChange={(event) => setMasterForm({ ...masterForm, fullName: event.target.value })}
              />
                { masterFieldErrors.fullName && <p style={{ color: '#B54545', fontSize: 12, marginTop: 5 }}>{masterFieldErrors.fullName}</p> }
            </div>

            <div className="form-group">
              <label className="form-label">Специализация</label>
              <input
                className="form-input"
                placeholder="Например, косметолог"
                value={masterForm.specialization}
                onChange={(event) => setMasterForm({ ...masterForm, specialization: event.target.value })}
              />
                { masterFieldErrors.specialization && <p style={{ color: '#B54545', fontSize: 12, marginTop: 5 }}>{masterFieldErrors.specialization}</p> }
            </div>

            <div className="form-group">
              <label className="form-label">Телефон</label>
              <input
                className="form-input"
                placeholder="+7 (___) ___-__-__"
                value={masterForm.phone}
                onChange={(event) => setMasterForm({ ...masterForm, phone: event.target.value })}
              />
                { masterFieldErrors.phone && <p style={{ color: '#B54545', fontSize: 12, marginTop: 5 }}>{masterFieldErrors.phone}</p> }
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="example@mail.ru"
                value={masterForm.email}
                onChange={(event) => setMasterForm({ ...masterForm, email: event.target.value })}
              />
                { masterFieldErrors.email && <p style={{ color: '#B54545', fontSize: 12, marginTop: 5 }}>{masterFieldErrors.email}</p> }
            </div>

            {masterError && (
              <p style={{ color: '#B54545', fontSize: 13 }}>{masterError}</p>
            )}

            <div className="modal-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowMasterModal(false)}
              >
                Отмена
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveMaster}
              >
                Сохранить
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
                { clientFieldErrors.fullName && <p style={{ color: '#B54545', fontSize: 12, marginTop: 5 }}>{clientFieldErrors.fullName}</p> }
            </div>

            <div className="form-group">
              <label className="form-label">Телефон *</label>
              <input
                className="form-input"
                placeholder="+7 (___) ___-__-__"
                value={clientForm.phone}
                onChange={(event) => setClientForm({ ...clientForm, phone: event.target.value })}
              />
                { clientFieldErrors.phone && <p style={{ color: '#B54545', fontSize: 12, marginTop: 5 }}>{clientFieldErrors.phone}</p> }
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
                { clientFieldErrors.email && <p style={{ color: '#B54545', fontSize: 12, marginTop: 5 }}>{clientFieldErrors.email}</p> }
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
                { clientFieldErrors.notes && <p style={{ color: '#B54545', fontSize: 12, marginTop: 5 }}>{clientFieldErrors.notes}</p> }
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