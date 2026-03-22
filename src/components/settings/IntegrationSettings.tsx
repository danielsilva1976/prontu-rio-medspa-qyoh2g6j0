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
  CheckCircle2,
  Wifi,
  WifiOff,
  Building2,
  Users,
  AlertCircle,
  Stethoscope,
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

  const [errorFeedback, setErrorFeedback] = useState<{
    message: string
    details: string
    title?: string
  } | null>(null)

  const [lastAction, setLastAction] = useState<'test' | 'test-simple' | 'sync' | null>(null)
  const { toast } = useToast()

  const isConnected = belleSoftware.lastSyncStatus === 'success'
  const isError = belleSoftware.lastSyncStatus === 'error'

  const parseError = (error: any): { message: string; details: string; title?: string } => {
    let message = 'Falha de Comunicação'
    let details = 'Erro ao conectar com o Belle Software. Verifique suas credenciais.'
    let title = undefined

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
      } else if (typeof error === 'object') {
        message = String(error.error || error.message || message)
        if (error.details) {
          details =
            typeof error.details === 'string' ? error.details : JSON.stringify(error.details)
        } else {
          details = JSON.stringify(error)
        }
      }
    } catch (e) {
      details = 'Ocorreu um erro inesperado ao processar os detalhes da falha.'
    }

    return { message: String(message), details: String(details), title }
  }

  const handleUrlBlur = () => {
    if (!url) return
    let cleanUrl = url.trim().replace(/\/+$/, '')

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`
    } else if (cleanUrl.startsWith('http://')) {
      cleanUrl = cleanUrl.replace('http://', 'https://')
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

      toast({
        title: 'Sucesso',
        description: `Conexão estabelecida com sucesso! ${names.length} clientes encontrados.`,
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
        description: 'Conexão avançada estabelecida com sucesso.',
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
      description: 'Buscando pacientes no Belle Software...',
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
      addLog('Sincronização Belle Software (Pacientes e Agenda)', 'SYSTEM')

      toast({
        title: 'Sincronização Concluída',
        description: `${mappedData.length} pacientes importados/atualizados com sucesso.`,
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
        {isConnected ? (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-600 border-green-500/20 py-1.5 px-3 font-medium"
          >
            <Wifi className="w-3.5 h-3.5 mr-1.5" />
            Conectado
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
            {isError ? 'Falha na Conexão' : 'Desconectado'}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-w-2xl">
          <div className="bg-muted/30 p-5 rounded-xl border border-border/50 space-y-5">
            <div className="flex items-center gap-2 text-primary font-medium mb-2">
              <ServerCrash className="w-5 h-5" />
              Conexão Segura API
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
                Integração direta com endpoints JSON x-www-form-urlencoded.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="api-token">Token de Acesso</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="api-token"
                    type="password"
                    placeholder="Cole seu token gerado..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="bg-white pl-9 font-mono text-sm"
                  />
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
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="font-semibold text-base mb-2">
                {errorFeedback.title || errorFeedback.message}
              </AlertTitle>
              <AlertDescription className="space-y-3">
                <div className="p-3 bg-white/50 rounded-md border border-destructive/10 font-mono text-xs break-all text-destructive/90">
                  {errorFeedback.details}
                </div>
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
              disabled={
                isTesting ||
                isTestingSimple ||
                isSyncing ||
                !url.trim() ||
                !token.trim() ||
                !estabelecimento.trim()
              }
              className="rounded-xl border-primary/20 text-primary hover:bg-primary/5"
            >
              {isTestingSimple ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Stethoscope className="w-4 h-4 mr-2" />
              )}
              {isTestingSimple ? 'Testando...' : 'Testar Conexão Simples'}
            </Button>

            <Button
              onClick={handleTestConnection}
              disabled={
                isTesting ||
                isTestingSimple ||
                isSyncing ||
                !url.trim() ||
                !token.trim() ||
                !estabelecimento.trim()
              }
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-xl"
            >
              {isTesting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {isTesting ? 'Testando...' : 'Testar Conexão Avançada'}
            </Button>

            {isConnected && (
              <Button
                onClick={handleSyncPatients}
                disabled={isSyncing || isTesting || isTestingSimple}
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm rounded-xl ml-auto"
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Users className="w-4 h-4 mr-2" />
                )}
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Pacientes'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
