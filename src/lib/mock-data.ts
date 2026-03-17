const today = new Date()
const y = today.getFullYear()
const m = String(today.getMonth() + 1).padStart(2, '0')
const d = String(today.getDate()).padStart(2, '0')
const todayStr = `${y}-${m}-${d}`

const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
const ty = tomorrow.getFullYear()
const tm = String(tomorrow.getMonth() + 1).padStart(2, '0')
const td = String(tomorrow.getDate()).padStart(2, '0')
const tomorrowStr = `${ty}-${tm}-${td}`

export const patients = [
  {
    id: 'p-001',
    name: 'Isabella Rodrigues',
    age: 34,
    dob: '1989-05-12',
    lastVisit: '2023-09-15',
    nextAppointment: `${todayStr}T10:00:00`,
    status: 'scheduled',
    phone: '(11) 98765-4321',
    procedures: ['Toxina Botulínica', 'Bioestimulador'],
  },
  {
    id: 'p-002',
    name: 'Carolina Mendes Costa',
    age: 42,
    dob: '1981-10-02',
    lastVisit: '2023-10-02',
    nextAppointment: `${todayStr}T11:30:00`,
    status: 'scheduled',
    phone: '(11) 99876-5432',
    procedures: ['Preenchimento Labial', 'Laser Lavieen'],
  },
  {
    id: 'p-003',
    name: 'Marina Silva Fontes',
    age: 28,
    dob: '1995-08-20',
    lastVisit: '2023-08-20',
    nextAppointment: `${tomorrowStr}T14:00:00`,
    status: 'scheduled',
    phone: '(11) 91234-5678',
    procedures: ['Peeling Químico'],
  },
  {
    id: 'p-004',
    name: 'Juliana Carvalho',
    age: 45,
    dob: '1978-11-01',
    lastVisit: '2023-11-01',
    nextAppointment: `${tomorrowStr}T15:30:00`,
    status: 'scheduled',
    phone: '(11) 97777-8888',
    procedures: ['MMP', 'Toxina Botulínica'],
  },
  {
    id: 'p-005',
    name: 'Roberto Alvarez',
    age: 50,
    dob: '1973-06-10',
    lastVisit: '2023-06-10',
    nextAppointment: null,
    status: 'inactive',
    phone: '(11) 96666-5555',
    procedures: ['Transplante Capilar - Acompanhamento'],
  },
]

export const mockDashboardStats = {
  scheduledToday: 8,
  completedRecords: 3,
  newPatients: 2,
}
