import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import useSettingsStore from '@/stores/useSettingsStore'
import usePatientStore from '@/stores/usePatientStore'
import useAuditStore from '@/stores/useAuditStore'
import { cn } from '@/lib/utils'
import {
  Save,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Database,
  Activity,
  DownloadCloud,
  Terminal,
} from 'lucide-react'
import {
  testBelleApiConnectionWithRetry,
  fetchBelleClientes,
  fetchBelleAgendamentos,
  mapBelleDataToPatients,
  DiagnosticLog,
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

  const [url, setUrl] = useState(belleSoftware.url)
  const [token, setToken] = useState(belleSoftware.token)
  const [estabelecimento, setEstabelecimento] = useState(belleSoftware.estabelecimento || '1')
  const [contentType, setContentType] = useState<
    'application/x-www-form-urlencoded' | 'multipart/form-data' | 'application/json'
  >(belleSoftware.webhookContentType || 'application/x-www-form-urlencoded')

  // Dynamic field mapping following Belle API structure for adding/testing leads
  const [mapping, setMapping] = useState({
    acao: 'add_cliente',
    nome: 'Paciente Teste API',
    email: 'teste.api@bellesoftware.com',
    celular: '11999999999',
    observacao: 'Dry-run de teste oficial API Postman',
    origem: 'App',
  })

  const [isTesting, setIsTesting] = useState(false)
  const [showMapping, setShowMapping] = useState(false)
  const [diagnosticModalOpen, setDiagnosticModalOpen] = useState(false)

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
    updateBelleConfig(cleanUrl, clToken, clEstab, contentType)

    try {
      // Utilizing the new direct API implementation with auto-retry
      const res = await testBelleApiConnectionWithRetry(cleanUrl, clToken, clEstab, mapping)
      setBelleLastSync('success', new Date().toISOString())

      setDiagnosticData({
        success: true,
        title: 'Conexão API Estabelecida',
        message: `Status ${res.status}`,
        details: 'Handshake completo, payload estruturado e Bypass WAF executado com sucesso.',
        diagnostics: res.diagnostics,
      })
      addLog('Sincronização Teste API Oficial', 'SYSTEM')
    } catch (err: any) {
      setBelleLastSync('error', new Date().toISOString())
      const isWAFBlock = err.raw?.diagnostics?.some(
        (d: any) => d.response?.status === 405 || d.response?.status === 403,
      )

      setDiagnosticData({
        success: false,
        isWarning: isWAFBlock,
        title: isWAFBlock ? 'Aviso de Segurança (WAF Block)' : err.errorTitle || 'Erro',
        message: err.message,
        details:
          err.details ||
          (isWAFBlock
            ? 'Cloudflare/Nginx bloqueou as requisições em todos os Content-Types tentados.'
            : 'Falha na comunicação geral com a API.'),
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
    updateBelleConfig(sanitizeUrl(url), token.trim(), estabelecimento.trim(), contentType)
    toast({ title: 'Configurações salvas' })
  }

  return (
    <Card className="border-none shadow-subtle animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-xl text-primary font-serif">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-w-2xl">
          <div className="bg-muted/30 p-5 rounded-xl border border-border/50 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-primary font-medium mb-1">
                <Database className="w-5 h-5" /> Motor de Integração API Oficial (Postman)
              </div>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                Conexão direta estruturada baseada na documentação oficial da API. Utiliza mimetismo
                de navegador e assinatura de Headers TLS para bypass de WAF.
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
                <Label>Token de Integração</Label>
                <Input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="bg-white font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>idEstabelecimento</Label>
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
                    <Activity className="w-4 h-4 mr-2 text-primary" /> Mapeamento Dry-run
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

          {diagnosticData && (
            <Alert
              variant={
                diagnosticData.success || diagnosticData.isWarning ? 'default' : 'destructive'
              }
              className={cn(
                diagnosticData.success
                  ? 'bg-green-500/10 text-green-800 border-green-500/20'
                  : diagnosticData.isWarning
                    ? 'bg-yellow-500/10 text-yellow-800 border-yellow-500/20'
                    : 'bg-destructive/5 text-destructive border-destructive/20',
              )}
            >
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div className="pl-1 w-full">
                <AlertTitle className="font-semibold text-base mb-2">
                  {diagnosticData.title}
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  <div className="p-3 bg-white/60 rounded-md border border-black/5 font-mono text-xs break-all leading-relaxed">
                    {diagnosticData.details}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDiagnosticModalOpen(true)}
                    className="bg-white hover:bg-muted h-8 w-full sm:w-auto shadow-sm border-slate-300"
                  >
                    <Terminal className="w-3.5 h-3.5 mr-2" /> Ver Console de Diagnóstico
                  </Button>
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="outline" onClick={handleSave} className="rounded-xl shadow-sm">
              <Save className="w-4 h-4 mr-2" /> Salvar Configuração
            </Button>
            <Button
              variant="outline"
              onClick={handleTestApi}
              disabled={isConnecting}
              className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
            >
              {isTesting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Activity className="w-4 h-4 mr-2" />
              )}{' '}
              Testar Conexão API
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

      <Dialog open={diagnosticModalOpen} onOpenChange={setDiagnosticModalOpen}>
        <DialogContent className="max-w-4xl bg-[#0f172a] text-slate-300 border-slate-800 shadow-2xl p-0">
          <DialogHeader className="p-6 pb-4 border-b border-slate-800">
            <DialogTitle className="text-slate-100 flex items-center gap-2 font-mono text-base">
              <Terminal className="w-5 h-5 text-emerald-400" /> Console de Diagnóstico (Log Bruto)
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4 overflow-auto max-h-[70vh] bg-black/40 space-y-6">
            {diagnosticData?.diagnostics?.map((log, i) => (
              <div
                key={i}
                className="border border-slate-700/50 rounded-lg bg-[#1e293b]/50 overflow-hidden"
              >
                <div className="bg-slate-800/80 px-4 py-2 text-xs text-slate-300 font-bold uppercase tracking-wider flex justify-between items-center">
                  <span>Tentativa {i + 1} - Payload</span>
                  <span className="text-sky-300 lowercase normal-case opacity-70">
                    {log.request.headers['Content-Type']?.split(';')[0]}
                  </span>
                </div>
                <div className="p-4 grid md:grid-cols-2 gap-4 divide-x divide-slate-700/50">
                  <div className="pr-4 overflow-hidden">
                    <h4 className="text-emerald-400 text-xs mb-2 flex items-center gap-1.5 font-bold uppercase tracking-widest">
                      <ChevronRight className="w-3 h-3" /> Request
                    </h4>
                    <pre className="text-[11px] text-slate-300 whitespace-pre-wrap break-all bg-black/30 p-3 rounded font-mono leading-relaxed max-h-[400px] overflow-auto">
                      {JSON.stringify(log.request, null, 2)}
                    </pre>
                  </div>
                  <div className="pl-4 overflow-hidden">
                    <h4 className="text-sky-400 text-xs mb-2 flex items-center gap-1.5 font-bold uppercase tracking-widest">
                      <ChevronLeft className="w-3 h-3" /> Response
                    </h4>
                    <pre className="text-[11px] text-slate-300 whitespace-pre-wrap break-all bg-black/30 p-3 rounded font-mono leading-relaxed max-h-[400px] overflow-auto">
                      {JSON.stringify(log.response, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
            {!diagnosticData?.diagnostics?.length && (
              <div className="text-center text-slate-500 py-10 font-mono text-sm">
                Nenhum log detalhado disponível.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function ChevronRight(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function ChevronLeft(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}
