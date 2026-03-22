import { useState, useContext, createContext, ReactNode, createElement } from 'react'

export type SettingsCategory = 'procedures' | 'areas' | 'products' | 'brands' | 'technologies'

type BelleConfig = {
  url: string
  token: string
  estabelecimento: string
  webhookContentType?:
    | 'application/x-www-form-urlencoded'
    | 'multipart/form-data'
    | 'application/json'
  lastSync?: string
  lastSyncStatus?: 'success' | 'error'
}

type SettingsState = {
  procedures: string[]
  areas: string[]
  products: string[]
  brands: string[]
  technologies: string[]
  prices: Record<string, string>
  belleSoftware: BelleConfig
  addItem: (category: SettingsCategory, item: string, price?: string) => void
  removeItem: (category: SettingsCategory, item: string) => void
  updateItem: (category: SettingsCategory, oldItem: string, newItem: string, price?: string) => void
  updateBelleConfig: (
    url: string,
    token: string,
    estabelecimento?: string,
    contentType?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'application/json',
  ) => void
  setBelleLastSync: (status: 'success' | 'error', date: string) => void
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
  areas: ['Fronte', 'Glabela', 'Região Periorbicular', 'Malar', 'Lábios', 'Mento', 'Pescoço'],
  products: ['Botox®', 'Dysport®', 'Restylane®', 'Juvederm®', 'Radiesse®', 'Sculptra®', 'Lavieen'],
  brands: ['Allergan', 'Galderma', 'Merz', 'Sinclair', 'Mantecorp', 'Rennova'],
  technologies: ['Ultraformer III', 'Ultraformer MPT', 'Lavieen', 'Fotona', 'Luz Pulsada (LIP)'],
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
    'Luz Pulsada (LIP)': '450',
  } as Record<string, string>,
  belleSoftware: {
    url: 'https://app.bellesoftware.com.br/api/release/controller/IntegracaoExterna/v1.0/cliente/listar',
    token: '1787cad7ac7dd71ac2fbbdaf823928fd',
    estabelecimento: '1',
    webhookContentType: 'application/json' as const,
  },
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
      return { ...prev, [category]: prev[category].filter((i) => i !== item), prices: newPrices }
    })
  }

  const updateItem = (cat: SettingsCategory, old: string, newVal: string, price?: string) => {
    const trimmed = newVal.trim()
    if (trimmed && trimmed !== old) {
      setData((prev) => {
        const newPrices = { ...prev.prices }
        delete newPrices[old]
        if (price) newPrices[trimmed] = price
        return {
          ...prev,
          [cat]: prev[cat].map((i) => (i === old ? trimmed : i)),
          prices: newPrices,
        }
      })
    } else if (trimmed === old) {
      setData((prev) => {
        const newPrices = { ...prev.prices }
        if (price) newPrices[trimmed] = price
        else delete newPrices[trimmed]
        return { ...prev, prices: newPrices }
      })
    }
  }

  const updateBelleConfig = (
    url: string,
    token: string,
    estabelecimento: string = '',
    contentType:
      | 'application/x-www-form-urlencoded'
      | 'multipart/form-data'
      | 'application/json' = 'application/json',
  ) => {
    setData((prev) => ({
      ...prev,
      belleSoftware: {
        ...prev.belleSoftware,
        url,
        token,
        estabelecimento,
        webhookContentType: contentType,
      },
    }))
  }

  const setBelleLastSync = (status: 'success' | 'error', date: string) => {
    setData((prev) => ({
      ...prev,
      belleSoftware: { ...prev.belleSoftware, lastSyncStatus: status, lastSync: date },
    }))
  }

  return createElement(
    SettingsContext.Provider,
    { value: { ...data, addItem, removeItem, updateItem, updateBelleConfig, setBelleLastSync } },
    children,
  )
}

export default function useSettingsStore() {
  return useContext(SettingsContext)
}
