import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Calendar, Clock, RefreshCw, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Patient } from '@/stores/usePatientStore'
import useSettingsStore from '@/stores/useSettingsStore'
import { fetchBelleAgendamentos, BelleAgendamento } from '@/lib/api/belle'
import { useToast } from '@/hooks/use-toast'

interface Props {
  isOpen: boolean
  onClose: (isOpen: boolean) => void
  patient: Patient
}

export default function CompleteHistoryModal({ isOpen, onClose, patient }: Props) {
  const { belleSoftware } = useSettingsStore()
  const { toast } = useToast()

  const [appointments, setAppointments] = useState<BelleAgendamento[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = async () => {
    if (!patient.cpf) {
      setError('Paciente não possui CPF cadastrado para buscar histórico.')
      return
    }

    if (!belleSoftware.url || !belleSoftware.token) {
      setError('Integração com Belle Software não configurada.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchBelleAgendamentos(belleSoftware.url, belleSoftware.token, patient.cpf)
      // Sort by date descending
      const sorted = data.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      setAppointments(sorted)
    } catch (err) {
      setError('Falha ao conectar com a API do Belle Software.')
      toast({
        title: 'Erro de Sincronização',
        description: 'Não foi possível carregar o histórico de agendamentos.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    } else {
      // Reset state when closed
      setAppointments([])
      setError(null)
    }
  }, [isOpen])

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase()
    if (s.includes('atendido'))
      return <Badge className="bg-success hover:bg-success/90">Atendido</Badge>
    if (s.includes('agendado'))
      return (
        <Badge variant="outline" className="text-primary border-primary">
          Agendado
        </Badge>
      )
    if (s.includes('cancelado')) return <Badge variant="destructive">Cancelado</Badge>
    return <Badge variant="secondary">{status}</Badge>
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-primary flex items-center justify-between pr-8">
            Histórico Completo de Agendamentos
            <Button
              variant="outline"
              size="sm"
              onClick={loadHistory}
              disabled={isLoading || !patient.cpf}
              className="text-sm font-normal"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
          </DialogTitle>
          <DialogDescription>
            Agendamentos sincronizados do Belle Software para {patient.name} (
            {patient.cpf || 'Sem CPF'}).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 rounded-xl border border-border/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>Buscando histórico na API...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-muted/20">
              <AlertCircle className="w-8 h-8 mb-4 opacity-50" />
              <p className="text-center max-w-sm">{error}</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-muted/10">
              <Calendar className="w-10 h-10 mb-4 opacity-30" />
              <p>Nenhum agendamento encontrado para este paciente.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30 sticky top-0 backdrop-blur-sm z-10">
                <TableRow>
                  <TableHead className="w-[180px]">Data e Hora</TableHead>
                  <TableHead>Serviço / Procedimento</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((apt) => (
                  <TableRow key={apt.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary/70" />
                          {format(new Date(apt.data + 'T00:00:00'), "dd 'de' MMMM, yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {apt.hora_inicio}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{apt.servico}</TableCell>
                    <TableCell className="text-muted-foreground">{apt.profissional}</TableCell>
                    <TableCell className="text-right">{getStatusBadge(apt.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
