import { useState, useMemo, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
  }, [debouncedSearch])

  useEffect(() => {
    fetchPatients(currentPage, debouncedSearch)
  }, [currentPage, debouncedSearch, fetchPatients])

  useEffect(() => {
    return () => {
      if (realtimeTimeoutRef.current) clearTimeout(realtimeTimeoutRef.current)
    }
  }, [])

  useRealtime('patients', () => {
    if (isSyncing) return // Previne milhares de requests durante a sincronização em massa, evitando crashes

    if (realtimeTimeoutRef.current) clearTimeout(realtimeTimeoutRef.current)
    realtimeTimeoutRef.current = setTimeout(() => {
      fetchPatients(currentPage, debouncedSearch)
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

    // Job Creation Guard
    try {
      const activeJob = await pb
        .collection('sync_jobs')
        .getFirstListItem(
          `(status="pending" || status="processing") && estabelecimento="${belleSoftware.estabelecimento || '1'}"`,
          { sort: '-created' },
        )

      if (activeJob) {
        const updatedAt = new Date(activeJob.updated).getTime()
        const now = new Date().getTime()
        if (now - updatedAt <= 15 * 60 * 1000) {
          toast({
            title: 'Sincronização em Andamento',
            description: 'Já existe um processo de sincronização ativo. Acompanhe o progresso.',
          })
          setIsSyncing(true)
          setSyncProgress({
            current: activeJob.records_processed || 0,
            total: activeJob.total_records_expected || 0,
          })
          return
        } else {
          // Clear stuck job
          await pb.collection('sync_jobs').update(activeJob.id, {
            status: 'failed',
            error_log:
              (activeJob.error_log || '') + '\nProcesso anterior cancelado por inatividade.',
          })
        }
      }
    } catch (e) {
      // No active job, proceed
    }

    setErrorMsg(null)

    try {
      setSyncProgress({
        current: 0,
        total: handshakeTotal || 0,
      })

      // Validated Payload: minimal and strictly follows the schema
      await pb.collection('sync_jobs').create(
        {
          status: 'pending',
          estabelecimento: String(belleSoftware.estabelecimento || '1'),
          last_processed_page: 0,
          records_processed: 0,
          total_records_expected: 0,
          retry_count: 0,
        },
        { requestKey: null },
      )

      toast({
        title: 'Sincronização Iniciada',
        description: 'O processo está rodando no servidor.',
      })
      addLog('Sincronização Belle Software Iniciada', 'SYSTEM')
    } catch (error: any) {
      // Handle network timeouts gracefully (status 0) since the hook might take longer than the proxy timeout
      if (error.status === 0 || error.isAbort) {
        toast({
          title: 'Processamento em Lote',
          description:
            'O servidor está processando um grande volume de dados. Acompanhe o progresso.',
        })
        return // Leave syncing state active, SSE will handle updates
      }

      setBelleLastSync('error', new Date().toISOString())
      addLog(`Erro ao Iniciar Sincronização`, 'SYSTEM')

      const fieldErrors = extractFieldErrors(error)
      const fieldErrorsStr = Object.entries(fieldErrors)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
      const details = getErrorMessage(error)
      const fullError = fieldErrorsStr ? `${details} - ${fieldErrorsStr}` : details

      setErrorMsg(`Falha na criação do Job: ${fullError}`)

      toast({
        title: 'Falha na Sincronização',
        description: 'Sincronização interrompida devido a erro de servidor.',
        variant: 'destructive',
      })
      setIsSyncing(false)
      setSyncProgress(null)
    }
  }

  useEffect(() => {
    const checkActiveJob = async () => {
      try {
        const estab = belleSoftware.estabelecimento || '1'
        const job = await pb
          .collection('sync_jobs')
          .getFirstListItem(
            `(status="pending" || status="processing") && estabelecimento="${estab}"`,
            { sort: '-created' },
          )

        if (job) {
          setActiveJob(job)
          setIsSyncing(true)
          setSyncProgress({
            current: job.records_processed || 0,
            total: job.total_records_expected || 0,
          })
        }
      } catch (e: any) {
        // No active job found (PocketBase throws 404 when getFirstListItem finds no matches)
        if (e.status === 404) {
          setActiveJob(null)
          setIsSyncing(false)
          setSyncProgress(null)

          // Check for recently failed jobs to persist error state locally
          try {
            const estab = belleSoftware.estabelecimento || '1'
            const failedJob = await pb
              .collection('sync_jobs')
              .getFirstListItem(
                `(status="failed" || status="error") && estabelecimento="${estab}"`,
                {
                  sort: '-created',
                },
              )

            if (failedJob) {
              const failedAt = new Date(failedJob.updated).getTime()
              if (new Date().getTime() - failedAt < 60000) {
                setErrorMsg(failedJob.error_log || 'Falha ao iniciar sincronização.')
              }
            }
          } catch (err) {
            // Ignore if no failed jobs found
          }
        }
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
    // Filtra para reagir apenas aos jobs do estabelecimento atual
    if (
      belleSoftware.estabelecimento &&
      job.estabelecimento !== belleSoftware.estabelecimento &&
      job.estabelecimento !== '1'
    )
      return

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
        fetchPatients(currentPage, debouncedSearch)
      } else if (job.status === 'error' || job.status === 'failed') {
        setActiveJob(null)
        setIsSyncing(false)
        setSyncProgress(null)
        setBelleLastSync('error', new Date().toISOString())
        setErrorMsg(
          job.error_log || 'Sincronização interrompida devido a timeout ou erro de servidor.',
        )
        toast({
          title: 'Erro na Sincronização',
          description: 'Sincronização interrompida devido a timeout ou erro de servidor.',
          variant: 'destructive',
        })
      }
    } else if (e.action === 'delete') {
      if (activeJob && job.id === activeJob.id) {
        setActiveJob(null)
        setIsSyncing(false)
        setSyncProgress(null)
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
          <div className="mb-6 relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por Nome"
              className="pl-10 h-12 bg-muted/30 border-muted rounded-xl text-base focus-visible:ring-primary transition-all w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                    Sincronização interrompida devido a timeout ou erro de servidor.
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
