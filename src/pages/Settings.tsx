import { useState } from 'react'
import useSettingsStore from '@/stores/useSettingsStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trash2, Plus, Syringe } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Settings() {
  const { procedures, addProcedure, removeProcedure } = useSettingsStore()
  const [newProcedure, setNewProcedure] = useState('')
  const { toast } = useToast()

  const handleAdd = () => {
    const trimmed = newProcedure.trim()
    if (!trimmed) return

    if (procedures.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      toast({
        title: 'Procedimento duplicado',
        description: 'Este procedimento já existe na sua lista.',
        variant: 'destructive',
      })
      return
    }

    addProcedure(trimmed)
    setNewProcedure('')
    toast({
      title: 'Procedimento adicionado',
      description: `"${trimmed}" agora está disponível para os prontuários.`,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-6 animate-slide-up p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-serif text-primary tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as listas dinâmicas e os parâmetros padrões da clínica.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_2fr] max-w-6xl">
        {/* Settings Navigation (Static for now, scalable for future settings) */}
        <div className="flex flex-col gap-2">
          <Button variant="ghost" className="justify-start bg-primary/10 text-primary font-medium">
            <Syringe className="w-4 h-4 mr-2" /> Tipos de Procedimentos
          </Button>
        </div>

        {/* Procedures Dashboard */}
        <Card className="border-none shadow-subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-primary font-serif">
              Procedimentos Cadastrados
            </CardTitle>
            <CardDescription>
              Abaixo estão os procedimentos que aparecem na lista do prontuário do paciente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-3">
              <Input
                placeholder="Nome do novo procedimento..."
                value={newProcedure}
                onChange={(e) => setNewProcedure(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-white border-border rounded-xl focus-visible:ring-primary shadow-sm"
              />
              <Button
                onClick={handleAdd}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-xl shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>

            <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-full">Nome do Procedimento</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {procedures.map((proc) => (
                    <TableRow key={proc} className="group transition-colors hover:bg-muted/10">
                      <TableCell className="font-medium text-foreground">{proc}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProcedure(proc)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Remover {proc}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {procedures.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                        Nenhum procedimento cadastrado. Adicione um acima.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
