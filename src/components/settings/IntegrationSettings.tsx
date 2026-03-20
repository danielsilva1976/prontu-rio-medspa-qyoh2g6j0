import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import useSettingsStore from '@/stores/useSettingsStore'
import {
  Key,
  Save,
  ServerCrash,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { testBelleConnection } from '@/lib/api/belle'

export function IntegrationSettings({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const { belleSoftware, updateBelleConfig, setBelleLastSync } = useSettingsStore()
  const [url, setUrl] = useState(belleSoftware.url)
  const [token, setToken] = useState(belleSoftware.token)
  const [isTesting, setIsTesting] = useState(false)
  const [errorAlert, setErrorAlert] = useState<{ title: string; message: string } | null>(null)
  const { toast } = useToast()

  const isConnected = belleSoftware.lastSyncStatus === 'success'

  const handleTestConnection = async () => {
    if (!url) {
      toast({
        title: 'URL Requerida',
        description: 'Preencha a URL base do Belle Software.',
        variant: 'destructive',
      })
      return
    }

    if (!token) {
      toast({
        title: 'Token Requerido',
        description: 'Preencha o Token de Acesso.',
        variant: 'destructive',
      })
      return
    }

    setIsTesting(true)
    setErrorAlert(null)

    try {
      await testBelleConnection(url, token)
      updateBelleConfig(url, token)
      setBelleLastSync('success', new Date().toISOString())

      toast({
        description: 'Conexão estabelecida com sucesso!',
      })
    } catch (error: any) {
      setBelleLastSync('error', new Date().toISOString())

      const errorMessage = error.message || ''

      if (
        errorMessage.includes('CORS') ||
        errorMessage.includes('Rede') ||
        errorMessage.includes('Failed to fetch')
      ) {
        setErrorAlert({
          title: 'Erro de Conexão',
          message:
            'Conexão bloqueada (CORS/Rede). Não foi possível conectar ao servidor. Verifique a URL Base.',
        })
      } else if (errorMessage.includes('Autenticação')) {
        setErrorAlert({
          title: 'Erro de Autenticação',
          message: 'Falha na Autenticação. Verifique se o Token de Acesso está correto.',
        })
      } else {
        setErrorAlert({
          title: 'Erro na Integração',
          message: errorMessage || 'Ocorreu um erro desconhecido ao tentar conectar.',
        })
      }
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = () => {
    updateBelleConfig(url, token)
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
            className="bg-success/10 text-success border-success/20 py-1.5 px-3"
          >
            <Wifi className="w-3.5 h-3.5 mr-1.5" />
            Conectado
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-destructive/10 text-destructive border-destructive/20 py-1.5 px-3"
          >
            <WifiOff className="w-3.5 h-3.5 mr-1.5" />
            Desconectado
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-w-xl">
          <div className="bg-muted/30 p-5 rounded-xl border border-border/50 space-y-5">
            <div className="flex items-center gap-2 text-primary font-medium mb-2">
              <ServerCrash className="w-5 h-5" />
              Conexão com Protocolo api.php
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-url">URL Base do Belle Software</Label>
              <Input
                id="api-url"
                placeholder="Ex: https://app.bellesoftware.com.br"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-white font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                O sistema anexará automaticamente <strong>/api.php</strong> ao final da URL e
                forçará o uso de <strong>HTTPS</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-token">Token de Acesso</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="api-token"
                  type="password"
                  placeholder="Cole seu token gerado no Belle..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="bg-white pl-9 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {errorAlert && (
            <Alert
              variant="destructive"
              className="animate-fade-in-up border-destructive/50 bg-destructive/5"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{errorAlert.title}</AlertTitle>
              <AlertDescription>{errorAlert.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleSave} className="rounded-xl">
              <Save className="w-4 h-4 mr-2" />
              Salvar Apenas
            </Button>
            <Button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-xl"
            >
              {isTesting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {isTesting ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
