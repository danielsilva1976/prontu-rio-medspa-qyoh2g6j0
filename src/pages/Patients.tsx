import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react'
import usePatientStore from '@/stores/usePatientStore'
import useSettingsStore from '@/stores/useSettingsStore'
import useAuditStore from '@/stores/useAuditStore'
import useUserStore from '@/stores/useUserStore'
import { useToast } from '@/hooks/use-toast'
import { PatientDialog } from '@/components/patients/PatientDialog'
import { PatientCard } from '@/components/patients/PatientCard'
import { fetchBelleClientes, fetchBelleAgendamentos } from '@/lib/api/belle'

export default function Patients() {
  const { patients, syncWithBelle } = usePatientStore()
  const { belleSoftware, setBelleLastSync } = useSettingsStore()
  const { addLog } = useAuditStore()
  const { currentUser } = useUserStore()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)

  // Security Compliance: Only authenticated Admin/Médico can trigger sync
  const canSync = currentUser.role === 'Médico' || currentUser.email === 'daniel.nefro@gmail.com'

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.cpf && p.cpf.includes(searchTerm)),
  )

  const handleSync = async () => {
    if (!canSync) {
      toast({
        title: 'Acesso Negado',
        description: 'Apenas usuários autorizados podem sincronizar dados.',
        variant: 'destructive',
      })
      return
    }

    if (!belleSoftware.url || !belleSoftware.token) {
      toast({
        title: 'Configuração Incompleta',
        description:
          'Configure a URL e o Token do Belle Software nas configurações antes de sincronizar.',
        variant: 'destructive',
      })
      return
    }

    setIsSyncing(true)
    try {
      // Fetch both clients and generic appointments via api.php protocol
      const [rawClientes, rawAgendamentos] = await Promise.all([
        fetchBelleClientes(belleSoftware.url, belleSoftware.token),
        fetchBelleAgendamentos(belleSoftware.url, belleSoftware.token),
      ])

      const now = new Date()

      // Map Belle Data to Local Patient Partial structure with history inference
      const mappedData = rawClientes.map((c) => {
        // Find appointments belonging to this specific client
        const clientAppts = rawAgendamentos.filter(
          (a) =>
            (a.cpf_cliente && c.cpf && a.cpf_cliente === c.cpf) ||
            (a.cliente_id && a.cliente_id === c.id),
        )

        let lastVisit = c.data_nascimento
          ? new Date(c.data_nascimento).toISOString().split('T')[0]
          : '2023-01-01'
        let nextAppointment = null
        const procedures = new Set<string>()

        // Calculate last visit, next appointment, and extract procedures
        clientAppts.forEach((a) => {
          if (a.servico) procedures.add(a.servico)
          const apptDateStr = `${a.data}T${a.hora_inicio}:00`
          const apptDate = new Date(apptDateStr)

          if (apptDate < now) {
            if (!lastVisit || apptDate > new Date(lastVisit)) lastVisit = a.data
          } else {
            if (!nextAppointment || apptDate < new Date(nextAppointment))
              nextAppointment = apptDateStr
          }
        })

        return {
          belleId: String(c.id),
          name: c.nome,
          cpf: c.cpf,
          email: c.email,
          phone: c.celular,
          dob: c.data_nascimento,
          // Infer history data
          lastVisit,
          nextAppointment,
          procedures: Array.from(procedures),
          // Store specific clinical history note if Belle provides it
          endereco: c.historico_clinico ? `Nota Belle: ${c.historico_clinico}` : undefined,
        }
      })

      // Sync and deduplicate by CPF, applying mapped schedules
      const result = syncWithBelle(mappedData)

      setBelleLastSync('success', new Date().toISOString())
      addLog('Sincronização Belle Software (Pacientes e Agenda)', 'SYSTEM')

      toast({
        title: 'Sincronização Concluída',
        description: `${result.added} novos pacientes, ${result.updated} atualizados. Agendas vinculadas com sucesso.`,
      })
    } catch (error: any) {
      setBelleLastSync('error', new Date().toISOString())
      addLog('Erro na Sincronização Belle Software', 'SYSTEM')
      toast({
        title: 'Falha na Sincronização API',
        description:
          error.message || 'Não foi possível completar a requisição ao api.php do Belle.',
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-primary tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground mt-1">
            Gestão unificada com integração bidirecional Belle
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
              className="bg-white border-primary/20 text-primary hover:bg-primary/5"
              onClick={handleSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sincronizar Belle
            </Button>
          )}
          <PatientDialog />
        </div>
      </div>

      <Card className="border-none shadow-subtle">
        <CardContent className="p-4 sm:p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou ID do paciente..."
              className="pl-10 h-12 bg-muted/30 border-muted rounded-xl text-base focus-visible:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid gap-4">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-16 bg-muted/10 rounded-xl border border-dashed border-border">
                <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum paciente encontrado na busca.</p>
              </div>
            ) : (
              filteredPatients.map((patient) => <PatientCard key={patient.id} patient={patient} />)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
