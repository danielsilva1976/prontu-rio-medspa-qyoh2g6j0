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
  rua?: string
  numeroRua?: string
  bairro?: string
  cidade?: string
  uf?: string
  cep?: string
  temperatura?: string
  classificacao?: string
  sexo?: string
  rating?: string
  tags?: string[]
}

type PatientState = {
  patients: Patient[]
  isSyncing: boolean
  setIsSyncing: (val: boolean) => void
  addPatient: (patient: Patient | Omit<Patient, 'id'>) => void
  updatePatient: (id: string, data: Partial<Patient>) => void
  syncWithBelle: (belleData: Partial<Patient>[]) => { added: number; updated: number }
  clearPatients: () => void
}

const defaultInitialPatients: Patient[] = []

const PatientContext = createContext<PatientState>({} as PatientState)

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const [isSyncing, setIsSyncing] = useState(false)
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem('@prontuario:patients')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.length > 0) {
          // Strictly filter out any remnants of legacy mock data
          const realPatients = parsed.filter((p: Patient) => !p.id.startsWith('mock-'))
          return realPatients
        }
      }
    } catch (e) {
      console.error('Failed to parse patients from local storage', e)
    }
    return defaultInitialPatients
  })

  useEffect(() => {
    localStorage.setItem('@prontuario:patients', JSON.stringify(patients))
  }, [patients])

  const addPatient = (patient: any) => {
    const newPatient = {
      ...patient,
      id: patient.id || `p-${Date.now()}`,
    } as Patient
    setPatients((prev) => [...prev, newPatient])
  }

  const updatePatient = (id: string, data: Partial<Patient>) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
  }

  const clearPatients = () => setPatients([])

  const syncWithBelle = (belleData: Partial<Patient>[]) => {
    // Pure synchronization mapping - completely replaces previous data to ensure persistence integrity
    const freshPatients: Patient[] = belleData.map((bp, i) => {
      let age = bp.age || 0
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
        dob: bp.dob || '',
        lastVisit: bp.lastVisit || '',
        nextAppointment: bp.nextAppointment || null,
        status: bp.status || (bp.nextAppointment ? 'scheduled' : 'active'),
        procedures: bp.procedures || [],
        professional: bp.professional || null,
        avatar: bp.avatar || undefined, // Replaced mock avatar logic with undefined/real data
        cpf: bp.cpf || '',
        rg: bp.rg || '',
        profissao: bp.profissao || '',
        estado_civil: bp.estado_civil || '',
        email: bp.email || '',
        endereco: bp.endereco || '',
        history: bp.history || '',
        belleId: bp.belleId,
        rua: bp.rua || '',
        numeroRua: bp.numeroRua || '',
        bairro: bp.bairro || '',
        cidade: bp.cidade || '',
        uf: bp.uf || '',
        cep: bp.cep || '',
        temperatura: bp.temperatura || '',
        classificacao: bp.classificacao || '',
        sexo: bp.sexo || '',
        rating: bp.rating || '',
        tags: bp.tags || [],
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
