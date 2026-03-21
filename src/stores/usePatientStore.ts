import { useState, useEffect, useContext, createContext, ReactNode, createElement } from 'react'

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
  isSyncing: boolean
  setIsSyncing: (val: boolean) => void
  addPatient: (patient: Omit<Patient, 'id'>) => void
  updatePatient: (id: string, data: Partial<Patient>) => void
  syncWithBelle: (belleData: Partial<Patient>[]) => { added: number; updated: number }
  clearPatients: () => void
}

const defaultMockPatients: Patient[] = [
  {
    id: 'mock-1',
    name: 'Ana Clara Silva',
    age: 32,
    dob: '1992-05-10',
    lastVisit: new Date().toISOString().split('T')[0],
    nextAppointment: null,
    status: 'active',
    phone: '(11) 98888-7777',
    procedures: ['Toxina Botulínica'],
    professional: 'Dra. Fabíola',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=1',
  },
  {
    id: 'mock-2',
    name: 'Carlos Mendes',
    age: 45,
    dob: '1979-11-22',
    lastVisit: '2023-12-01',
    nextAppointment: new Date().toISOString().split('T')[0] + 'T14:30:00',
    status: 'scheduled',
    phone: '(11) 97777-6666',
    procedures: ['Preenchimento com Ácido Hialurônico'],
    professional: 'Dra. Sofia',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=2',
  },
  {
    id: 'mock-3',
    name: 'Beatriz Costa',
    age: 28,
    dob: '1996-03-15',
    lastVisit: '2024-01-10',
    nextAppointment: null,
    status: 'active',
    phone: '(11) 96666-5555',
    procedures: ['Peeling Químico'],
    professional: 'Dra. Fabíola',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=3',
  },
]

const PatientContext = createContext<PatientState>({} as PatientState)

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const [isSyncing, setIsSyncing] = useState(false)
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem('@prontuario:patients')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.error('Failed to parse patients from local storage', e)
    }
    return defaultMockPatients
  })

  // Data Persistence: Automatically sync local patient data to localStorage
  useEffect(() => {
    localStorage.setItem('@prontuario:patients', JSON.stringify(patients))
  }, [patients])

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

  const clearPatients = () => setPatients([])

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
    {
      value: {
        patients,
        isSyncing,
        setIsSyncing,
        addPatient,
        updatePatient,
        syncWithBelle,
        clearPatients,
      },
    },
    children,
  )
}

export default function usePatientStore() {
  return useContext(PatientContext)
}
