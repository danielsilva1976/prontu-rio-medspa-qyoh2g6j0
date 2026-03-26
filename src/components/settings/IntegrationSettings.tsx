import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import useSettingsStore from '@/stores/useSettingsStore'
import usePatientStore from '@/stores/usePatientStore'
import useAuditStore from '@/stores/useAuditStore'
import {
  Save,
  AlertCircle,
  Database,
  Activity,
  DownloadCloud,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import {
  testarConexaoBelle,
  fetchBelleClientes,
  fetchBelleAgendamentos,
  mapBelleDataToPatients,
} from '@/lib/api/belle'

export function IntegrationSettings({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const { belleSoftware, updateBelleConfig, setBelleLastSync } = useSettingsStore()
  const { isSyncing, setIsSyncing, syncWithBelle } = usePatientStore()
  const { addLog } = useAuditStore()
  const { toast } = useToast()

  const [estabelecimento, setEstabelecimento] = useState(belleSoftware.estabelecimento || '1')

  const [isTesting, setIsTesting] = useState(false)

  const [diagnosticData, setDiagnosticData] = useState<{
    success: boolean
    message: string
    details: string
    title?: string
  } | null>(null)

  const isConnected = belleSoftware.lastSyncStatus === 'success'
  const isConnecting = isTesting || isSyncing

  const handleTestApi = async () => {
    const clEstab = estabelecimento.replace(/[\s\uFEFF\xA0]+/g, '')

    if (!clEstab) {
      toast({ title: 'Dados Ausentes', variant: 'destructive' })
      return
    }

    setEstabelecimento(clEstab)
    setIsTesting(true)
    updateBelleConfig(clEstab, 'application/json')
    setDiagnosticData(null)

    try {
      const res = await testarConexaoBelle(clEstab)

      if (res.success) {
        setBelleLastSync('success', new Date().toISOString())
        setDiagnosticData({
          success: true,
          title: `Autenticação e Conexão Estabelecidas`,
          message: `Teste de Conexão Concluído`,
          details: `A comunicação com a Belle API foi realizada com sucesso.\nStatus de Autenticação: Válido\n\nURL: ${res.debug?.url}\nMétodo: ${res.debug?.method}\nStatus HTTP: ${res.debug?.status}\nEstabelecimento: ${res.debug?.codEstab}\nResposta (amostra): ${res.debug?.rawBody?.substring(0, 150)}...`,
        })
        addLog('Sincronização Teste API Oficial', 'SYSTEM')
      } else {
        throw new Error('Falha desconhecida no teste de conexão')
      }
    } catch (err: any) {
      setBelleLastSync('error', new Date().toISOString())

      const is405 = err.message.includes('405')
      const status =
        err.status ||
        (err.message.match(/HTTP (\d+)/) ? err.message.match(/HTTP (\d+)/)[1] : 'Desconhecido')

      setDiagnosticData({
        success: false,
        title: is405 ? 'Contract Error (HTTP 405)' : `Erro de API (HTTP ${status})`,
        message: 'Falha no Teste de Conexão',
        details: err.rawBody
          ? `URL: ${err.url || 'Desconhecido'}\nHost: ${err.host || 'Desconhecido'}\nMétodo: ${err.method || 'GET'}\nStatus HTTP: ${status}\n\nResposta Bruta:\n${err.rawBody}`
          : err.message,
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSyncPatients = async () => {
    setIsSyncing(true)
    try {
      const [rawC, rawA] = await Promise.all([
        fetchBelleClientes(estabelecimento),
        fetchBelleAgendamentos(estabelecimento),
      ])
      syncWithBelle(mapBelleDataToPatients(rawC, rawA))
      toast({ title: 'Sincronização Concluída', className: 'bg-green-600 text-white' })
    } catch (e: any) {
      toast({ title: 'Falha na Sincronização', description: e.message, variant: 'destructive' })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSave = () => {
    updateBelleConfig(estabelecimento.trim(), 'application/json')
    toast({ title: 'Configurações salvas' })
  }

  const tokenConfigured = Boolean(import.meta.env.VITE_BELLE_TOKEN)

  return (
    <Card className="border-none shadow-subtle animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-xl text-primary font-serif">Integração Belle Software</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-w-3xl">
          <div className="bg-muted/30 p-5 rounded-xl border border-border/50 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Database className="w-5 h-5" /> Integração Direta API
                </div>
                {tokenConfigured ? (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none"
                  >
                    Token Identificado
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-none"
                  >
                    Token Ausente
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                A integração agora é realizada de forma direta com a API do Belle Software (URL
                Absoluta), evitando roteamentos locais que poderiam causar bloqueios ou retornar o
                HTML da aplicação. Defina o estabelecimento de origem para a sincronização da
                clínica.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Código do Estabelecimento (codEstab)</Label>
              <Input
                value={estabelecimento}
                onChange={(e) => setEstabelecimento(e.target.value)}
                className="bg-white font-mono text-sm max-w-[200px]"
                placeholder="1"
              />
            </div>
          </div>

          {diagnosticData?.success && (
            <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div className="pl-1 w-full">
                <AlertTitle className="font-semibold text-base mb-1 text-emerald-800">
                  {diagnosticData.title}
                </AlertTitle>
                <AlertDescription className="text-sm text-emerald-700 leading-relaxed font-medium">
                  <div className="p-3 mt-2 rounded-md border text-xs leading-relaxed bg-white/60 border-emerald-200/50 break-words whitespace-pre-wrap font-mono">
                    {diagnosticData.details}
                  </div>
                </AlertDescription>
              </div>
            </Alert>
          )}

          {diagnosticData && !diagnosticData.success && (
            <Alert
              variant="destructive"
              className="animate-in fade-in slide-in-from-top-2 shadow-sm bg-rose-50 text-rose-900 border-rose-200"
            >
              <AlertCircle className="h-5 w-5 mt-0.5 text-rose-600" />
              <div className="pl-1 w-full">
                <AlertTitle className="font-semibold text-base mb-2">
                  {diagnosticData.title}
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  <div className="p-3 rounded-md border text-xs leading-relaxed bg-white/60 border-rose-200/50 break-words whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                    {diagnosticData.details}
                  </div>
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button onClick={handleSave} className="rounded-xl shadow-sm">
              <Save className="w-4 h-4 mr-2" /> Salvar Configuração
            </Button>
            <Button
              variant="outline"
              onClick={handleTestApi}
              disabled={isConnecting}
              className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Activity className="w-4 h-4 mr-2" />
              )}{' '}
              Validar Conexão Direta
            </Button>
            {isConnected && (
              <Button
                onClick={handleSyncPatients}
                disabled={isConnecting}
                variant="secondary"
                className="rounded-xl ml-auto shadow-sm"
              >
                <DownloadCloud className="w-4 h-4 mr-2" /> Sincronizar Base
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
