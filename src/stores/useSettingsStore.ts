import { useState, useContext, createContext, ReactNode, createElement, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'

export type SettingsCategory = 'procedures' | 'areas' | 'products' | 'brands' | 'technologies'

type BelleConfig = {
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
    estabelecimento: '1',
    webhookContentType: 'application/json' as const,
  },
}

const SettingsContext = createContext<SettingsState>({} as SettingsState)

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState(defaultData)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (!pb.authStore.isValid) return
        const record = await pb
          .collection('app_settings')
          .getFirstListItem('key="procedures_config"')
        if (record && record.value) {
          const parsed = JSON.parse(record.value)
          setData((prev) => ({ ...prev, ...parsed }))
        }
      } catch (e) {
        // Ignorar se não existir
      } finally {
        setIsLoaded(true)
      }
    }
    loadSettings()
  }, [])

  const saveToBackend = async (newData: any) => {
    try {
      if (!pb.authStore.isValid) return
      const payload = {
        procedures: newData.procedures,
        areas: newData.areas,
        products: newData.products,
        brands: newData.brands,
        technologies: newData.technologies,
        prices: newData.prices,
        belleSoftware: newData.belleSoftware,
      }

      let record
      try {
        record = await pb.collection('app_settings').getFirstListItem('key="procedures_config"')
      } catch (e) {}

      if (record) {
        await pb.collection('app_settings').update(record.id, { value: JSON.stringify(payload) })
      } else {
        await pb
          .collection('app_settings')
          .create({ key: 'procedures_config', value: JSON.stringify(payload) })
      }
    } catch (e) {
      console.error('Erro ao salvar configurações', e)
    }
  }

  const addItem = (category: SettingsCategory, item: string, price?: string) => {
    const trimmed = item.trim()
    if (trimmed && !data[category].includes(trimmed)) {
      setData((prev) => {
        const newData = {
          ...prev,
          [category]: [...prev[category], trimmed],
          prices: price ? { ...prev.prices, [trimmed]: price } : prev.prices,
        }
        saveToBackend(newData)
        return newData
      })
    }
  }

  const removeItem = (category: SettingsCategory, item: string) => {
    setData((prev) => {
      const newPrices = { ...prev.prices }
      delete newPrices[item]
      const newData = {
        ...prev,
        [category]: prev[category].filter((i) => i !== item),
        prices: newPrices,
      }
      saveToBackend(newData)
      return newData
    })
  }

  const updateItem = (cat: SettingsCategory, old: string, newVal: string, price?: string) => {
    const trimmed = newVal.trim()
    if (trimmed && trimmed !== old) {
      setData((prev) => {
        const newPrices = { ...prev.prices }
        delete newPrices[old]
        if (price) newPrices[trimmed] = price
        const newData = {
          ...prev,
          [cat]: prev[cat].map((i) => (i === old ? trimmed : i)),
          prices: newPrices,
        }
        saveToBackend(newData)
        return newData
      })
    } else if (trimmed === old) {
      setData((prev) => {
        const newPrices = { ...prev.prices }
        if (price) newPrices[trimmed] = price
        else delete newPrices[trimmed]
        const newData = { ...prev, prices: newPrices }
        saveToBackend(newData)
        return newData
      })
    }
  }

  const updateBelleConfig = (
    estabelecimento: string = '',
    contentType:
      | 'application/x-www-form-urlencoded'
      | 'multipart/form-data'
      | 'application/json' = 'application/json',
  ) => {
    setData((prev) => {
      const newData = {
        ...prev,
        belleSoftware: {
          ...prev.belleSoftware,
          estabelecimento,
          webhookContentType: contentType,
        },
      }
      saveToBackend(newData)
      return newData
    })
  }

  const setBelleLastSync = (status: 'success' | 'error', date: string) => {
    const newData = {
      ...data,
      belleSoftware: { ...data.belleSoftware, lastSyncStatus: status, lastSync: date },
    }
    setData(newData)
    saveToBackend(newData)
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
