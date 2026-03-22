import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useToast } from '@/hooks/use-toast'
import useSettingsStore from '@/stores/useSettingsStore'
import usePatientStore from '@/stores/usePatientStore'
import useAuditStore from '@/stores/useAuditStore'
import { cn } from '@/lib/utils'
import {
  Key,
  Save,
  ServerCrash,
  RefreshCw,
  Wifi,
  WifiOff,
  Building2,
  Users,
  AlertCircle,
  Stethoscope,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  testBelleConnection,
  testBelleConnectionSimple,
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

  const [url, setUrl] = useState(belleSoftware.url)
  const [token, setToken] = useState(belleSoftware.token)
  const [estabelecimento, setEstabelecimento] = useState(belleSoftware.estabelecimento || '1')
  const [isTesting, setIsTesting] = useState(false)
  const [isTestingSimple, setIsTestingSimple] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  const [errorFeedback, setErrorFeedback] = useState<{
    message: string
    details: string
    title?: string
    raw?: any
  } | null>(null)

  const [lastAction, setLastAction] = useState<'test' | 'test-simple' | 'sync' | null>(null)
  const { toast } = useToast()

  const isConnected = belleSoftware.lastSyncStatus === 'success'
  const isError = belleSoftware.lastSyncStatus === 'error'
  const isConnecting = isTesting || isTestingSimple || isSyncing

  const parseError = (error: any) => {
    let message = 'Falha de Comunicação'
    let details = 'Erro ao conectar com o Belle Software.'
    let title = undefined
    let raw = undefined

    try {
      if (!error) return { message, details }
      if (typeof error === 'string') return { message: 'Erro', details: String(error) }

      if (error instanceof Error) {
        message = error.message
        if ('errorTitle' in error) title = (error as any).errorTitle
        if ('details' in error)
          details =
            typeof (error as any).details === 'string'
              ? (error as any).details
              : JSON.stringify((error as any).details)
        if ('raw' in error) raw = (error as any).raw
      } else if (typeof error === 'object') {
        message = String(error.error || error.message || message)
        details = error.details
          ? typeof error.details === 'string'
            ? error.details
            : JSON.stringify(error.details)
          : JSON.stringify(error)
        raw = error.raw
      }
    } catch (e) {
      details = 'Erro inesperado ao processar log.'
    }

    return { message: String(message), details: String(details), title, raw }
  }

  const sanitizeUrl = (input: string) => {
    if (!input) return input
    let cleanUrl = input.trim().replace(/\/+$/, '')

    if (cleanUrl.startsWith('http://')) cleanUrl = cleanUrl.replace('http://', 'https://')
    else if (!cleanUrl.startsWith('https://')) cleanUrl = `https://${cleanUrl}`

    if (cleanUrl.endsWith('/api.php')) cleanUrl = cleanUrl.slice(0, -8)
    else if (cleanUrl.endsWith('api.php')) cleanUrl = cleanUrl.slice(0, -7)

    return cleanUrl.replace(/\/+$/, '')
  }

  const handleUrlBlur = () => {
    const cleanUrl = sanitizeUrl(url)
    if (cleanUrl !== url) setUrl(cleanUrl)
  }

  const executeAction = async (
    actionName: 'test' | 'test-simple' | 'sync',
    setLoading: (v: boolean) => void,
    actionFn: (sanitizedUrl: string, cleanToken: string, cleanEstab: string) => Promise<any>,
    successMessage: string,
    successDesc: string,
  ) => {
    const cleanUrl = sanitizeUrl(url)
    if (cleanUrl !== url) setUrl(cleanUrl)

    if (!cleanUrl || !token || !estabelecimento) {
      toast({
        title: 'Dados Incompletos',
        description: 'Preencha a URL base, Token e Estabelecimento.',
        variant: 'destructive',
      })
      return
    }

    const cleanToken = token.replace(/[\s\uFEFF\xA0]+/g, '')
    const cleanEstab = estabelecimento.replace(/[\s\uFEFF\xA0]+/g, '')
    setToken(cleanToken)
    setEstabelecimento(cleanEstab)
    setLastAction(actionName)
    setLoading(true)
    setErrorFeedback(null)
    setShowLogs(false)

    updateBelleConfig(cleanUrl, cleanToken, cleanEstab)

    try {
      const result = await actionFn(cleanUrl, cleanToken, cleanEstab)
      setBelleLastSync('success', new Date().toISOString())
      setErrorFeedback(null)
      toast({
        title: successMessage,
        description: typeof result === 'string' ? result : successDesc,
        className: 'bg-green-600 text-white border-none',
      })
    } catch (error: any) {
      setBelleLastSync('error', new Date().toISOString())
      const parsedError = parseError(error)
      setErrorFeedback(parsedError)
      toast({
        title: parsedError.title || parsedError.message,
        description: parsedError.details,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnectionSimple = () =>
    executeAction(
      'test-simple',
      setIsTestingSimple,
      async (u, t, e) => {
        const names = await testBelleConnectionSimple(u, t, e)
        return `Resposta 200 OK. Pacientes validados: ${names.slice(0, 3).join(', ')}${names.length > 3 ? '...' : ''}`
      },
      'Conexão Estabelecida com Sucesso',
      '',
    )

  const handleTestConnection = () =>
    executeAction(
      'test',
      setIsTesting,
      async (u, t, e) => {
        await testBelleConnection(u, t, e)
      },
      'Sucesso',
      'Conexão proxy avançada estabelecida com 200 OK.',
    )

  const handleSyncPatients = () =>
    executeAction(
      'sync',
      setIsSyncing,
      async (u, t, e) => {
        const [rawClientes, rawAgendamentos] = await Promise.all([
          fetchBelleClientes(u, t, e),
          fetchBelleAgendamentos(u, t, undefined, e),
        ])
        const mappedData = mapBelleDataToPatients(rawClientes, rawAgendamentos)
        syncWithBelle(mappedData)
        addLog('Sincronização Belle Software', 'SYSTEM')
        return `${mappedData.length} pacientes importados com sucesso.`
      },
      'Sincronização Concluída',
      '',
    )

  const handleSave = () => {
    const cleanUrl = sanitizeUrl(url)
    const cleanToken = token.replace(/[\s\uFEFF\xA0]+/g, '')
    const cleanEstab = estabelecimento.replace(/[\s\uFEFF\xA0]+/g, '')
    setUrl(cleanUrl)
    setToken(cleanToken)
    setEstabelecimento(cleanEstab)
    updateBelleConfig(cleanUrl, cleanToken, cleanEstab)
    toast({
      title: 'Configurações salvas',
      description: 'As credenciais foram atualizadas localmente.',
    })
  }

  return (
    <Card className="border-none shadow-subtle animate-fade-in-up">
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 gap-4">
        <div className="space-y-1">
          <CardTitle className="text-xl text-primary font-serif">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {isConnecting ? (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 py-1.5 px-3 font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Reconectando
          </Badge>
        ) : isConnected ? (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-600 border-green-500/20 py-1.5 px-3 font-medium"
          >
            <Wifi className="w-3.5 h-3.5 mr-1.5" /> Online
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className={cn(
              'py-1.5 px-3 font-medium',
              isError
                ? 'bg-red-500/10 text-red-600 border-red-500/20'
                : 'bg-muted/50 text-muted-foreground border-border/50',
            )}
          >
            <WifiOff className="w-3.5 h-3.5 mr-1.5" />{' '}
            {isError ? 'Erro de Conexão' : 'Desconectado'}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-w-2xl">
          <div className="bg-muted/30 p-5 rounded-xl border border-border/50 space-y-5">
            <div className="flex items-center gap-2 text-primary font-medium mb-2">
              <ServerCrash className="w-5 h-5" /> Túnel de Proxy Seguro
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-url">URL Base do Belle Software</Label>
              <Input
                id="api-url"
                placeholder="Ex: https://dominio.bellesoftware.com.br"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                className="bg-white font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Conexão via proxy para contornar bloqueios de CORS. O protocolo https:// é
                obrigatório e será ajustado automaticamente.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="api-token">Token de Acesso</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="api-token"
                    type={showToken ? 'text' : 'password'}
                    placeholder="Cole seu token..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="bg-white pl-9 pr-10 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-estabelecimento">Código do Estabelecimento</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="api-estabelecimento"
                    type="number"
                    placeholder="Ex: 1"
                    value={estabelecimento}
                    onChange={(e) => setEstabelecimento(e.target.value)}
                    className="bg-white pl-9 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {errorFeedback && (
            <Alert
              variant="destructive"
              className="animate-fade-in text-sm overflow-hidden border-destructive/30 bg-destructive/5"
            >
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div className="pl-1">
                <AlertTitle className="font-semibold text-base mb-2">
                  {errorFeedback.title || errorFeedback.message}
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  <div className="p-3 bg-white/50 rounded-md border border-destructive/10 font-mono text-xs break-all text-destructive/90">
                    {errorFeedback.details}
                  </div>

                  {errorFeedback.raw && (
                    <div className="mt-2 space-y-2">
                      {errorFeedback.raw.status === 405 && (
                        <div className="p-3 bg-white/50 rounded-md border border-destructive/10 text-xs text-destructive/90 mb-2">
                          <strong>Erro HTTP 405:</strong> O servidor bloqueou o método POST.
                          Verifique se a URL base aponta para o subdomínio exato e se não há barras
                          extras no final.
                        </div>
                      )}

                      <Collapsible open={showLogs} onOpenChange={setShowLogs} className="mt-2">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs font-semibold text-destructive/80 hover:text-destructive hover:bg-destructive/10 bg-transparent border-0 p-0 mb-1"
                          >
                            {showLogs ? (
                              <ChevronUp className="w-3 h-3 mr-1" />
                            ) : (
                              <ChevronDown className="w-3 h-3 mr-1" />
                            )}
                            Ver Logs de Diagnóstico
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-3 bg-slate-950 text-emerald-400 rounded-md font-mono text-xs overflow-auto max-h-40 whitespace-pre-wrap break-all mt-1">
                            {JSON.stringify(errorFeedback.raw, null, 2)}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}

                  <div className="pt-2 border-t border-destructive/10 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        lastAction === 'sync'
                          ? handleSyncPatients()
                          : lastAction === 'test-simple'
                            ? handleTestConnectionSimple()
                            : handleTestConnection()
                      }}
                      className="bg-white border-destructive/20 hover:bg-destructive/10 text-destructive h-8"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-2" /> Tentar Novamente
                    </Button>
                  </div>
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="outline" onClick={handleSave} className="rounded-xl">
              <Save className="w-4 h-4 mr-2" /> Salvar Apenas
            </Button>
            <Button
              variant="outline"
              onClick={handleTestConnectionSimple}
              disabled={isConnecting || !url.trim() || !token.trim() || !estabelecimento.trim()}
              className="rounded-xl border-primary/20 text-primary hover:bg-primary/5"
            >
              {isTestingSimple ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Stethoscope className="w-4 h-4 mr-2" />
              )}
              {isTestingSimple ? 'Testando Proxy...' : 'Testar Conexão'}
            </Button>
            {isConnected && (
              <Button
                onClick={handleSyncPatients}
                disabled={isConnecting}
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm rounded-xl ml-auto"
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Users className="w-4 h-4 mr-2" />
                )}
                {isSyncing ? 'Importando...' : 'Importar Clientes'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
