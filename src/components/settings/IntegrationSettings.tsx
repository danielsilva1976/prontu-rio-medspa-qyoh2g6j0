import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import useSettingsStore from '@/stores/useSettingsStore'
import { Key, Save, ServerCrash, RefreshCw } from 'lucide-react'
import { testBelleConnection } from '@/lib/api/belle'

export function IntegrationSettings({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const { belleSoftware, updateBelleConfig } = useSettingsStore()
  const [url, setUrl] = useState(belleSoftware.url)
  const [token, setToken] = useState(belleSoftware.token)
  const [isValidating, setIsValidating] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (!url) {
      toast({
        title: 'URL Requerida',
        description: 'Preencha a URL base do Belle Software.',
        variant: 'destructive',
      })
      return
    }

    setIsValidating(true)
    try {
      await testBelleConnection(url, token)
      updateBelleConfig(url, token)
      toast({
        title: 'Configurações salvas',
        description: 'Credenciais e endpoint validados e atualizados com sucesso.',
      })
    } catch (error: any) {
      const isNetworkError =
        error.message?.includes('Failed to fetch') || error.message?.includes('Falha de rede')

      toast({
        title: 'Erro na Validação',
        description: isNetworkError
          ? 'Conexão bloqueada (CORS/Rede). Não foi possível conectar ao servidor.'
          : error.message || 'Falha ao validar credenciais. Verifique a URL e o Token.',
        variant: 'destructive',
      })
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <Card className="border-none shadow-subtle animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-xl text-primary font-serif">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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
                forçará o uso de <strong>HTTPS</strong> para evitar erros de conexão e bloqueios.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-token">Access Token (Chave de API)</Label>
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
              <p className="text-xs text-muted-foreground mt-1">
                Autenticação enviada via Body Payload e Bearer Header de forma compatível.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isValidating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-xl"
            >
              {isValidating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isValidating ? 'Validando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
