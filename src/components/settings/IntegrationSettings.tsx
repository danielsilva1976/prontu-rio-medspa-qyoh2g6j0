import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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

  const parseError = (
    error: any,
  ): { message: string; details: string; title?: string; raw?: any } => {
    let message = 'Falha de Comunicação'
    let details =
      'Erro ao conectar com o Belle Software. Verifique suas credenciais e a disponibilidade do proxy.'
    let title = undefined
    let raw = undefined

    try {
      if (!error) return { message, details }

      if (typeof error === 'string') {
        return { message: 'Erro', details: String(error) }
      }

      if (error instanceof Error) {
        message = error.message
        if ('errorTitle' in error && (error as any).errorTitle) {
          title = (error as any).errorTitle
        }
        if ('details' in error && (error as any).details) {
          const d = (error as any).details
          details = typeof d === 'string' ? d : JSON.stringify(d)
        }
        if ('raw' in error) {
          raw = (error as any).raw
        }
      } else if (typeof error === 'object') {
        message = String(error.error || error.message || message)
        if (error.details) {
          details =
            typeof error.details === 'string' ? error.details : JSON.stringify(error.details)
        } else {
          details = JSON.stringify(error)
        }
        if (error.raw) {
          raw = error.raw
        }
      }
    } catch (e) {
      details = 'Ocorreu um erro inesperado ao processar os detalhes da falha.'
    }

    return { message: String(message), details: String(details), title, raw }
  }

  const handleUrlBlur = () => {
    if (!url) return
    let cleanUrl = url.trim().replace(/\/+$/, '')

    if (cleanUrl.startsWith('http://')) {
      cleanUrl = cleanUrl.replace('http://', 'https://')
    } else if (!cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`
    }

    if (cleanUrl.endsWith('/api.php')) {
      cleanUrl = cleanUrl.slice(0, -8)
    } else if (cleanUrl.endsWith('api.php')) {
      cleanUrl = cleanUrl.slice(0, -7)
    }

    if (cleanUrl !== url) {
      setUrl(cleanUrl)
    }
  }

  const handleTestConnectionSimple = async () => {
    if (!url || !token || !estabelecimento) {
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
    setLastAction('test-simple')

    setIsTestingSimple(true)
    setErrorFeedback(null)

    updateBelleConfig(url, cleanToken, cleanEstab)

    try {
      const names = await testBelleConnectionSimple(url, cleanToken, cleanEstab)
      setBelleLastSync('success', new Date().toISOString())
      setErrorFeedback(null)

      const preview = names.slice(0, 3).join(', ')

      toast({
        title: 'Conexão Estabelecida com Sucesso',
        description: `Resposta 200 OK do Belle Software. Pacientes validados: ${preview}${names.length > 3 ? '...' : ''}`,
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
      setIsTestingSimple(false)
    }
  }

  const handleTestConnection = async () => {
    if (!url || !token || !estabelecimento) {
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
    setLastAction('test')

    setIsTesting(true)
    setErrorFeedback(null)

    updateBelleConfig(url, cleanToken, cleanEstab)

    try {
      await testBelleConnection(url, cleanToken, cleanEstab)
      setBelleLastSync('success', new Date().toISOString())
      setErrorFeedback(null)

      toast({
        title: 'Sucesso',
        description: 'Conexão proxy avançada estabelecida com 200 OK.',
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
      setIsTesting(false)
    }
  }

  const handleSyncPatients = async () => {
    setLastAction('sync')
    setIsSyncing(true)
    setErrorFeedback(null)

    toast({
      title: 'Sincronização Iniciada',
      description: 'Buscando pacientes via túnel de proxy...',
    })

    try {
      const cleanToken = token.replace(/[\s\uFEFF\xA0]+/g, '')
      const cleanEstab = estabelecimento.replace(/[\s\uFEFF\xA0]+/g, '')

      const [rawClientes, rawAgendamentos] = await Promise.all([
        fetchBelleClientes(url, cleanToken, cleanEstab),
        fetchBelleAgendamentos(url, cleanToken, undefined, cleanEstab),
      ])

      const mappedData = mapBelleDataToPatients(rawClientes, rawAgendamentos)

      syncWithBelle(mappedData)

      setBelleLastSync('success', new Date().toISOString())
      addLog('Sincronização Belle Software (Proxy Bypass)', 'SYSTEM')

      toast({
        title: 'Sincronização Concluída',
        description: `${mappedData.length} pacientes importados com sucesso.`,
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
      setIsSyncing(false)
    }
  }

  const handleSave = () => {
    const cleanToken = token.replace(/[\s\uFEFF\xA0]+/g, '')
    const cleanEstab = estabelecimento.replace(/[\s\uFEFF\xA0]+/g, '')

    setToken(cleanToken)
    setEstabelecimento(cleanEstab)
    updateBelleConfig(url, cleanToken, cleanEstab)

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
            className="bg-blue-500/10 text-blue-600 border-blue-500/20 py-1.5 px-3 font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            Connecting...
          </Badge>
        ) : isConnected ? (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-600 border-green-500/20 py-1.5 px-3 font-medium"
          >
            <Wifi className="w-3.5 h-3.5 mr-1.5" />
            Bridge Online
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
            <WifiOff className="w-3.5 h-3.5 mr-1.5" />
            {isError ? 'Connection Failed' : 'Desconectado'}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-w-2xl">
          <div className="bg-muted/30 p-5 rounded-xl border border-border/50 space-y-5">
            <div className="flex items-center gap-2 text-primary font-medium mb-2">
              <ServerCrash className="w-5 h-5" />
              Túnel de Proxy Seguro
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
                Conexão via túnel de proxy interno (Server-to-Server) formatado em
                application/x-www-form-urlencoded para contornar bloqueios de CORS e segurança
                Nginx.
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
                    placeholder="Cole seu token gerado..."
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
                      {errorFeedback.raw.status && (
                        <div className="flex gap-2 text-xs font-semibold text-destructive/90">
                          <span>Status Code: {errorFeedback.raw.status}</span>
                          <span>{errorFeedback.raw.statusText}</span>
                        </div>
                      )}

                      {errorFeedback.raw.status === 405 && (
                        <div className="p-3 bg-white/50 rounded-md border border-destructive/10 text-xs text-destructive/90 mb-2">
                          <strong>Ação Recomendada:</strong> O erro "405 Not Allowed" indica que o
                          servidor bloqueou o método POST.
                          <ul className="list-disc ml-4 mt-1 space-y-1">
                            <li>
                              Verifique se a URL base está apontando para o subdomínio exato da
                              clínica.
                            </li>
                            <li>
                              Confirme o uso de <strong>https://</strong> (redirecionamentos podem
                              alterar o método POST para GET).
                            </li>
                            <li>Verifique a existência de barras extras no final da URL.</li>
                          </ul>
                        </div>
                      )}

                      <p className="text-xs font-semibold mb-1 text-destructive/80">
                        Logs de Diagnóstico Brutos:
                      </p>
                      <div className="p-3 bg-slate-950 text-emerald-400 rounded-md font-mono text-xs overflow-auto max-h-40 whitespace-pre-wrap break-all">
                        {JSON.stringify(errorFeedback.raw, null, 2)}
                      </div>
                    </div>
                  )}
                  <div className="pt-2 border-t border-destructive/10 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (lastAction === 'sync') handleSyncPatients()
                        else if (lastAction === 'test-simple') handleTestConnectionSimple()
                        else handleTestConnection()
                      }}
                      className="bg-white border-destructive/20 hover:bg-destructive/10 text-destructive h-8"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-2" />
                      Tentar Novamente
                    </Button>
                  </div>
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="outline" onClick={handleSave} className="rounded-xl">
              <Save className="w-4 h-4 mr-2" />
              Salvar Apenas
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
