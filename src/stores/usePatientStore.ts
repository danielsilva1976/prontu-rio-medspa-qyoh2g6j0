import { useState, useContext, createContext, ReactNode, createElement } from 'react'

export type Patient = {
  id: string
  name: string
  age: number
  dob: string
  lastVisit: string
  nextAppointment: string | null
  status: string
  phone: string
  procedures: string[]
  professional: string | null
  avatar?: string
  cpf?: string
  rg?: string
  profissao?: string
  estado_civil?: string
  email?: string
  endereco?: string
  history?: string
  belleId?: string
}

type PatientState = {
  patients: Patient[]
  addPatient: (patient: Omit<Patient, 'id'>) => void
  updatePatient: (id: string, data: Partial<Patient>) => void
  syncWithBelle: (belleData: Partial<Patient>[]) => { added: number; updated: number }
}

const PatientContext = createContext<PatientState>({} as PatientState)

// Start with mock data that will be eliminated upon proxy synchronization
const initialMockPatients: Patient[] = [
  {
    id: 'mock-1',
    name: 'Maria Fernanda Silva (Dados Fictícios)',
    age: 34,
    phone: '(11) 98765-4321',
    dob: '1990-05-15',
    lastVisit: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
    nextAppointment: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    status: 'scheduled',
    procedures: ['Toxina Botulínica'],
    professional: 'Dra. Fabíola Kleinert',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=101',
  },
  {
    id: 'mock-2',
    name: 'João Pedro Costa (Dados Fictícios)',
    age: 42,
    phone: '(11) 91234-5678',
    dob: '1982-10-20',
    lastVisit: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0],
    nextAppointment: null,
    status: 'active',
    procedures: ['Laser Fotona'],
    professional: 'Dra. Fabíola Kleinert',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=102',
  },
  {
    id: 'mock-3',
    name: 'Ana Luiza Souza (Dados Fictícios)',
    age: 28,
    phone: '(11) 99999-8888',
    dob: '1996-03-08',
    lastVisit: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    nextAppointment: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
    status: 'scheduled',
    procedures: ['Preenchimento Labial'],
    professional: 'Dra. Sofia Mendes',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=103',
  },
]

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>(initialMockPatients)

  const addPatient = (patient: Omit<Patient, 'id'>) => {
    const newPatient = {
      ...patient,
      id: `p-${Date.now()}`,
    } as Patient
    setPatients((prev) => [...prev, newPatient])
  }

  const updatePatient = (id: string, data: Partial<Patient>) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
  }

  const syncWithBelle = (belleData: Partial<Patient>[]) => {
    // Purge existing local/mock data and replace entirely with fresh payload from Belle API
    const freshPatients: Patient[] = belleData.map((bp, i) => {
      let age = bp.age || 30
      if (bp.dob) {
        const birth = new Date(bp.dob)
        if (!isNaN(birth.getTime())) {
          const diff = Date.now() - birth.getTime()
          age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
        }
      }

      return {
        id: bp.belleId ? String(bp.belleId) : `p-belle-${Date.now()}-${i}`,
        name: bp.name || 'Sem Nome',
        age,
        phone: bp.phone || '',
        dob: bp.dob || '1990-01-01',
        lastVisit: bp.lastVisit || new Date().toISOString().split('T')[0],
        nextAppointment: bp.nextAppointment || null,
        status: bp.nextAppointment ? 'scheduled' : 'active',
        procedures: bp.procedures || [],
        professional: bp.professional || null,
        avatar:
          bp.avatar || `https://img.usecurling.com/ppl/thumbnail?gender=female&seed=${i + 10}`,
        cpf: bp.cpf || '',
        rg: bp.rg || '',
        profissao: bp.profissao || '',
        estado_civil: bp.estado_civil || '',
        email: bp.email || '',
        endereco: bp.endereco || '',
        history: bp.history || '',
        belleId: bp.belleId,
      } as Patient
    })

    setPatients(freshPatients)
    return { added: freshPatients.length, updated: 0 }
  }

  return createElement(
    PatientContext.Provider,
    { value: { patients, addPatient, updatePatient, syncWithBelle } },
    children,
  )
}

export default function usePatientStore() {
  return useContext(PatientContext)
}
