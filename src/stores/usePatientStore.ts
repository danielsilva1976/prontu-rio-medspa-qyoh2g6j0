import { useState, useCallback, useContext, createContext, ReactNode, createElement } from 'react'
import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

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
  addPatient: (patient: Patient | Omit<Patient, 'id'>) => Promise<void>
  updatePatient: (id: string, data: Partial<Patient>) => Promise<void>
  syncWithBelle: (belleData: Partial<Patient>[]) => Promise<{ added: number; updated: number }>
  clearPatients: () => void

  page: number
  totalPages: number
  totalItems: number
  isLoading: boolean
  fetchPatients: (page?: number, search?: string, status?: string) => Promise<void>
}

const PatientContext = createContext<PatientState>({} as PatientState)

function mapRecordToPatient(record: RecordModel): Patient {
  let age = 0
  if (record.dob) {
    const birth = new Date(record.dob)
    if (!isNaN(birth.getTime())) {
      const diff = Date.now() - birth.getTime()
      age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
    }
  }

  return {
    id: record.id,
    name: record.name || 'Sem Nome',
    age,
    dob: record.dob || '',
    lastVisit: record.lastVisit || '',
    nextAppointment: record.nextAppointment || null,
    status: record.status || 'active',
    phone: record.phone || '',
    procedures: Array.isArray(record.procedures)
      ? record.procedures
      : typeof record.procedures === 'string' && record.procedures
        ? JSON.parse(record.procedures)
        : [],
    professional: record.professional || null,
    avatar: record.avatar || undefined,
    cpf: record.cpf || '',
    rg: record.rg || '',
    profissao: record.profissao || '',
    estado_civil: record.estado_civil || '',
    email: record.email || '',
    endereco: record.endereco || '',
    history: record.history || '',
    belleId: record.external_id || '',
    rua: record.rua || '',
    numeroRua: record.numeroRua || '',
    bairro: record.bairro || '',
    cidade: record.cidade || '',
    uf: record.uf || '',
    cep: record.cep || '',
    temperatura: record.temperatura || '',
    classificacao: record.classificacao || '',
    sexo: record.sexo || '',
    rating: record.rating || '',
    tags: Array.isArray(record.tags)
      ? record.tags
      : typeof record.tags === 'string' && record.tags
        ? JSON.parse(record.tags)
        : [],
  }
}

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const ensureAuth = async () => {
    if (!pb.authStore.isValid) {
      try {
        await pb.collection('users').authWithPassword('daniel.nefro@gmail.com', 'securepassword123')
      } catch (e) {
        console.error('PB Auth failed', e)
      }
    }
  }

  const fetchPatients = useCallback(
    async (p: number = 1, search: string = '', status: string = 'Todos') => {
      setIsLoading(true)
      try {
        await ensureAuth()
        const filters: string[] = []
        if (search) {
          filters.push(`(name ~ "${search}" || cpf ~ "${search}")`)
        }
        if (status === 'Ativos') {
          filters.push(`(status = "active" || status = "scheduled")`)
        } else if (status === 'Inativos') {
          filters.push(`status = "inactive"`)
        }

        const filter = filters.length > 0 ? filters.join(' && ') : ''

        const result = await pb.collection('patients').getList(p, 20, {
          filter,
          sort: 'name',
        })

        setPatients(result.items.map(mapRecordToPatient))
        setPage(result.page)
        setTotalPages(result.totalPages)
        setTotalItems(result.totalItems)
      } catch (error) {
        console.error('Failed to fetch patients', error)
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const addPatient = async (patient: any) => {
    await ensureAuth()
    const payload = {
      external_id: patient.belleId || `local-${Date.now()}`,
      name: patient.name || 'Sem Nome',
      email: patient.email || '',
      phone: patient.phone || '',
      cpf: patient.cpf || '',
      dob: patient.dob || '',
      status: patient.status || 'active',
      history: patient.history || '',
      rg: patient.rg || '',
      profissao: patient.profissao || '',
      estado_civil: patient.estado_civil || '',
      endereco: patient.endereco || '',
      cep: patient.cep || '',
      rua: patient.rua || '',
      numeroRua: patient.numeroRua || '',
      bairro: patient.bairro || '',
      cidade: patient.cidade || '',
      uf: patient.uf || '',
      temperatura: patient.temperatura || '',
      classificacao: patient.classificacao || '',
      sexo: patient.sexo || '',
      rating: patient.rating || '',
      tags: patient.tags || [],
      lastVisit: patient.lastVisit || '',
      nextAppointment: patient.nextAppointment || '',
      avatar: patient.avatar || '',
      procedures: patient.procedures || [],
      professional: patient.professional || '',
    }
    await pb.collection('patients').create(payload)
  }

  const updatePatient = async (id: string, data: Partial<Patient>) => {
    await ensureAuth()
    const payload: any = { ...data }
    if (data.procedures) payload.procedures = data.procedures
    if (data.tags) payload.tags = data.tags

    await pb.collection('patients').update(id, payload)
  }

  const clearPatients = () => setPatients([])

  const syncWithBelle = async (belleData: Partial<Patient>[]) => {
    await ensureAuth()
    let added = 0
    let updated = 0

    const allExisting = await pb.collection('patients').getFullList({ fields: 'id,external_id' })
    const existingMap = new Map(allExisting.map((r) => [r.external_id, r.id]))

    const batchSize = 10
    for (let i = 0; i < belleData.length; i += batchSize) {
      const batch = belleData.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (bp) => {
          const external_id = bp.belleId
            ? String(bp.belleId)
            : `local-${Date.now()}-${Math.random()}`
          const payload = {
            external_id,
            name: bp.name || 'Sem Nome',
            email: bp.email || '',
            phone: bp.phone || '',
            cpf: bp.cpf || '',
            dob: bp.dob || '',
            status: bp.status || (bp.nextAppointment ? 'scheduled' : 'active'),
            history: bp.history || '',
            rg: bp.rg || '',
            profissao: bp.profissao || '',
            estado_civil: bp.estado_civil || '',
            endereco: bp.endereco || '',
            cep: bp.cep || '',
            rua: bp.rua || '',
            numeroRua: bp.numeroRua || '',
            bairro: bp.bairro || '',
            cidade: bp.cidade || '',
            uf: bp.uf || '',
            temperatura: bp.temperatura || '',
            classificacao: bp.classificacao || '',
            sexo: bp.sexo || '',
            rating: bp.rating || '',
            tags: bp.tags || [],
            lastVisit: bp.lastVisit || '',
            nextAppointment: bp.nextAppointment || '',
            avatar: bp.avatar || '',
            procedures: bp.procedures || [],
            professional: bp.professional || '',
          }

          if (existingMap.has(external_id)) {
            await pb.collection('patients').update(existingMap.get(external_id)!, payload)
            updated++
          } else {
            await pb.collection('patients').create(payload)
            added++
          }
        }),
      )
    }
    return { added, updated }
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
        page,
        totalPages,
        totalItems,
        isLoading,
        fetchPatients,
      },
    },
    children,
  )
}

export default function usePatientStore() {
  return useContext(PatientContext)
}
