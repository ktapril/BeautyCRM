import { useEffect, useState } from 'react'
import { getStaff, createStaff, updateStaff, setStaffEnabled } from './services/api'
import type { Staff, StaffRequest } from './services/api'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users,
  Sparkles, BriefcaseBusiness, ChartNoAxesCombined, Settings,
  Sun, Moon, Search, Pencil, Trash2
} from 'lucide-react'
import { getClients, createClient, updateClient, deleteClient, uploadClientPhoto, getMasters, createMaster, updateMaster, deleteMaster, login, register, verifyEmail, logout, getCurrentUser, getAppointments } from './services/api'
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
interface Appointment {
  id: number
  clientId: number
  masterId: number
  serviceName: string
  startTime: string
  endTime: string
  status: string
  notes: string
}
const menu = [
  { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { id: 'calendar', label: 'Календарь', icon: CalendarDays },
  { id: 'schedule', label: 'Записи', icon: ClipboardList },
  { id: 'clients', label: 'Клиенты', icon: Users },
  { id: 'masters', label: 'Мастера', icon: BriefcaseBusiness },
  { id: 'staff', label: 'Сотрудники', icon: Users },
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
  staff: 'Сотрудники',
  services: 'Услуги',
  stats: 'Статистика',
  settings: 'Настройки',
}

function formatRussianPhone(value: string): string {
  const raw = value.trim()
  let digits = raw.replace(/\D/g, '')

  if (raw.startsWith('+7') || (digits.length === 11 && /^[78]/.test(digits))) {
    digits = digits.slice(1)
  }

  digits = digits.slice(0, 10)

  if (!digits) return ''

  let formatted = '+7 (' + digits.slice(0, 3)

  if (digits.length >= 3) formatted += ')'
  if (digits.length > 3) formatted += ' ' + digits.slice(3, 6)
  if (digits.length > 6) formatted += '-' + digits.slice(6, 8)
  if (digits.length > 8) formatted += '-' + digits.slice(8, 10)

  return formatted
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
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [appointmentsError, setAppointmentsError] = useState('')
  const [staff, setStaff] = useState<Staff[]>([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null)
  const [staffForm, setStaffForm] = useState<StaffRequest>({
    fullName: '',
    email: '',
    phone: '+7',
    password: '',
    role: 'MASTER',
    masterId: null,
  })
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
    if (!currentUser || !['OWNER', 'ADMIN'].includes(currentUser.role)) return

    setAppointmentsLoading(true)
    setAppointmentsError('')

    getAppointments()
      .then((data) => setAppointments(data))
      .catch(() => setAppointmentsError('Не удалось загрузить записи'))
      .finally(() => setAppointmentsLoading(false))
  }, [currentUser])

  useEffect(() => {
    if (currentUser?.role !== 'OWNER') return

    setStaffLoading(true)
    setStaffError('')
    getStaff()
      .then((data) => setStaff(data))
      .catch(() => setStaffError('Не удалось загрузить сотрудников'))
      .finally(() => setStaffLoading(false))
  }, [currentUser])
  useEffect(() => {
    document.body.classList.toggle('dark', dark)
    return () => document.body.classList.remove('dark')
  }, [dark])

  useEffect(() => {
    if (!currentUser || !['OWNER', 'ADMIN'].includes(currentUser.role)) return

    let active = true
    let refreshing = false

    const refreshData = async () => {
      if (refreshing || document.visibilityState !== 'visible') return
      refreshing = true

      const tasks: Promise<void>[] = [
        getClients()
          .then((data) => {
            if (active) {
              setClients(data.filter((client: Client) => !client.deleted))
              setError('')
            }
          })
          .catch(() => {
            if (active) setError('Не удалось обновить клиентов')
          }),

        getMasters()
          .then((data) => {
            if (active) {
              setMasters(data.filter((master: Master) => !master.deleted))
              setMasterError('')
            }
          })
          .catch(() => {
            if (active) setMasterError('Не удалось обновить мастеров')
          }),

        getAppointments()
          .then((data) => {
            if (active) {
              setAppointments(data)
              setAppointmentsError('')
            }
          })
          .catch(() => {
            if (active) setAppointmentsError('Не удалось обновить записи')
          }),
      ]

      if (currentUser.role === 'OWNER') {
        tasks.push(
          getStaff()
            .then((data) => {
              if (active) {
                setStaff(data)
                setStaffError('')
              }
            })
            .catch(() => {
              if (active) setStaffError('Не удалось обновить сотрудников')
            })
        )
      }

      try {
        await Promise.all(tasks)
      } finally {
        refreshing = false
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshData()
      }
    }

    const interval = window.setInterval(() => {
      void refreshData()
    }, 10000)

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', refreshData)

    return () => {
      active = false
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', refreshData)
    }
  }, [currentUser])
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
        const updatedStaff = await getStaff()
        setStaff(updatedStaff)
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
  const handleEditStaff = (member: Staff) => {
    setEditingStaffId(member.id)
    setStaffForm({
      fullName: member.fullName,
      email: member.email,
      phone: formatRussianPhone(member.phone || '+7'),
      password: '',
      role: member.role,
      masterId: member.masterId,
    })
    setStaffError('')
    setShowStaffModal(true)
  }

  const handleSaveStaff = async () => {
    const isMaster = staffForm.role === 'MASTER'
    const fullName = (staffForm.fullName || '').trim()
    const email = (staffForm.email || '').trim()
    const phone = (staffForm.phone || '').trim()
    const password = staffForm.password || ''

    if (isMaster && staffForm.masterId === null) {
      setStaffError('Выберите карточку мастера')
      return
    }

    if (!isMaster) {
      if (!fullName || !email || !phone) {
        setStaffError('Заполните ФИО, email и телефон')
        return
      }

      if (fullName.length > 100) {
        setStaffError('ФИО не должно превышать 100 символов')
        return
      }

      const emailParts = email.split('@')
      const emailValid =
        email.length <= 150 &&
        emailParts.length === 2 &&
        emailParts[0].length > 0 &&
        emailParts[0].length <= 64 &&
        emailParts[1].length > 0 &&
        !email.includes('..') &&
        /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/.test(emailParts[0]) &&
        emailParts[1].split('.').every((label) =>
          label.length > 0 &&
          label.length <= 63 &&
          /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label)
        ) &&
        /\.[A-Za-z]{2,}$/.test(emailParts[1])

      if (!emailValid) {
        setStaffError('Введите корректный email, например name@example.com')
        return
      }

      const phoneDigits = phone.replace(/\D/g, '')
      if (phoneDigits.length !== 11 || !phoneDigits.startsWith('7')) {
        setStaffError('Введите полный номер телефона в формате +7 (999) 123-45-67')
        return
      }
    }

    if (editingStaffId === null && password.length < 12) {
      setStaffError('Пароль должен содержать не менее 12 символов')
      return
    }

    if (password && password.length < 12) {
      setStaffError('Пароль должен содержать не менее 12 символов')
      return
    }

    const data: StaffRequest = {
      role: staffForm.role,
      masterId: isMaster ? staffForm.masterId : null,
    }

    if (!isMaster) {
      data.fullName = fullName
      data.email = email
      data.phone = phone
    }

    if (password) {
      data.password = password
    }

    setStaffError('')

    try {
      if (editingStaffId !== null) {
        const updated = await updateStaff(editingStaffId, data)
        setStaff((prev) =>
          prev.map((member) => member.id === updated.id ? updated : member)
        )
      } else {
        const created = await createStaff(data)
        setStaff((prev) => [...prev, created])
      }

      setStaffForm({
        fullName: '',
        email: '',
        phone: '+7',
        password: '',
        role: 'MASTER',
        masterId: null,
      })
      setEditingStaffId(null)
      setShowStaffModal(false)
    } catch (error) {
      setStaffError(
        error instanceof Error ? error.message : 'Не удалось сохранить сотрудника'
      )
    }
  }
  const handleToggleStaffEnabled = async (id: number, enabled: boolean) => {
    setStaffError('')

    try {
      const updated = await setStaffEnabled(id, !enabled)
      setStaff((prev) =>
        prev.map((member) => member.id === updated.id ? updated : member)
      )
    } catch (error) {
      setStaffError(
        error instanceof Error ? error.message : 'Не удалось изменить доступ'
      )
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
          {menu.filter(({ id }) => id !== 'staff' || currentUser?.role === 'OWNER').map(({ id, label, icon: Icon }) => (
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

            {activePage === 'schedule' && (
              <>
                <p className="page-subtitle">
                  Все записи косметологического центра
                </p>

                {appointmentsError && (
                  <p style={{ color: '#B54545' }}>{appointmentsError}</p>
                )}

                {appointmentsLoading ? (
                  <p>Загружаем записи...</p>
                ) : appointmentsError ? null : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Клиент</th>
                          <th>Мастер</th>
                          <th>Услуга</th>
                          <th>Дата и время</th>
                          <th>Статус</th>
                          <th>Примечание</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...appointments]
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((appointment) => {
                            const client = clients.find(
                              (item) => item.id === appointment.clientId
                            )
                            const master = masters.find(
                              (item) => item.id === appointment.masterId
                            )
                            const date = appointment.startTime.replace(
                              /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}).*$/,
                              '$3.$2.$1, $4:$5'
                            )

                            const statusLabels: Record<string, string> = {
                              SCHEDULED: 'Запланирована',
                              COMPLETED: 'Завершена',
                              CANCELED: 'Отменена',
                            }

                            return (
                              <tr key={appointment.id}>
                                <td>{client?.fullName || 'Клиент не найден'}</td>
                                <td>{master?.fullName || 'Мастер не найден'}</td>
                                <td>{appointment.serviceName}</td>
                                <td>{date}</td>
                                <td>{statusLabels[appointment.status] || appointment.status}</td>
                                <td>{appointment.notes || 'Нет'}</td>
                              </tr>
                            )
                          })}
                        {appointments.length === 0 && (
                          <tr>
                            <td colSpan={6}>Записей пока нет</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="page-subtitle" style={{ marginTop: 16 }}>
                  Всего записей: {appointments.length}
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

            {activePage === 'staff' && currentUser?.role === 'OWNER' && (
              <>
                <p className="page-subtitle">
                  Управление аккаунтами администраторов и мастеров
                </p>

                <div style={{ marginBottom: 16 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setStaffForm({
                        fullName: '',
                        email: '',
                        phone: '+7',
                        password: '',
                        role: 'MASTER',
                        masterId: null,
                      })
                      setEditingStaffId(null)
                      setStaffError('')
                      setShowStaffModal(true)
                    }}
                  >
                    <Users size={16} />
                    Добавить сотрудника
                  </button>
                </div>

                {staffError && <p style={{ color: '#B54545' }}>{staffError}</p>}

                {staffLoading ? (
                  <p>Загружаем сотрудников...</p>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Имя</th>
                          <th>Email</th>
                          <th>Телефон</th>
                          <th>Роль</th>
                          <th>Карточка мастера</th>
                          <th>Статус</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staff.map((member) => (
                          <tr key={member.id}>
                            <td>{member.fullName}</td>
                            <td>{member.email}</td>
                            <td>{member.phone || 'Не указан'}</td>
                            <td>{member.role === 'ADMIN' ? 'Администратор' : 'Мастер'}</td>
                            <td>
                              {member.masterId
                                ? masters.find((master) => master.id === member.masterId)?.fullName || 'Карточка не найдена'
                                : 'Не привязана'}
                            </td>
                            <td>{member.enabled ? 'Активен' : 'Отключён'}</td>
                            <td>
                              <button
                                className="btn btn-outline"
                                title="Редактировать"
                                onClick={() => handleEditStaff(member)}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                className="btn btn-outline"
                                title={member.enabled ? 'Отключить' : 'Включить'}
                                onClick={() => handleToggleStaffEnabled(member.id, member.enabled)}
                              >
                                {member.enabled ? 'Отключить' : 'Включить'}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {staff.length === 0 && (
                          <tr>
                            <td colSpan={7}>Сотрудников пока нет</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="page-subtitle" style={{ marginTop: 16 }}>
                  Всего сотрудников: {staff.length}
                </p>
              </>
            )}
            {!['dashboard', 'clients', 'schedule', 'masters', 'staff'].includes(activePage) && (
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
                placeholder="+7 (999) 123-45-67"
                value={masterForm.phone}
                onChange={(event) => setMasterForm({ ...masterForm, phone: formatRussianPhone(event.target.value) })}
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
      {showStaffModal && (
        <div
          className="modal-overlay active"
          onClick={() => setShowStaffModal(false)}
        >
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2 className="modal-title">
              {editingStaffId !== null ? 'Редактировать сотрудника' : 'Новый сотрудник'}
            </h2>

            {staffForm.role === 'ADMIN' && (
              <>
                <div className="form-group">
                  <label className="form-label">ФИО *</label>
                  <input
                    className="form-input"
                    placeholder="Например, Анна Иванова"
                    value={staffForm.fullName || ''}
                    onChange={(event) => setStaffForm({ ...staffForm, fullName: event.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="example@mail.ru"
                    value={staffForm.email || ''}
                    onChange={(event) => setStaffForm({ ...staffForm, email: event.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Телефон *</label>
                  <input
                    className="form-input"
                    placeholder="+7 (999) 123-45-67"
                    value={staffForm.phone || ''}
                    onChange={(event) => setStaffForm({ ...staffForm, phone: formatRussianPhone(event.target.value) })}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Роль *</label>
              <select
                className="form-input"
                value={staffForm.role}
                onChange={(event) => setStaffForm({
                  ...staffForm,
                  role: event.target.value as 'ADMIN' | 'MASTER',
                  masterId: null,
                })}
              >
                <option value="MASTER">Мастер</option>
                <option value="ADMIN">Администратор</option>
              </select>
            </div>

            {staffForm.role === 'MASTER' && (
              <div className="form-group">
                <label className="form-label">Карточка мастера *</label>
                <select
                  className="form-input"
                  value={staffForm.masterId ?? ''}
                  onChange={(event) => setStaffForm({
                    ...staffForm,
                    masterId: event.target.value ? Number(event.target.value) : null,
                  })}
                >
                  <option value="">Выберите карточку мастера</option>
                  {masters
                    .filter((master) => !master.deleted)
                    .map((master) => (
                      <option key={master.id} value={master.id}>
                        {master.fullName}
                      </option>
                    ))}
                </select>
                <p className="page-subtitle">
                  Сначала создайте карточку мастера в разделе «Мастера», если её ещё нет.
                </p>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Пароль {editingStaffId === null ? '*' : '(оставьте пустым, чтобы не менять)'}
              </label>
              <input
                className="form-input"
                type="password"
                autoComplete="new-password"
                placeholder="Минимум 12 символов"
                value={staffForm.password || ''}
                onChange={(event) => setStaffForm({ ...staffForm, password: event.target.value })}
              />
            </div>

            {staffError && (
              <p style={{ color: '#B54545', fontSize: 13 }}>{staffError}</p>
            )}

            <div className="modal-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowStaffModal(false)}
              >
                Отмена
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveStaff}
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
                placeholder="+7 (999) 123-45-67"
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




