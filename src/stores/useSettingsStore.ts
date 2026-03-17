import { useState, useContext, createContext, ReactNode, createElement } from 'react'

export type SettingsCategory = 'procedures' | 'areas' | 'products' | 'brands'

type SettingsState = {
  procedures: string[]
  areas: string[]
  products: string[]
  brands: string[]
  addItem: (category: SettingsCategory, item: string) => void
  removeItem: (category: SettingsCategory, item: string) => void
  updateItem: (category: SettingsCategory, oldItem: string, newItem: string) => void
}

const defaultData = {
  procedures: [
    'Toxina Botulínica',
    'Preenchimento com Ácido Hialurônico',
    'Bioestimulador de Colágeno',
    'Fios de PDO',
    'Laser / Tecnologias',
    'Peeling Químico',
    'Microagulhamento',
  ],
  areas: [
    'Fronte',
    'Glabela',
    'Região Periorbicular',
    'Malar',
    'Sulco Nasogeniano',
    'Lábios',
    'Mento',
    'Contorno Mandibular',
    'Pescoço',
    'Papada',
  ],
  products: [
    'Botox®',
    'Dysport®',
    'Xeomin®',
    'Restylane®',
    'Juvederm®',
    'Radiesse®',
    'Sculptra®',
    'Elleva',
    'Lavieen',
  ],
  brands: ['Allergan', 'Galderma', 'Merz', 'Sinclair', 'Mantecorp', 'Rennova'],
}

const SettingsContext = createContext<SettingsState>({} as SettingsState)

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState(defaultData)

  const addItem = (category: SettingsCategory, item: string) => {
    const trimmed = item.trim()
    if (trimmed && !data[category].includes(trimmed)) {
      setData((prev) => ({ ...prev, [category]: [...prev[category], trimmed] }))
    }
  }

  const removeItem = (category: SettingsCategory, item: string) => {
    setData((prev) => ({
      ...prev,
      [category]: prev[category].filter((i) => i !== item),
    }))
  }

  const updateItem = (category: SettingsCategory, oldItem: string, newItem: string) => {
    const trimmed = newItem.trim()
    if (trimmed && trimmed !== oldItem) {
      setData((prev) => ({
        ...prev,
        [category]: prev[category].map((i) => (i === oldItem ? trimmed : i)),
      }))
    }
  }

  return createElement(
    SettingsContext.Provider,
    {
      value: {
        ...data,
        addItem,
        removeItem,
        updateItem,
      },
    },
    children,
  )
}

export default function useSettingsStore() {
  return useContext(SettingsContext)
}
