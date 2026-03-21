import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import usePatientStore from '@/stores/usePatientStore'
import useSettingsStore from '@/stores/useSettingsStore'
import useAuditStore from '@/stores/useAuditStore'
import useUserStore from '@/stores/useUserStore'
import { useToast } from '@/hooks/use-toast'
import { PatientDialog } from '@/components/patients/PatientDialog'
import { PatientCard } from '@/components/patients/PatientCard'
import { fetchBelleClientes, fetchBelleAgendamentos, mapBelleDataToPatients } from '@/lib/api/belle'

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

  const sortedPatients = useMemo(() => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const isToday = (dateString?: string | null) => {
      if (!dateString) return false
      return dateString.startsWith(todayStr)
    }

    return [...filteredPatients].sort((a, b) => {
      const aToday = isToday(a.nextAppointment) ? 1 : 0
      const bToday = isToday(b.nextAppointment) ? 1 : 0

      if (aToday !== bToday) {
        return bToday - aToday // Pin today's appointments to the top
      }

      // Fallback: sort alphabetically (days without appointments will still list the full base)
      return a.name.localeCompare(b.name)
    })
  }, [filteredPatients])

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
      // Fetch entire client database using get_clientes via proxy
      const [rawClientes, rawAgendamentos] = await Promise.all([
        fetchBelleClientes(belleSoftware.url, belleSoftware.token, belleSoftware.estabelecimento),
        fetchBelleAgendamentos(
          belleSoftware.url,
          belleSoftware.token,
          undefined,
          belleSoftware.estabelecimento,
        ),
      ])

      // Map Belle Data to Local Patient structure
      const mappedData = mapBelleDataToPatients(rawClientes, rawAgendamentos)

      // Purge mock data and replace the store with fresh API data
      const result = syncWithBelle(mappedData)

      setBelleLastSync('success', new Date().toISOString())
      addLog('Sincronização Completa Belle Software via Proxy', 'SYSTEM')

      toast({
        title: 'Sincronização Concluída',
        description: `Foram importados ${result.added} pacientes reais com sucesso.`,
      })
    } catch (error: any) {
      setBelleLastSync('error', new Date().toISOString())
      addLog(`Erro na Sincronização via Proxy`, 'SYSTEM')

      toast({
        title: 'Falha na Sincronização',
        description:
          'Não foi possível conectar ao Belle Software. Verifique sua conexão ou credenciais.',
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
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou ID do paciente..."
              className="pl-10 h-12 bg-muted/30 border-muted rounded-xl text-base focus-visible:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isSyncing || patients.length === 0}
            />
          </div>

          <div className="grid gap-4">
            {isSyncing ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-8 bg-muted/10 rounded-xl border border-dashed border-border">
                  <RefreshCw className="w-10 h-10 text-primary animate-spin mb-3 opacity-80" />
                  <p className="text-muted-foreground font-medium animate-pulse">
                    Conectando via Proxy e baixando base real de clientes...
                  </p>
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                </div>
              </div>
            ) : sortedPatients.length === 0 ? (
              <div className="text-center py-16 bg-muted/10 rounded-xl border border-dashed border-border">
                <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium text-lg">
                  Nenhum paciente encontrado
                </p>
                <p className="text-muted-foreground/80 text-sm mt-1">
                  {patients.length === 0
                    ? 'A base local está vazia. Clique em "Sincronizar Belle" para carregar os dados reais.'
                    : 'A busca não retornou resultados para o termo digitado.'}
                </p>
              </div>
            ) : (
              sortedPatients.map((patient) => <PatientCard key={patient.id} patient={patient} />)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
