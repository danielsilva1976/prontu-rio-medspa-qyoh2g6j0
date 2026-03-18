import { useState, useContext, createContext, ReactNode, createElement } from 'react'
import { patients as initialPatients } from '@/lib/mock-data'

export type Patient = (typeof initialPatients)[0] & {
  avatar?: string
  cpf?: string
  rg?: string
  profissao?: string
  estado_civil?: string
  email?: string
  endereco?: string
  belleId?: string
}

const defaultPatients: Patient[] = initialPatients.map((p, i) => ({
  ...p,
  avatar: `https://img.usecurling.com/ppl/thumbnail?gender=female&seed=${i + 10}`,
  cpf: '123.456.789-00', // Assigning standard mock CPF for matching
  rg: '12.345.678-9',
  profissao: i % 2 === 0 ? 'Engenheira' : 'Professora',
  estado_civil: 'Solteira',
  email: `paciente${i}@email.com`,
  endereco: 'Rua das Flores, 123 - São Paulo/SP',
}))

type PatientState = {
  patients: Patient[]
  addPatient: (patient: Omit<Patient, 'id'>) => void
  updatePatient: (id: string, data: Partial<Patient>) => void
  syncWithBelle: (belleData: Partial<Patient>[]) => { added: number; updated: number }
}

const PatientContext = createContext<PatientState>({} as PatientState)

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>(defaultPatients)

  const addPatient = (patient: Omit<Patient, 'id'>) => {
    const newPatient = {
      ...patient,
      id: `p-${Date.now()}`,
    }
    setPatients((prev) => [...prev, newPatient])
  }

  const updatePatient = (id: string, data: Partial<Patient>) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
  }

  const syncWithBelle = (belleData: Partial<Patient>[]) => {
    let added = 0
    let updated = 0
    setPatients((prev) => {
      const next = [...prev]
      belleData.forEach((bp) => {
        // Strip non-digits for robust CPF comparison
        const cleanCpf = (c?: string) => c?.replace(/\D/g, '')

        // Deduplicate primarily by CPF
        const idx = next.findIndex((p) => bp.cpf && p.cpf && cleanCpf(p.cpf) === cleanCpf(bp.cpf))

        if (idx >= 0) {
          next[idx] = { ...next[idx], ...bp }
          updated++
        } else {
          // Calculate age from DOB if possible
          let age = bp.age || 30
          if (bp.dob) {
            const birth = new Date(bp.dob)
            if (!isNaN(birth.getTime())) {
              const diff = Date.now() - birth.getTime()
              age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
            }
          }

          next.push({
            id: `p-belle-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: bp.name || 'Sem Nome',
            age,
            phone: bp.phone || '',
            dob: bp.dob || '1990-01-01',
            lastVisit: new Date().toISOString().split('T')[0],
            nextAppointment: null,
            status: 'active',
            procedures: [],
            professional: null,
            ...bp,
          })
          added++
        }
      })
      return next
    })
    return { added, updated }
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
