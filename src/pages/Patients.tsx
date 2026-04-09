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
import { Progress } from '@/components/ui/progress'
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
import { SyncDiagnosticPanel } from '@/components/patients/SyncDiagnosticPanel'
import { testBelleConnection } from '@/lib/api/belle'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

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
    syncProgress,
    setSyncProgress,
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
  const [activeJob, setActiveJob] = useState<any>(null)
  const hasAttemptedAutoSync = useRef(false)
  const realtimeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  useEffect(() => {
    return () => {
      if (realtimeTimeoutRef.current) clearTimeout(realtimeTimeoutRef.current)
    }
  }, [])

  useRealtime('patients', () => {
    if (isSyncing) return // Previne milhares de requests durante a sincronização em massa, evitando crashes

    if (realtimeTimeoutRef.current) clearTimeout(realtimeTimeoutRef.current)
    realtimeTimeoutRef.current = setTimeout(() => {
      fetchPatients(currentPage, debouncedSearch, statusFilter)
    }, 1500)
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

    // Pre-Sync Handshake Validation
    let handshakeTotal = 0
    try {
      const res = await testBelleConnection(belleSoftware.estabelecimento || '1')
      const cData = res.data
      if (cData && !Array.isArray(cData)) {
        handshakeTotal = Number(
          cData.total ||
            cData.totalRegistros ||
            cData.totalCount ||
            cData.total_registros ||
            cData.quantidade ||
            0,
        )
      }
    } catch (error: any) {
      setIsSyncing(false)
      const msg = error.message || 'Erro na comunicação com a API'
      toast({
        title: 'Falha de Conexão',
        description: msg,
        variant: 'destructive',
      })
      setErrorMsg(`Handshake failed: ${msg}`)
      return
    }

    // Check for an already running process or failed process to resume
    let lastPage = 0
    let recordsProcessed = 0
    let totalExpected = 0

    try {
      const activeJob = await pb
        .collection('sync_jobs')
        .getFirstListItem(
          'status="pending" || status="processing" || status="failed" || status="error"',
          {
            sort: '-created',
          },
        )

      if (activeJob) {
        if (activeJob.status === 'pending' || activeJob.status === 'processing') {
          const updatedAt = new Date(activeJob.updated).getTime()
          const now = new Date().getTime()
          if (now - updatedAt <= 15 * 60 * 1000) {
            toast({
              title: 'Sincronização em Andamento',
              description: 'Já existe um processo de sincronização rodando em segundo plano.',
            })
            setIsSyncing(true)
            setSyncProgress({
              current: activeJob.records_processed || 0,
              total: activeJob.total_records_expected || 0,
            })
            return
          } else {
            // Clear stuck job to allow a new one
            await pb.collection('sync_jobs').update(activeJob.id, {
              status: 'failed',
              error_log:
                (activeJob.error_log || '') +
                '\nProcesso anterior cancelado por inatividade (timeout). Reiniciando do ponto de parada...',
            })
            // Will resume from this job
            lastPage = activeJob.last_processed_page || 0
            recordsProcessed = activeJob.records_processed || 0
            totalExpected = activeJob.total_records_expected || 0
          }
        } else if (activeJob.status === 'failed' || activeJob.status === 'error') {
          // Check if we should resume
          // We resume if there was a partial progress
          if (activeJob.last_processed_page > 0 || activeJob.records_processed > 0) {
            lastPage = activeJob.last_processed_page || 0
            recordsProcessed = activeJob.records_processed || 0
            totalExpected = activeJob.total_records_expected || 0
          }
        }
      }
    } catch (e) {
      // No active job, proceed
    }

    setErrorMsg(null)

    try {
      const finalTotal = Number(totalExpected) || handshakeTotal || 0
      setSyncProgress({
        current: Number(recordsProcessed) || 0,
        total: finalTotal,
      })

      // Bypass direct frontend fetch (which causes CORS) and directly create the job.
      // The backend hook `sync_jobs_process.js` will handle the actual Belle API connection reliably.
      await pb.collection('sync_jobs').create({
        status: 'processing',
        estabelecimento: String(belleSoftware.estabelecimento || '1'),
        last_processed_page: Number(lastPage) || 0,
        records_processed: Number(recordsProcessed) || 0,
        total_records_expected: finalTotal,
      })

      if (lastPage > 0) {
        toast({
          title: 'Sincronização Retomada',
          description: `Retomando processo a partir da página ${lastPage} (${recordsProcessed} registros).`,
        })
        addLog(`Sincronização Retomada - Página ${lastPage}`, 'SYSTEM')
      } else {
        toast({
          title: 'Sincronização Iniciada',
          description: 'O processo está rodando em segundo plano no servidor.',
        })
        addLog('Sincronização Belle Software Iniciada', 'SYSTEM')
      }
    } catch (error: any) {
      setBelleLastSync('error', new Date().toISOString())
      addLog(`Erro ao Iniciar Sincronização`, 'SYSTEM')

      const fieldErrors = extractFieldErrors(error)
      const fieldErrorsStr = Object.entries(fieldErrors)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
      const details = getErrorMessage(error)
      const fullError = fieldErrorsStr ? `${details} - ${fieldErrorsStr}` : details

      setErrorMsg(`Failed to create record: ${fullError}`)

      toast({
        title: 'Falha na Sincronização',
        description: fullError,
        variant: 'destructive',
      })
      setIsSyncing(false)
      setSyncProgress(null)
    }
  }

  useEffect(() => {
    const checkActiveJob = async () => {
      try {
        const job = await pb
          .collection('sync_jobs')
          .getFirstListItem('status="pending" || status="processing"', { sort: '-created' })
        if (job) {
          setActiveJob(job)
          setIsSyncing(true)
          setSyncProgress({
            current: job.records_processed || 0,
            total: job.total_records_expected || 0,
          })
        } else {
          setActiveJob(null)
          // Check for recently failed jobs to persist error state locally
          const failedJob = await pb
            .collection('sync_jobs')
            .getFirstListItem('status="failed" || status="error"', { sort: '-created' })
            .catch(() => null)

          if (failedJob && !isSyncing) {
            const failedAt = new Date(failedJob.updated).getTime()
            if (new Date().getTime() - failedAt < 60000) {
              setErrorMsg(failedJob.error_log || 'Falha ao iniciar sincronização.')
            }
          }
        }
      } catch (e) {
        // No active job
      }
    }

    checkActiveJob()

    // Periodically poll to track job status and rescue from stalls
    const interval = setInterval(() => {
      if (isSyncing) checkActiveJob()
    }, 30000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSyncing])

  useRealtime('sync_jobs', (e) => {
    const job = e.record
    if (e.action === 'create' || e.action === 'update') {
      if (job.status === 'processing' || job.status === 'pending') {
        setActiveJob(job)
        setIsSyncing(true)
        setSyncProgress({
          current: job.records_processed || 0,
          total: job.total_records_expected || 0,
        })
      } else if (job.status === 'completed') {
        setActiveJob(null)
        setIsSyncing(false)
        setSyncProgress(null)
        setBelleLastSync('success', new Date().toISOString())
        toast({
          title: 'Sincronização Concluída',
          description: 'Todos os pacientes foram atualizados com sucesso.',
        })
        fetchPatients(currentPage, debouncedSearch, statusFilter)
      } else if (job.status === 'error' || job.status === 'failed') {
        setActiveJob(null)
        setIsSyncing(false)
        setSyncProgress(null)
        setBelleLastSync('error', new Date().toISOString())
        setErrorMsg(job.error_log || 'Erro na comunicação com a API do Belle Software.')
        toast({
          title: 'Erro na Sincronização',
          description: job.error_log || 'Houve uma falha no processamento em background.',
          variant: 'destructive',
        })
      }
    }
  })

  const handleForceStop = async () => {
    if (!activeJob) return
    try {
      await pb.collection('sync_jobs').update(activeJob.id, {
        status: 'failed',
        error_log: (activeJob.error_log || '') + '\nInterrompido manualmente pelo usuário.',
      })
      toast({
        title: 'Sincronização Interrompida',
        description: 'O processo foi cancelado manualmente.',
      })
      setIsSyncing(false)
      setActiveJob(null)
      setSyncProgress(null)
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível interromper a sincronização.',
        variant: 'destructive',
      })
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
        <div className="flex flex-wrap items-center gap-3">
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
            <>
              <SyncDiagnosticPanel />
              <Button
                variant="outline"
                className="bg-white border-primary/20 text-primary hover:bg-primary/5 min-w-[170px]"
                onClick={handleSync}
                disabled={isSyncing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Belle'}
              </Button>
            </>
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
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            {isSyncing && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20 animate-fade-in mb-2 gap-4">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin opacity-80" />
                  <div>
                    <p className="text-sm font-semibold text-primary">Sincronização em Andamento</p>
                    <p className="text-xs text-muted-foreground">
                      Baixando e atualizando dados em segundo plano. O sistema continua disponível.
                    </p>
                  </div>
                </div>
                {syncProgress && (
                  <div className="w-full sm:w-72 space-y-1.5">
                    <div className="flex justify-between text-xs text-primary/80 font-medium">
                      <span>Progresso da Sincronização</span>
                      <span>
                        {syncProgress.current}{' '}
                        {syncProgress.total > 0 ? `/ ${syncProgress.total}` : 'registros'}
                      </span>
                    </div>
                    <Progress
                      value={
                        syncProgress.total > 0
                          ? Math.min((syncProgress.current / syncProgress.total) * 100, 100)
                          : syncProgress.current > 0
                            ? 100
                            : 0
                      }
                      className="h-1.5 bg-primary/10 [&>div]:transition-all [&>div]:duration-500"
                    />
                    {activeJob && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleForceStop}
                        className="h-7 w-full text-xs mt-2"
                      >
                        Forçar Interrupção
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="flex items-start gap-3 p-4 bg-destructive/5 rounded-xl border border-destructive/30 animate-fade-in mb-2">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Falha na Sincronização</p>
                  <p className="text-xs text-destructive/80 mt-1 mb-1">
                    O processo foi interrompido. Verifique o Painel de Diagnóstico (Ver Logs de
                    Erro) para mais detalhes sobre o erro ou timeout do servidor.
                  </p>
                  <p className="text-xs text-destructive/60 mb-3 font-mono bg-destructive/10 p-2 rounded whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {errorMsg}
                  </p>{' '}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={handleSync}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Retomar Sincronização
                  </Button>
                </div>
              </div>
            )}

            {isLoading && patients.length === 0 ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
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
