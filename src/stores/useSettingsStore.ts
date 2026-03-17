import { useState, useContext, createContext, ReactNode, createElement } from 'react'

export type SettingsCategory = 'procedures' | 'areas' | 'products' | 'brands' | 'technologies'

type SettingsState = {
  procedures: string[]
  areas: string[]
  products: string[]
  brands: string[]
  technologies: string[]
  prices: Record<string, string>
  addItem: (category: SettingsCategory, item: string, price?: string) => void
  removeItem: (category: SettingsCategory, item: string) => void
  updateItem: (category: SettingsCategory, oldItem: string, newItem: string, price?: string) => void
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
  technologies: [
    'Ultraformer III',
    'Ultraformer MPT',
    'Lavieen',
    'Fotona',
    'Soprano Ice',
    'Zye AL',
    'Luz Pulsada (LIP)',
    'Radiofrequência',
  ],
  prices: {
    'Toxina Botulínica': '1200',
    'Preenchimento com Ácido Hialurônico': '1500',
    'Bioestimulador de Colágeno': '2500',
    'Fios de PDO': '800',
    'Laser / Tecnologias': '1000',
    'Peeling Químico': '350',
    Microagulhamento: '450',
    'Ultraformer III': '3000',
    'Ultraformer MPT': '4000',
    Lavieen: '1200',
    Fotona: '2500',
    'Soprano Ice': '600',
    'Zye AL': '800',
    'Luz Pulsada (LIP)': '450',
    Radiofrequência: '300',
  } as Record<string, string>,
}

const SettingsContext = createContext<SettingsState>({} as SettingsState)

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState(defaultData)

  const addItem = (category: SettingsCategory, item: string, price?: string) => {
    const trimmed = item.trim()
    if (trimmed && !data[category].includes(trimmed)) {
      setData((prev) => ({
        ...prev,
        [category]: [...prev[category], trimmed],
        prices: price ? { ...prev.prices, [trimmed]: price } : prev.prices,
      }))
    }
  }

  const removeItem = (category: SettingsCategory, item: string) => {
    setData((prev) => {
      const newPrices = { ...prev.prices }
      delete newPrices[item]
      return {
        ...prev,
        [category]: prev[category].filter((i) => i !== item),
        prices: newPrices,
      }
    })
  }

  const updateItem = (
    category: SettingsCategory,
    oldItem: string,
    newItem: string,
    price?: string,
  ) => {
    const trimmed = newItem.trim()
    if (trimmed && trimmed !== oldItem) {
      setData((prev) => {
        const newPrices = { ...prev.prices }
        delete newPrices[oldItem]
        if (price) {
          newPrices[trimmed] = price
        }
        return {
          ...prev,
          [category]: prev[category].map((i) => (i === oldItem ? trimmed : i)),
          prices: newPrices,
        }
      })
    } else if (trimmed === oldItem) {
      setData((prev) => {
        const newPrices = { ...prev.prices }
        if (price) {
          newPrices[trimmed] = price
        } else {
          delete newPrices[trimmed]
        }
        return {
          ...prev,
          prices: newPrices,
        }
      })
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
