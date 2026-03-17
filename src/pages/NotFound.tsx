import { useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('Erro 404: Rota não encontrada:', location.pathname)
  }, [location.pathname])

  return (
    <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
        <span className="font-serif text-4xl text-muted-foreground">404</span>
      </div>
      <h1 className="text-3xl font-serif text-primary mb-4">Página Não Encontrada</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        A página que você está procurando não existe ou foi movida. Verifique o endereço digitado.
      </p>
      <Button
        asChild
        className="bg-primary hover:bg-primary/90 text-white shadow-elevation rounded-full px-8"
      >
        <Link to="/">Voltar para o Início</Link>
      </Button>
    </div>
  )
}

export default NotFound
