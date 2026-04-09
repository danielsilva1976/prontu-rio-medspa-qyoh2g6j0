import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, CheckCircle2, Clock, ServerCrash, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function SyncDiagnosticPanel() {
  const [jobs, setJobs] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const fetchJobs = async () => {
    try {
      const res = await pb.collection('sync_jobs').getList(1, 20, { sort: '-created' })
      setJobs(res.items)
    } catch (e) {
      console.error('Failed to fetch sync jobs logs', e)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchJobs()
    }
  }, [isOpen])

  useRealtime(
    'sync_jobs',
    () => {
      if (isOpen) {
        fetchJobs()
      }
    },
    isOpen,
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case 'failed':
      case 'error':
        return <ServerCrash className="w-4 h-4 text-destructive" />
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
            Concluído
          </Badge>
        )
      case 'failed':
      case 'error':
        return (
          <Badge
            variant="outline"
            className="bg-destructive/10 text-destructive border-destructive/20"
          >
            Falha
          </Badge>
        )
      case 'processing':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
            Processando
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
            Pendente
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="text-muted-foreground">
          <Activity className="w-4 h-4 mr-2" />
          Ver Logs de Erro
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md w-full p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Painel de Diagnóstico de Sync
          </SheetTitle>
          <SheetDescription>
            Acompanhe o status das integrações em tempo real e visualize logs de erro do servidor.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">Nenhum log encontrado.</div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 space-y-3 bg-card shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <span className="font-semibold text-sm">Job {job.id.slice(-6)}</span>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="block font-medium text-foreground/70">Atualizado em</span>
                      {new Date(job.updated).toLocaleString('pt-BR')}
                    </div>
                    <div>
                      <span className="block font-medium text-foreground/70">Progresso</span>
                      {job.records_processed} / {job.total_records_expected || '?'} registros
                    </div>
                  </div>

                  {job.error_log && (
                    <div className="mt-2 bg-destructive/5 text-destructive p-2.5 rounded text-xs font-mono whitespace-pre-wrap break-words border border-destructive/20 max-h-32 overflow-y-auto">
                      {job.error_log}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
