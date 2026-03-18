import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import useSettingsStore from '@/stores/useSettingsStore'
import { Link, Key, Save } from 'lucide-react'

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
  const { toast } = useToast()

  const handleSave = () => {
    updateBelleConfig(url, token)
    toast({
      title: 'Configurações salvas',
      description: 'Credenciais do Belle Software atualizadas com sucesso.',
    })
  }

  return (
    <Card className="border-none shadow-subtle animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-xl text-primary font-serif">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-w-xl">
          <div className="bg-muted/30 p-4 rounded-xl border border-border/50 space-y-4">
            <div className="flex items-center gap-2 text-primary font-medium mb-2">
              <Link className="w-5 h-5" />
              Conexão com API Belle Software
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-url">Base URL da API</Label>
              <Input
                id="api-url"
                placeholder="https://api.bellesoftware.com.br/v1"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-token">Token de Acesso (API Key)</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="api-token"
                  type="password"
                  placeholder="Cole seu token de integração aqui..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="bg-white pl-9"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-xl"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
