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
} from 'lucide-react'
import {
  testBelleConnection,
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
  const { syncWithBelle } = usePatientStore()
  const { addLog } = useAuditStore()

  const [url, setUrl] = useState(belleSoftware.url)
  const [token, setToken] = useState(belleSoftware.token)
  const [estabelecimento, setEstabelecimento] = useState(belleSoftware.estabelecimento || '1')
  const [isTesting, setIsTesting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null)
  const [detailedError, setDetailedError] = useState<any>(null)
  const { toast } = useToast()

  const isConnected = belleSoftware.lastSyncStatus === 'success'
  const isError = belleSoftware.lastSyncStatus === 'error'

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

    setIsTesting(true)
    setErrorFeedback(null)
    setDetailedError(null)

    updateBelleConfig(url, cleanToken, cleanEstab)

    try {
      await testBelleConnection(url, cleanToken, cleanEstab)
      setBelleLastSync('success', new Date().toISOString())
      setErrorFeedback(null)
      setDetailedError(null)

      toast({
        title: 'Conexão validada via Proxy',
        description: 'Conexão estabelecida com sucesso com a API do Belle Software!',
        className: 'bg-green-600 text-white border-none',
      })
    } catch (error: any) {
      setBelleLastSync('error', new Date().toISOString())

      if (error.name === 'BelleProxyError') {
        setDetailedError(error.details)
        setErrorFeedback(error.details?.details || error.details?.error || error.message)
      } else {
        setErrorFeedback(error.message)
      }

      toast({
        title: 'Falha na Conexão Proxy',
        description: 'Não foi possível conectar. Verifique o alerta para mais detalhes.',
        variant: 'destructive',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSyncPatients = async () => {
    setIsSyncing(true)
    setErrorFeedback(null)
    toast({
      title: 'Sincronização Iniciada',
      description: 'Buscando pacientes do Belle Software via Proxy...',
    })

    try {
      const cleanToken = token.replace(/[\s\uFEFF\xA0]+/g, '')
      const cleanEstab = estabelecimento.replace(/[\s\uFEFF\xA0]+/g, '')

      const [rawClientes, rawAgendamentos] = await Promise.all([
        fetchBelleClientes(url, cleanToken, cleanEstab),
        fetchBelleAgendamentos(url, cleanToken, undefined, cleanEstab),
      ])

      const mappedData = mapBelleDataToPatients(rawClientes, rawAgendamentos)
      const result = syncWithBelle(mappedData)

      setBelleLastSync('success', new Date().toISOString())
      addLog('Sincronização Belle Software (Pacientes e Agenda)', 'SYSTEM')

      toast({
        title: 'Sincronização Concluída',
        description: `Total de pacientes sincronizados e dados fictícios removidos: ${result.added + result.updated} registros.`,
        className: 'bg-green-600 text-white border-none',
      })
    } catch (error: any) {
      setBelleLastSync('error', new Date().toISOString())
      setErrorFeedback(error.details?.details || error.details?.error || error.message)
      toast({
        title: 'Falha na Sincronização API',
        description: 'Houve um problema de comunicação via Proxy. Verifique o painel.',
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
        <div className="space-y-6 max-w-xl">
          <div className="bg-muted/30 p-5 rounded-xl border border-border/50 space-y-5">
            <div className="flex items-center gap-2 text-primary font-medium mb-2">
              <ServerCrash className="w-5 h-5" />
              Conexão via CORS Proxy
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
                As requisições utilizarão automaticamente um proxy para evitar bloqueios do
                navegador.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="api-token">Token de Acesso</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="api-token"
                    type="text"
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
            <Alert variant="destructive" className="animate-fade-in text-sm overflow-hidden">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Falha de Comunicação via Proxy</AlertTitle>
              <AlertDescription className="space-y-3 mt-2">
                <p className="font-medium text-destructive/90">{errorFeedback}</p>
                {detailedError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 overflow-x-auto w-full">
                    <pre className="text-xs font-mono text-destructive/80 m-0 whitespace-pre-wrap break-words">
                      {JSON.stringify(detailedError, null, 2)}
                    </pre>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleSave} className="rounded-xl">
              <Save className="w-4 h-4 mr-2" />
              Salvar Apenas
            </Button>
            <Button
              onClick={handleTestConnection}
              disabled={isTesting || !url.trim() || !token.trim() || !estabelecimento.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-xl min-w-[160px]"
            >
              {isTesting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {isTesting ? 'Testando...' : 'Testar Conexão'}
            </Button>
            {isConnected && (
              <Button
                onClick={handleSyncPatients}
                disabled={isSyncing}
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm rounded-xl min-w-[160px]"
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
