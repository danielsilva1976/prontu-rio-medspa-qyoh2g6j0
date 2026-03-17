import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ClipboardList, Target } from 'lucide-react'

export default function PlanningTab({ isSigned }: { isSigned: boolean }) {
  return (
    <Card className="border-none shadow-subtle overflow-hidden animate-slide-up">
      <div className="h-1 w-full bg-gradient-to-r from-primary/20 to-primary"></div>
      <CardHeader>
        <CardTitle className="font-serif text-xl text-primary flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" /> Planejamento Terapêutico
        </CardTitle>
        <CardDescription>Estratégia clínica e plano de tratamento sugerido.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="objetivos" className="flex items-center gap-1 text-foreground">
            <Target className="w-4 h-4 text-primary/70" /> Objetivos Principais do Paciente
          </Label>
          <Textarea
            id="objetivos"
            placeholder="Ex: Melhorar qualidade da pele, reposição de volume no terço médio, suavizar sulco nasogeniano..."
            className="bg-muted/20 border-border focus-visible:ring-primary rounded-xl min-h-[80px]"
            disabled={isSigned}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plano" className="text-foreground">
            Plano de Tratamento Global
          </Label>
          <Textarea
            id="plano"
            placeholder="Descreva a estratégia, tecnologias escolhidas, ordem de execução e justificativa clínica..."
            className="min-h-[150px] bg-muted/20 border-border focus-visible:ring-primary rounded-xl"
            disabled={isSigned}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="cronograma" className="text-foreground">
              Cronograma / Sessões Sugeridas
            </Label>
            <Input
              id="cronograma"
              placeholder="Ex: 3 sessões mensais, manutenção semestral"
              className="bg-muted/20 border-border focus-visible:ring-primary rounded-xl"
              disabled={isSigned}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orcamento" className="text-foreground">
              Orçamento Previsto / Pacote
            </Label>
            <Input
              id="orcamento"
              placeholder="Referência de valores ou pacote acordado"
              className="bg-muted/20 border-border focus-visible:ring-primary rounded-xl"
              disabled={isSigned}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
