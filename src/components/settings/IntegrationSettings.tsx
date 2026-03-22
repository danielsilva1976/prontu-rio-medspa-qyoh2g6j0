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
  Webhook,
  Send,
  DownloadCloud,
  Terminal,
} from 'lucide-react'
import {
  testBelleWebhookConnection,
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

  const [url, setUrl] = useState(belleSoftware.url)
  const [token, setToken] = useState(belleSoftware.token)
  const [estabelecimento, setEstabelecimento] = useState(belleSoftware.estabelecimento || '1')
  const [contentType, setContentType] = useState<
    'application/x-www-form-urlencoded' | 'multipart/form-data'
  >(belleSoftware.webhookContentType || 'multipart/form-data')

  const [mapping, setMapping] = useState({
    nome: 'Paciente Teste',
    email: 'teste@pluga.co',
    celular: '11999999999',
    telefone: '',
    estado: 'SP',
    cidade: 'São Paulo',
    observacao: 'Dry-run de teste',
    profissao: 'Engenheiro',
    tags: 'teste, api',
    dataCadastro: new Date().toISOString().split('T')[0],
    origem: 'App',
    idCampanha: '',
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
    raw?: any
  } | null>(null)

  const isConnected = belleSoftware.lastSyncStatus === 'success'
  const isConnecting = isTesting || isSyncing

  const sanitizeUrl = (u: string) => {
    let cl = u.trim().replace(/\/+$/, '')
    if (cl && !cl.startsWith('http')) cl = `https://${cl}`
    return cl.replace('http://', 'https://')
  }

  const handleTestWebhook = async () => {
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
      const payload = { ...mapping, idEstabelecimento: clEstab }
      const res = await testBelleWebhookConnection(cleanUrl, clToken, payload, contentType)
      setBelleLastSync('success', new Date().toISOString())

      setDiagnosticData({
        success: true,
        title: 'Webhook Enviado com Sucesso',
        message: `Status ${res.status}`,
        details: 'O servidor aceitou a requisição e os headers foram processados corretamente.',
        raw: res,
      })
      addLog('Sincronização Teste Webhook (Pluga)', 'SYSTEM')
    } catch (err: any) {
      setBelleLastSync('error', new Date().toISOString())
      const isCloudflare =
        err.raw?.headers?.server?.toLowerCase().includes('cloudflare') || err.raw?.status === 405

      setDiagnosticData({
        success: false,
        isWarning: isCloudflare,
        title: isCloudflare
          ? 'Aviso de WAF: Bloqueio (405 Method Not Allowed)'
          : err.errorTitle || 'Erro',
        message: err.message,
        details:
          err.details ||
          (isCloudflare
            ? 'Cloudflare ou Nginx bloqueou a requisição devido aos headers ou formato.'
            : 'Falha na comunicação.'),
        raw: err.raw,
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
                <Webhook className="w-5 h-5" /> Motor de Integração Webhook (Pluga / RD Station)
              </div>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                Configuração avançada projetada para contornar bloqueios de WAF garantindo a
                sincronização estável usando mimetismo de navegador.
              </p>
            </div>

            <div className="space-y-2">
              <Label>URL do Endpoint HTTPS</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={() => setUrl(sanitizeUrl(url))}
                placeholder="https://app.bellesoftware.com.br/webhooks/pluga/RDStation.php"
                className="bg-white font-mono"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Token de Integração</Label>
                <Input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="bg-white font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Formato do Payload</Label>
                <Select value={contentType} onValueChange={(val: any) => setContentType(val)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multipart/form-data">
                      Multipart Form Data (Padrão)
                    </SelectItem>
                    <SelectItem value="application/x-www-form-urlencoded">URL Encoded</SelectItem>
                  </SelectContent>
                </Select>
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
                    <Send className="w-4 h-4 mr-2 text-primary" /> Mapeamento Dry-run
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
                      className="bg-white text-xs h-8"
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
                    className="bg-white hover:bg-muted h-8 w-full sm:w-auto shadow-sm"
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
              onClick={handleTestWebhook}
              disabled={isConnecting}
              className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
            >
              {isTesting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}{' '}
              Testar Conexão
            </Button>
            {isConnected && (
              <Button
                onClick={handleSyncPatients}
                disabled={isConnecting}
                variant="secondary"
                className="rounded-xl ml-auto shadow-sm"
              >
                <DownloadCloud className="w-4 h-4 mr-2" /> Sincronizar
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <Dialog open={diagnosticModalOpen} onOpenChange={setDiagnosticModalOpen}>
        <DialogContent className="max-w-3xl bg-[#0f172a] text-slate-300 border-slate-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2 font-mono text-base">
              <Terminal className="w-5 h-5" /> Console de Diagnóstico (Log Bruto)
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-black/60 rounded-md overflow-auto max-h-[60vh] border border-slate-800">
            <pre className="text-xs text-emerald-400 whitespace-pre-wrap break-all font-mono leading-relaxed">
              {JSON.stringify(diagnosticData?.raw, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
