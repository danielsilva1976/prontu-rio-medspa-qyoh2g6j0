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
}

const defaultPatients: Patient[] = initialPatients.map((p, i) => ({
  ...p,
  avatar: `https://img.usecurling.com/ppl/thumbnail?gender=female&seed=${i + 10}`,
  cpf: '123.456.789-00',
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

  return createElement(
    PatientContext.Provider,
    { value: { patients, addPatient, updatePatient } },
    children,
  )
}

export default function usePatientStore() {
  return useContext(PatientContext)
}
