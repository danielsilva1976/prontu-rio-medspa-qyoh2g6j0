import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ClipboardList, Target, Plus, Trash2, CalendarClock } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useSettingsStore from '@/stores/useSettingsStore'

type ChronogramEntry = {
  id: string
  timing: string
  procedure: string
  quantity: string
}

export default function PlanningTab({ isSigned }: { isSigned: boolean }) {
  const { procedures } = useSettingsStore()

  const [entries, setEntries] = useState<ChronogramEntry[]>([
    { id: '1', timing: 'Sessão 01 (Hoje)', procedure: 'Toxina Botulínica', quantity: '1' },
    { id: '2', timing: 'Após 15 dias', procedure: 'Retorno / Avaliação', quantity: '1' },
    { id: '3', timing: 'Após 30 dias', procedure: 'Bioestimulador de Colágeno', quantity: '2' },
  ])

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        id: Math.random().toString(36).slice(2),
        timing: '',
        procedure: '',
        quantity: '1',
      },
    ])
  }

  const removeEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id))
  }

  const updateEntry = (id: string, field: keyof ChronogramEntry, value: string) => {
    setEntries(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  const procedureOptions = [
    ...procedures,
    'Retorno / Avaliação',
    'Consulta de Acompanhamento',
    'Limpeza de Pele',
    'Outro',
  ]

  const uniqueProcedures = Array.from(new Set(procedureOptions))

  return (
    <Card className="border-none shadow-subtle overflow-hidden animate-slide-up">
      <div className="h-1 w-full bg-gradient-to-r from-primary/20 to-primary"></div>
      <CardHeader>
        <CardTitle className="font-serif text-xl text-primary flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" /> Planejamento Terapêutico
        </CardTitle>
        <CardDescription>Estratégia clínica e plano de tratamento estruturado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-3">
          <Label
            htmlFor="objetivos"
            className="flex items-center gap-1.5 text-foreground text-base"
          >
            <Target className="w-4 h-4 text-primary/70" /> Objetivos Principais do Paciente
          </Label>
          <Textarea
            id="objetivos"
            placeholder="Ex: Melhorar qualidade da pele, reposição de volume no terço médio..."
            className="bg-muted/10 border-border/50 focus-visible:ring-primary rounded-xl min-h-[80px]"
            disabled={isSigned}
          />
        </div>

        <div className="space-y-4 pt-2">
          <Label className="flex items-center gap-1.5 text-foreground text-base">
            <CalendarClock className="w-4 h-4 text-primary/70" /> Cronograma de Tratamento
          </Label>

          <div className="relative border-l-2 border-primary/20 ml-3 md:ml-4 space-y-6 pb-2 pt-2">
            {entries.map((entry) => (
              <div key={entry.id} className="relative pl-6 md:pl-8 animate-fade-in">
                <div className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full -left-[9px] top-5 shadow-sm"></div>

                <div className="bg-white border border-border/60 hover:border-primary/40 transition-colors rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 md:items-center">
                  <div className="w-full md:w-1/3 space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Momento / Ordem
                    </Label>
                    <Input
                      value={entry.timing}
                      onChange={(e) => updateEntry(entry.id, 'timing', e.target.value)}
                      disabled={isSigned}
                      placeholder="Ex: Sessão 01, Após 15 dias"
                      className="bg-muted/5 border-border/50 h-9"
                    />
                  </div>

                  <div className="w-full md:w-1/2 space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Procedimento / Etapa
                    </Label>
                    <Select
                      disabled={isSigned}
                      value={entry.procedure}
                      onValueChange={(val) => updateEntry(entry.id, 'procedure', val)}
                    >
                      <SelectTrigger className="bg-muted/5 border-border/50 h-9">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueProcedures.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full md:w-24 space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Qtd
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={entry.quantity}
                      onChange={(e) => updateEntry(entry.id, 'quantity', e.target.value)}
                      disabled={isSigned}
                      className="bg-muted/5 border-border/50 h-9 text-center"
                    />
                  </div>

                  {!isSigned && (
                    <div className="flex justify-end pt-5 md:pt-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEntry(entry.id)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2 md:mr-0 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!isSigned && (
            <Button
              onClick={addEntry}
              variant="outline"
              className="w-full mt-4 border-dashed border-2 hover:bg-primary/5 hover:text-primary hover:border-primary/50 text-muted-foreground rounded-xl py-6 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Procedimento/Sessão
            </Button>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t border-border/50">
          <Label htmlFor="orcamento" className="text-foreground text-base">
            Orçamento Previsto / Pacote Acordado
          </Label>
          <Input
            id="orcamento"
            placeholder="Ex: R$ 5.000,00 - Pacote Rejuvenescimento Global (3x sem juros)"
            className="bg-muted/10 border-border/50 focus-visible:ring-primary rounded-xl"
            disabled={isSigned}
          />
        </div>
      </CardContent>
    </Card>
  )
}
