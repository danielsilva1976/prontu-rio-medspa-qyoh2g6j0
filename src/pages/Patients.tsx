import { useState, useMemo, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useRealtime } from '@/hooks/use-realtime'
import usePatientStore from '@/stores/usePatientStore'
import useSettingsStore from '@/stores/useSettingsStore'
import useAuditStore from '@/stores/useAuditStore'
import useUserStore from '@/stores/useUserStore'
import { useToast } from '@/hooks/use-toast'
import { PatientDialog } from '@/components/patients/PatientDialog'
import { PatientCard } from '@/components/patients/PatientCard'
import {
  testBelleConnection,
  fetchBelleClientes,
  fetchBelleAgendamentos,
  mapBelleDataToPatients,
} from '@/lib/api/belle'

export default function Patients() {
  const {
    patients,
    isSyncing,
    setIsSyncing,
    syncWithBelle,
    fetchPatients,
    page,
    totalPages,
    isLoading,
  } = usePatientStore()
  const { belleSoftware, setBelleLastSync } = useSettingsStore()
  const { addLog } = useAuditStore()
  const { currentUser } = useUserStore()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const hasAttemptedAutoSync = useRef(false)

  const canSync = currentUser.role === 'Médico' || currentUser.email === 'daniel.nefro@gmail.com'

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    fetchPatients(currentPage, debouncedSearch, statusFilter)
  }, [currentPage, debouncedSearch, statusFilter, fetchPatients])

  useRealtime('patients', () => {
    fetchPatients(currentPage, debouncedSearch, statusFilter)
  })

  const handleSync = async () => {
    if (!canSync) {
      toast({
        title: 'Acesso Negado',
        description: 'Apenas usuários autorizados podem sincronizar dados.',
        variant: 'destructive',
      })
      return
    }

    if (!belleSoftware.estabelecimento) {
      toast({
        title: 'Configuração Incompleta',
        description: 'Configure o estabelecimento do Belle Software nas configurações.',
        variant: 'destructive',
      })
      return
    }

    setIsSyncing(true)
    setErrorMsg(null)

    try {
      await testBelleConnection(belleSoftware.estabelecimento)

      const [rawClientes, rawAgendamentos] = await Promise.all([
        fetchBelleClientes(belleSoftware.estabelecimento),
        fetchBelleAgendamentos(belleSoftware.estabelecimento),
      ])

      const mappedData = mapBelleDataToPatients(rawClientes, rawAgendamentos)

      await syncWithBelle(mappedData)

      setBelleLastSync('success', new Date().toISOString())
      addLog('Sincronização Completa Belle Software via API Direta', 'SYSTEM')

      toast({
        title: 'Sucesso',
        description: 'Conexão estabelecida e dados sincronizados com sucesso.',
      })
    } catch (error: any) {
      setBelleLastSync('error', new Date().toISOString())
      addLog(`Erro na Sincronização via API`, 'SYSTEM')

      const title = error.errorTitle || error.error || 'Falha na Sincronização'
      const details =
        error.details || error.message || 'Não foi possível conectar ao Belle Software.'

      setErrorMsg(`${title}: ${details}`)

      toast({
        title,
        description: details,
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    if (
      !hasAttemptedAutoSync.current &&
      !isLoading &&
      patients.length === 0 &&
      canSync &&
      belleSoftware.estabelecimento &&
      searchTerm === ''
    ) {
      hasAttemptedAutoSync.current = true
      handleSync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patients.length, isLoading, canSync, belleSoftware.estabelecimento])

  return (
    <div className="space-y-6 animate-slide-up p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-primary tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground mt-1">
            Base de clientes atualizada via integração com Belle Software
          </p>
        </div>
        <div className="flex items-center gap-3">
          {belleSoftware.lastSync && canSync && (
            <div className="hidden sm:flex flex-col items-end mr-1 text-xs">
              <span
                className={`flex items-center gap-1 font-medium ${
                  belleSoftware.lastSyncStatus === 'success' ? 'text-success' : 'text-destructive'
                }`}
              >
                {belleSoftware.lastSyncStatus === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                {belleSoftware.lastSyncStatus === 'success' ? 'Sincronizado' : 'Falha na Sync'}
              </span>
              <span className="text-muted-foreground">
                {new Date(belleSoftware.lastSync).toLocaleString('pt-BR')}
              </span>
            </div>
          )}
          {canSync && (
            <Button
              variant="outline"
              className="bg-white border-primary/20 text-primary hover:bg-primary/5 min-w-[170px]"
              onClick={handleSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Belle'}
            </Button>
          )}
          <PatientDialog />
        </div>
      </div>

      <Card className="border-none shadow-subtle">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por Nome ou CPF"
                className="pl-10 h-12 bg-muted/30 border-muted rounded-xl text-base focus-visible:ring-primary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isSyncing}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isSyncing}>
                <SelectTrigger className="h-12 bg-white border-muted rounded-xl text-base focus:ring-primary">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Ativos">Ativos</SelectItem>
                  <SelectItem value="Inativos">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {isSyncing || isLoading ? (
              <div className="space-y-6">
                {isSyncing && (
                  <div className="flex flex-col items-center justify-center py-8 bg-muted/10 rounded-xl border border-dashed border-border">
                    <RefreshCw className="w-10 h-10 text-primary animate-spin mb-3 opacity-80" />
                    <p className="text-muted-foreground font-medium animate-pulse">
                      Sincronizando... Conectando à API e baixando base real de clientes...
                    </p>
                  </div>
                )}
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                </div>
              </div>
            ) : errorMsg ? (
              <div className="text-center py-12 bg-destructive/5 rounded-xl border border-dashed border-destructive/30">
                <AlertCircle className="w-10 h-10 text-destructive/50 mx-auto mb-3" />
                <p className="text-destructive font-medium text-lg">
                  Não foi possível carregar os dados
                </p>
                <p className="text-destructive/80 text-sm mt-2 max-w-md mx-auto">{errorMsg}</p>
                <Button
                  variant="outline"
                  className="mt-5 border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={handleSync}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            ) : patients.length === 0 ? (
              <div className="text-center py-16 bg-muted/10 rounded-xl border border-dashed border-border">
                <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium text-lg">
                  Nenhum paciente encontrado
                </p>
                <p className="text-muted-foreground/80 text-sm mt-1">
                  {searchTerm === ''
                    ? 'A base local está vazia. Clique em "Sincronizar Belle" para carregar os dados reais.'
                    : 'A busca não retornou resultados para os filtros aplicados.'}
                </p>
              </div>
            ) : (
              <>
                {patients.map((patient) => (
                  <PatientCard key={patient.id} patient={patient} />
                ))}
                {totalPages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={
                            currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink className="font-medium pointer-events-none">
                          Página {currentPage} de {totalPages || 1}
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className={
                            currentPage >= totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
