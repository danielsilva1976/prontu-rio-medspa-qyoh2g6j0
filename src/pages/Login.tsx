import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import useUserStore from '@/stores/useUserStore'
import logoMarca from '@/assets/marca-principal_page-0001-2e968.jpg'

export default function Login() {
  const [loginStr, setLoginStr] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useUserStore()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const user = pb.authStore.record || pb.authStore.model
    if (
      pb.authStore.isValid &&
      user?.collectionName === 'users' &&
      ['admin', 'secretary'].includes(user.role)
    ) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [navigate, location])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const success = await login(loginStr, password)

    setIsLoading(false)
    if (success) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    } else {
      toast({
        title: 'Acesso negado',
        description: 'Credenciais incorretas. Verifique seu e-mail e senha.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[420px] space-y-8 animate-fade-in-up">
        <div className="flex flex-col items-center justify-center text-center">
          <img
            src={logoMarca}
            alt="Clínica MEDSPA"
            className="h-28 w-auto object-contain mix-blend-multiply mb-4 hover:scale-105 transition-transform duration-500"
          />
          <h2 className="text-2xl font-serif text-primary tracking-tight">
            Sistema de Prontuário Eletrônico
          </h2>
        </div>

        <Card className="border border-border/50 shadow-elevation bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="login" className="text-foreground/80 font-medium">
                  E-mail ou Login
                </Label>
                <Input
                  id="login"
                  type="text"
                  placeholder="Digite suas credenciais"
                  value={loginStr}
                  onChange={(e) => setLoginStr(e.target.value)}
                  required
                  className="h-12 rounded-xl bg-muted/10 border-border/50 focus-visible:ring-primary/50 transition-all text-base px-4"
                />
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-foreground/80 font-medium">
                    Senha
                  </Label>
                  <a
                    href="#"
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl bg-muted/10 border-border/50 focus-visible:ring-primary/50 transition-all text-base px-4"
                />
              </div>
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all sm:hover:scale-[1.02]"
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center pt-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">
            MEDSPA © {new Date().getFullYear()} • Ambiente Seguro
          </p>
        </div>
      </div>
    </div>
  )
}
