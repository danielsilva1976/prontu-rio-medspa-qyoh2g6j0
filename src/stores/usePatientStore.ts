import {
  useState,
  useCallback,
  useContext,
  createContext,
  ReactNode,
  createElement,
  useRef,
} from 'react'
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
  syncWithBelle: (estabelecimento: string) => Promise<void>
  clearPatients: () => void

  page: number
  totalPages: number
  totalItems: number
  isLoading: boolean
  syncProgress: { current: number; total: number } | null
  setSyncProgress: (progress: { current: number; total: number } | null) => void
  fetchPatients: (page?: number, search?: string, status?: string) => Promise<void>
}

const PatientContext = createContext<PatientState>({} as PatientState)

function safeParseJSON(val: any, fallback: any[] = []): any[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string' && val.trim() !== '') {
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed) ? parsed : fallback
    } catch (e) {
      return fallback
    }
  }
  return fallback
}

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
    procedures: safeParseJSON(record.procedures),
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
    tags: safeParseJSON(record.tags),
  }
}

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null)

  const fetchIdRef = useRef(0)

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
      const currentFetchId = ++fetchIdRef.current
      setIsLoading(true)
      try {
        await ensureAuth()
        const filters: string[] = []
        if (search) {
          // Prevent injection and use proper syntax
          const safeSearch = search.replace(/"/g, '\\"')
          filters.push(`(name ~ "${safeSearch}" || cpf ~ "${safeSearch}")`)
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
          requestKey: 'fetch_patients_list', // Aborts any pending list request, improving performance
        })

        // Only update state if this is the most recent fetch
        if (currentFetchId === fetchIdRef.current) {
          setPatients(result.items.map(mapRecordToPatient))
          setPage(result.page)
          setTotalPages(result.totalPages)
          setTotalItems(result.totalItems)
        }
      } catch (error: any) {
        if (error?.isAbort) return // Ignore aborted requests
        if (currentFetchId === fetchIdRef.current) {
          console.error('Failed to fetch patients', error)
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setIsLoading(false)
        }
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
      tags: Array.isArray(patient.tags) ? JSON.stringify(patient.tags) : patient.tags || '[]',
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
    if (data.tags) {
      payload.tags = Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags
    }

    await pb.collection('patients').update(id, payload)
  }

  const clearPatients = () => setPatients([])

  const syncWithBelle = async (estabelecimento: string) => {
    await ensureAuth()

    try {
      const existing = await pb
        .collection('sync_jobs')
        .getFirstListItem(
          `(status="pending" || status="processing") && estabelecimento="${estabelecimento}"`,
          {
            sort: '-created',
          },
        )

      if (existing) {
        setIsSyncing(true)
        setSyncProgress({
          current: existing.records_processed || 0,
          total: existing.total_records_expected || 0,
        })
        return
      }
    } catch (e) {
      // No active job found, proceed
    }

    try {
      setIsSyncing(true)
      setSyncProgress({ current: 0, total: 0 })
      await pb.collection('sync_jobs').create({
        status: 'pending',
        estabelecimento: String(estabelecimento || '1'),
        last_processed_page: 0,
        records_processed: 0,
        total_records_expected: 0,
        retry_count: 0,
      })
    } catch (e) {
      setIsSyncing(false)
      setSyncProgress(null)
      console.error('Failed to start sync job', e)
      throw e
    }
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
        syncProgress,
        setSyncProgress,
        fetchPatients,
      },
    },
    children,
  )
}

export default function usePatientStore() {
  return useContext(PatientContext)
}
