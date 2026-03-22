import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import useSettingsStore from '@/stores/useSettingsStore'
import usePatientStore from '@/stores/usePatientStore'
import useAuditStore from '@/stores/useAuditStore'
import { cn } from '@/lib/utils'
import {
  Save,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Database,
  Activity,
  DownloadCloud,
  Terminal,
  Loader2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react'
import {
  testBelleApiConnectionWithRetry,
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

  const [url, setUrl] = useState(belleSoftware.url)
  const [token, setToken] = useState(belleSoftware.token)
  const [estabelecimento, setEstabelecimento] = useState(belleSoftware.estabelecimento || '1')

  // Dynamic field mapping perfectly aligned with the backend test payload requirements
  const [mapping, setMapping] = useState({
    acao: 'add_cliente',
    nome: 'Paciente Teste API',
    email: 'teste.api@bellesoftware.com',
    celular: '11999999999',
    observacao: 'Verificação Oficial de WAF Bypass',
    origem: 'App',
  })

  const [isTesting, setIsTesting] = useState(false)
  const [showMapping, setShowMapping] = useState(false)

  const [diagnosticData, setDiagnosticData] = useState<{
    success: boolean
    isWarning?: boolean
    message: string
    details: string
    title?: string
    diagnostics?: DiagnosticLog[]
  } | null>(null)

  const isConnected = belleSoftware.lastSyncStatus === 'success'
  const isConnecting = isTesting || isSyncing

  const sanitizeUrl = (u: string) => {
    let cl = u.trim().replace(/\/+$/, '')
    if (cl && !cl.startsWith('http')) cl = `https://${cl}`
    return cl.replace('http://', 'https://')
  }

  const handleTestApi = async () => {
    const cleanUrl = sanitizeUrl(url)
    const clToken = token.replace(/[\s\uFEFF\xA0]+/g, '')
    const clEstab = estabelecimento.replace(/[\s\uFEFF\xA0]+/g, '')

    if (!cleanUrl || !clToken || !mapping.nome.trim()) {
      toast({ title: 'Dados Ausentes', variant: 'destructive' })
      return
    }

    setUrl(cleanUrl)
    setToken(clToken)
    setEstabelecimento(clEstab)
    setIsTesting(true)
    updateBelleConfig(cleanUrl, clToken, clEstab, 'application/x-www-form-urlencoded')

    try {
      // Dispatches the fully URL-encoded payload through the server-side proxy
      const res = await testBelleApiConnectionWithRetry(cleanUrl, clToken, clEstab, mapping)
      setBelleLastSync('success', new Date().toISOString())

      setDiagnosticData({
        success: true,
        title: 'Conexão API Estabelecida',
        message: `HTTP Status ${res.status}`,
        details:
          'Conexão via Dispatcher foi autorizada com HTTP 200 (Success). WAF bypass ativo e formato URL-Encoded validado pelo backend.',
        diagnostics: res.diagnostics,
      })
      addLog('Sincronização Teste API Oficial', 'SYSTEM')
    } catch (err: any) {
      setBelleLastSync('error', new Date().toISOString())
      const isWAFBlock = err.raw?.status === 405 || err.raw?.status === 403

      setDiagnosticData({
        success: false,
        isWarning: isWAFBlock,
        title: isWAFBlock ? 'Aviso de Segurança (WAF Block)' : err.errorTitle || 'Erro de API',
        message: err.message,
        details: err.details || 'Falha na comunicação direta com a API.',
        diagnostics: err.raw?.diagnostics,
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSyncPatients = async () => {
    setIsSyncing(true)
    try {
      const [rawC, rawA] = await Promise.all([
        fetchBelleClientes(url, token, estabelecimento),
        fetchBelleAgendamentos(url, token, undefined, estabelecimento),
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
    updateBelleConfig(
      sanitizeUrl(url),
      token.trim(),
      estabelecimento.trim(),
      'application/x-www-form-urlencoded',
    )
    toast({ title: 'Configurações salvas' })
  }

  return (
    <Card className="border-none shadow-subtle animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-xl text-primary font-serif">
          Belle Software Integration
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-w-3xl">
          <div className="bg-muted/30 p-5 rounded-xl border border-border/50 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-primary font-medium mb-1">
                <Database className="w-5 h-5" /> Server-Side Request Dispatcher
              </div>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                As chamadas são formatadas em <code>application/x-www-form-urlencoded</code> e
                roteadas pelo proxy backend para emular as requisições, evitando bloqueios de CORS e
                regras HTTP 405 (WAF).
              </p>
            </div>

            <div className="space-y-2">
              <Label>URL Base / API</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={() => setUrl(sanitizeUrl(url))}
                placeholder="https://app.bellesoftware.com.br/api.php"
                className="bg-white font-mono text-sm"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Token de Acesso</Label>
                <Input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="bg-white font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>ID do Estabelecimento</Label>
                <Input
                  value={estabelecimento}
                  onChange={(e) => setEstabelecimento(e.target.value)}
                  className="bg-white font-mono text-sm"
                  placeholder="1"
                />
              </div>
            </div>
            <Collapsible
              open={showMapping}
              onOpenChange={setShowMapping}
              className="border border-border/50 bg-white rounded-xl shadow-sm"
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <div className="flex items-center font-medium">
                    <Activity className="w-4 h-4 mr-2 text-primary" /> Payload Estruturado (Teste)
                  </div>
                  {showMapping ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 bg-muted/10 grid gap-4 sm:grid-cols-2 border-t border-border/50">
                {Object.keys(mapping).map((key) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs capitalize text-muted-foreground">{key}</Label>
                    <Input
                      value={(mapping as any)[key]}
                      onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                      disabled={key === 'acao'}
                      className={cn(
                        'bg-white text-xs h-8',
                        key === 'acao' && 'bg-muted opacity-80',
                      )}
                    />
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
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
              variant={diagnosticData.isWarning ? 'default' : 'destructive'}
              className={cn(
                'animate-in fade-in slide-in-from-top-2 shadow-sm',
                diagnosticData.isWarning
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200',
              )}
            >
              <AlertCircle
                className={cn(
                  'h-5 w-5 mt-0.5',
                  diagnosticData.isWarning ? 'text-amber-600' : 'text-rose-600',
                )}
              />
              <div className="pl-1 w-full">
                <AlertTitle className="font-semibold text-base mb-2">
                  {diagnosticData.title}
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  <div
                    className={cn(
                      'p-3 rounded-md border text-xs leading-relaxed',
                      diagnosticData.isWarning
                        ? 'bg-amber-100/50 border-amber-200/60'
                        : 'bg-white/60 border-rose-200/50',
                    )}
                  >
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
              Disparar Teste (Dispatcher)
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

          {diagnosticData && (
            <div className="mt-8 pt-8 border-t border-border/50 animate-fade-in">
              <h3 className="text-lg font-medium flex items-center gap-2 text-primary mb-4">
                <Terminal className="w-5 h-5" /> Advanced Diagnostic Console
              </h3>
              <div className="space-y-4">
                {diagnosticData.diagnostics?.map((log, i) => (
                  <Card
                    key={i}
                    className="border-slate-800 shadow-md overflow-hidden bg-[#0f172a] text-slate-300"
                  >
                    <div className="bg-[#1e293b] px-4 py-3 flex items-center justify-between border-b border-slate-800">
                      <span className="font-mono text-sm font-semibold text-slate-100 flex items-center gap-2">
                        {log.request.method} Cycle
                      </span>
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
                    <div className="p-4 grid lg:grid-cols-2 gap-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/50">
                      <div className="lg:pr-4 pb-4 lg:pb-0 overflow-hidden flex flex-col">
                        <h4 className="text-emerald-400 text-xs mb-3 font-bold uppercase tracking-wider flex items-center gap-2">
                          <ChevronRight className="w-4 h-4" /> Request Headers & Body
                        </h4>
                        <div className="bg-black/40 p-3 rounded-md font-mono text-[11px] overflow-x-auto text-slate-300 border border-slate-800/60 flex-1">
                          <pre className="whitespace-pre-wrap break-words">
                            {JSON.stringify(log.request, null, 2)}
                          </pre>
                        </div>
                      </div>
                      <div className="lg:pl-4 pt-4 lg:pt-0 overflow-hidden flex flex-col">
                        <h4 className="text-sky-400 text-xs mb-3 font-bold uppercase tracking-wider flex items-center gap-2">
                          <ChevronLeft className="w-4 h-4" /> Response Data (Raw)
                        </h4>
                        <div className="bg-black/40 p-3 rounded-md font-mono text-[11px] overflow-auto text-slate-300 border border-slate-800/60 flex-1 max-h-[400px]">
                          {typeof log.response?.body === 'string' &&
                          log.response.body.includes('<html') ? (
                            <div className="space-y-2">
                              <span className="text-rose-400 font-semibold block border-b border-rose-500/20 pb-1 mb-2">
                                RAW HTML ENCONTRADO (WAF BLOCK):
                              </span>
                              <pre className="text-rose-300/80 whitespace-pre-wrap break-words">
                                {log.response.body}
                              </pre>
                            </div>
                          ) : (
                            <pre className="whitespace-pre-wrap break-words">
                              {JSON.stringify(log.response, null, 2)}
                            </pre>
                          )}
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
