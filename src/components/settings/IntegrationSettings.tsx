import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import useSettingsStore from '@/stores/useSettingsStore'
import { Key, Save, ServerCrash, RefreshCw, CheckCircle2, Wifi, WifiOff } from 'lucide-react'
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
  const { toast } = useToast()

  const isConnected = belleSoftware.lastSyncStatus === 'success'

  const handleUrlBlur = () => {
    if (!url) return
    let cleanUrl = url.trim()
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`
    } else if (cleanUrl.startsWith('http://')) {
      cleanUrl = cleanUrl.replace('http://', 'https://')
    }
    if (cleanUrl !== url) {
      setUrl(cleanUrl)
    }
  }

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

    try {
      await testBelleConnection(url, token)
      updateBelleConfig(url, token)
      setBelleLastSync('success', new Date().toISOString())

      toast({
        title: 'Conexão validada',
        description: 'Conexão estabelecida com sucesso!',
      })
    } catch (error: any) {
      setBelleLastSync('error', new Date().toISOString())

      const errorMessage = error.message || ''

      if (errorMessage === 'URL Inválida') {
        toast({
          title: 'URL Inválida',
          description: 'Não foi possível encontrar o servidor. Verifique o endereço base da API.',
          variant: 'destructive',
        })
      } else if (errorMessage === 'Token Inválido') {
        toast({
          title: 'Token Inválido',
          description:
            'A autenticação falhou. Verifique se o Token de Acesso fornecido está correto.',
          variant: 'destructive',
        })
      } else if (
        errorMessage === 'Erro de Rede (CORS)' ||
        errorMessage === 'TIMEOUT_ERROR' ||
        errorMessage.includes('CORS')
      ) {
        toast({
          title: 'Erro de Rede (CORS)',
          description:
            'A requisição falhou devido a restrições de rede ou CORS. Verifique se a URL Base está correta e se o ambiente permite conexões externas.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Erro na Integração',
          description: errorMessage || 'Ocorreu um erro desconhecido ao tentar conectar.',
          variant: 'destructive',
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
              Conexão com a API (v1)
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-url">URL Base do Belle Software</Label>
              <Input
                id="api-url"
                placeholder="Ex: https://api.bellesoftware.com.br"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                className="bg-white font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                O sistema anexará automaticamente os <strong>endpoints da API</strong> (ex:
                /api/v1/pacientes) ao final da URL e forçará o uso de <strong>HTTPS</strong>.
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

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleSave} className="rounded-xl">
              <Save className="w-4 h-4 mr-2" />
              Salvar Apenas
            </Button>
            <Button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-xl min-w-[160px]"
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
