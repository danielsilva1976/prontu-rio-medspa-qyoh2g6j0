import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import usePatientStore from '@/stores/usePatientStore'
import useSettingsStore from '@/stores/useSettingsStore'
import useAuditStore from '@/stores/useAuditStore'
import { useToast } from '@/hooks/use-toast'
import { PatientDialog } from '@/components/patients/PatientDialog'
import { PatientCard } from '@/components/patients/PatientCard'
import { fetchBelleClientes } from '@/lib/api/belle'

export default function Patients() {
  const { patients, syncWithBelle } = usePatientStore()
  const { belleSoftware, setBelleLastSync } = useSettingsStore()
  const { addLog } = useAuditStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSync = async () => {
    if (!belleSoftware.url || !belleSoftware.token) {
      toast({
        title: 'Configuração Incompleta',
        description:
          'Configure a integração com o Belle Software nas configurações antes de sincronizar.',
        variant: 'destructive',
      })
      return
    }

    setIsSyncing(true)
    try {
      // Fetch data using API mapping
      const rawClientes = await fetchBelleClientes(belleSoftware.url, belleSoftware.token)

      // Map Belle Cliente to Local Patient Partial structure
      const mappedData = rawClientes.map((c) => ({
        belleId: String(c.id),
        name: c.nome,
        cpf: c.cpf,
        email: c.email,
        phone: c.celular,
        dob: c.data_nascimento,
      }))

      // Sync and deduplicate by CPF
      const result = syncWithBelle(mappedData)

      setBelleLastSync('success', new Date().toISOString())
      addLog('Sincronização Belle Software (Pacientes)', 'SYSTEM')

      toast({
        title: 'Sincronização Concluída',
        description: `${result.added} pacientes importados, ${result.updated} atualizados com sucesso.`,
      })
    } catch (error) {
      setBelleLastSync('error', new Date().toISOString())
      addLog('Erro na Sincronização Belle Software', 'SYSTEM')
      toast({
        title: 'Falha na Sincronização',
        description: 'Não foi possível conectar à API do Belle Software. Verifique as credenciais.',
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-primary">Pacientes</h1>
          <p className="text-muted-foreground mt-1">Gestão de pacientes e prontuários</p>
        </div>
        <div className="flex items-center gap-3">
          {belleSoftware.lastSync && (
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
          <Button variant="outline" className="bg-white" onClick={handleSync} disabled={isSyncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sincronizar Belle
          </Button>
          <PatientDialog />
        </div>
      </div>

      <Card className="border-none shadow-subtle">
        <CardContent className="p-4 sm:p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou ID..."
              className="pl-10 h-12 bg-muted/30 border-muted rounded-xl text-base focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid gap-4">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum paciente encontrado.
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
