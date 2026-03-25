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
import { cn } from '@/lib/utils'
import {
  Save,
  AlertCircle,
  Database,
  Activity,
  DownloadCloud,
  Terminal,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import {
  runIncrementalValidationFlow,
  fetchBelleClientes,
  fetchBelleAgendamentos,
  mapBelleDataToPatients,
  DiagnosticLog,
} from '@/lib/api/belle'

export function IntegrationSettings({ description }: { title: string; description: string }) {
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
    diagnostics?: DiagnosticLog[]
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

    try {
      const res = await runIncrementalValidationFlow(clEstab)

      if (res.success) {
        setBelleLastSync('success', new Date().toISOString())
        setDiagnosticData({
          success: true,
          title: `Conexão API Estabelecida`,
          message: `Validação Incremental Concluída`,
          details: `Todos os 4 passos contratuais foram validados com sucesso. A API responde adequadamente aos métodos HTTP específicos pelo Backend.`,
          diagnostics: res.diagnostics,
        })
        addLog('Sincronização Teste API Oficial', 'SYSTEM')
      } else {
        setBelleLastSync('error', new Date().toISOString())
        const lastLog = res.diagnostics[res.diagnostics.length - 1]
        const is405 = lastLog?.is405

        setDiagnosticData({
          success: false,
          title: is405
            ? 'Contract Error (HTTP 405)'
            : `Erro de API (HTTP ${lastLog?.response?.status || 'Desconhecido'})`,
          message: 'Falha na Validação Incremental',
          details: is405
            ? 'Erro Contratual (HTTP 405 Method Not Allowed): Suspeita de método incorreto (GET/POST/PUT) ou caminho não existente na API.'
            : 'Falha na comunicação direta com a API no passo: ' + lastLog?.step,
          diagnostics: res.diagnostics,
        })
      }
    } catch (err: any) {
      setBelleLastSync('error', new Date().toISOString())
      setDiagnosticData({
        success: false,
        title: 'Erro de Execução Interna',
        message: err.message,
        details: 'Falha ao executar o fluxo de teste. Verifique sua conexão com o Backend.',
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
              <div className="flex items-center gap-2 text-primary font-medium mb-1">
                <Database className="w-5 h-5" /> Integração REST API Segura (Backend)
              </div>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                A integração agora é realizada estritamente pelo backend para máxima segurança.
                Tokens de acesso e credenciais não são expostos ao frontend. Defina apenas o
                estabelecimento de origem para a sincronização da clínica.
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
                  {diagnosticData.details}
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
                  <div className="p-3 rounded-md border text-xs leading-relaxed bg-white/60 border-rose-200/50 break-words whitespace-pre-wrap font-mono">
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
              Validar Contrato da API
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

          {diagnosticData?.diagnostics && (
            <div className="mt-8 pt-8 border-t border-border/50 animate-fade-in">
              <h3 className="text-lg font-medium flex items-center gap-2 text-primary mb-4">
                <Terminal className="w-5 h-5" /> Console de Diagnóstico Contratual
              </h3>
              <div className="space-y-4">
                {diagnosticData.diagnostics.map((log, i) => (
                  <Card
                    key={i}
                    className={cn(
                      'border-slate-800 shadow-md overflow-hidden bg-[#0f172a] text-slate-300',
                      log.error ? 'border-rose-900/50' : '',
                    )}
                  >
                    <div className="bg-[#1e293b] px-4 py-3 flex items-center justify-between border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="font-mono border-slate-600 bg-slate-800 text-sky-400"
                        >
                          {log.request.method}
                        </Badge>
                        <span className="font-semibold text-sm text-slate-200">{log.step}</span>
                      </div>
                      {log.response?.status && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-mono border-0 font-bold',
                            log.response.status >= 200 && log.response.status < 300
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400',
                          )}
                        >
                          HTTP {log.response.status}
                        </Badge>
                      )}
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex flex-col gap-1">
                          <span className="text-emerald-400 font-bold">URL:</span>
                          <span className="break-all text-slate-300 bg-black/40 p-1.5 rounded">
                            {log.request.url}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-emerald-400 font-bold">QUERY PARAMS:</span>
                            <pre className="bg-black/40 p-2 rounded text-slate-300 overflow-x-auto">
                              {Object.keys(log.request.queryParams).length > 0
                                ? JSON.stringify(log.request.queryParams, null, 2)
                                : 'Nenhum'}
                            </pre>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-emerald-400 font-bold">HEADERS:</span>
                            <pre className="bg-black/40 p-2 rounded text-slate-300 overflow-x-auto">
                              {JSON.stringify(log.request.headers || {}, null, 2)}
                            </pre>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 mt-2">
                          <span className="text-emerald-400 font-bold">BODY:</span>
                          <pre className="bg-black/40 p-2 rounded text-slate-300 overflow-x-auto whitespace-pre-wrap">
                            {log.request.body === 'vazio'
                              ? 'vazio'
                              : JSON.stringify(log.request.body, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800 space-y-2 text-xs font-mono">
                        <div className="flex flex-col gap-1">
                          <span className="text-sky-400 font-bold">STATUS:</span>
                          <span className="text-slate-300">{log.response?.status || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sky-400 font-bold">RESPONSE:</span>
                          <pre className="bg-black/40 p-2 rounded text-slate-300 overflow-auto max-h-[300px] whitespace-pre-wrap">
                            {log.response?.body
                              ? typeof log.response.body === 'string'
                                ? log.response.body
                                : JSON.stringify(log.response.body, null, 2)
                              : log.error || 'Sem resposta'}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
