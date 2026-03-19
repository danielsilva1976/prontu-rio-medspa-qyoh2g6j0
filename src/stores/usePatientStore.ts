import { useState, useContext, createContext, ReactNode, createElement } from 'react'
import { patients as initialPatients } from '@/lib/mock-data'

export type Patient = Omit<(typeof initialPatients)[0], 'procedures'> & {
  avatar?: string
  cpf?: string
  rg?: string
  profissao?: string
  estado_civil?: string
  email?: string
  endereco?: string
  belleId?: string
  procedures: string[]
}

const defaultPatients: Patient[] = initialPatients.map((p, i) => ({
  ...p,
  procedures: p.procedures || [],
  avatar: `https://img.usecurling.com/ppl/thumbnail?gender=female&seed=${i + 10}`,
  cpf: '123.456.789-00', // Mock standard for matching testing
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
        // Strip non-digits for robust CPF comparison to guarantee identity
        const cleanCpf = (c?: string) => c?.replace(/\D/g, '')

        const idx = next.findIndex(
          (p) =>
            (bp.cpf && p.cpf && cleanCpf(p.cpf) === cleanCpf(bp.cpf)) ||
            (bp.belleId && p.belleId === bp.belleId),
        )

        if (idx >= 0) {
          // Merge procedures to keep history intact while updating from Belle
          const mergedProcedures = Array.from(
            new Set([...(next[idx].procedures || []), ...(bp.procedures || [])]),
          )

          next[idx] = {
            ...next[idx],
            ...bp,
            // Preserve existing local edits if Belle data is empty
            endereco: next[idx].endereco || bp.endereco,
            procedures: mergedProcedures,
            // Update nextAppointment strictly from Belle's schedule data if provided
            nextAppointment:
              bp.nextAppointment !== undefined ? bp.nextAppointment : next[idx].nextAppointment,
          }
          updated++
        } else {
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
            lastVisit: bp.lastVisit || new Date().toISOString().split('T')[0],
            nextAppointment: bp.nextAppointment || null,
            status: bp.nextAppointment ? 'scheduled' : 'active',
            procedures: bp.procedures || [],
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
