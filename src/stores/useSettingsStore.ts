import { useState, useContext, createContext, ReactNode, createElement } from 'react'

type SettingsState = {
  procedures: string[]
  addProcedure: (procedure: string) => void
  removeProcedure: (procedure: string) => void
}

const defaultProcedures = [
  'Toxina Botulínica',
  'Preenchimento com Ácido Hialurônico',
  'Bioestimulador de Colágeno',
  'Fios de PDO',
  'Laser / Tecnologias',
  'Peeling Químico',
  'Microagulhamento',
]

const defaultState: SettingsState = {
  procedures: defaultProcedures,
  addProcedure: () => {},
  removeProcedure: () => {},
}

const SettingsContext = createContext<SettingsState>(defaultState)

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [procedures, setProcedures] = useState<string[]>(defaultProcedures)

  const addProcedure = (procedure: string) => {
    const trimmed = procedure.trim()
    if (trimmed && !procedures.includes(trimmed)) {
      setProcedures((prev) => [...prev, trimmed])
    }
  }

  const removeProcedure = (procedure: string) => {
    setProcedures((prev) => prev.filter((p) => p !== procedure))
  }

  return createElement(
    SettingsContext.Provider,
    {
      value: {
        procedures,
        addProcedure,
        removeProcedure,
      },
    },
    children,
  )
}

export default function useSettingsStore() {
  return useContext(SettingsContext)
}
