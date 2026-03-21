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

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  // Start with an empty list to strictly rely on real data synchronization
  const [patients, setPatients] = useState<Patient[]>([])

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
    // Purge existing local data and replace entirely with fresh payload from Belle API
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
