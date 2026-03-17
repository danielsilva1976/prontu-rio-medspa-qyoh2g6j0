import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Stethoscope, AlertCircle } from 'lucide-react'

export default function AnamnesisTab({ isSigned }: { isSigned: boolean }) {
  return (
    <Card className="border-none shadow-subtle overflow-hidden animate-slide-up">
      <div className="h-1 w-full bg-gradient-to-r from-primary/20 to-primary"></div>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary font-serif text-xl">
          <Stethoscope className="w-5 h-5 text-primary" /> História Clínica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="queixa" className="text-base text-foreground">
            Queixa Principal
          </Label>
          <Textarea
            id="queixa"
            placeholder="Descreva o motivo da consulta com as palavras do paciente..."
            className="min-h-[100px] resize-y bg-muted/20 border-border focus-visible:ring-primary rounded-xl"
            disabled={isSigned}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="alergias" className="flex items-center gap-1 text-foreground">
              <AlertCircle className="w-4 h-4 text-destructive" /> Alergias Conhecidas
            </Label>
            <Textarea
              id="alergias"
              placeholder="Ex: Látex, Dipirona, Lidocaína..."
              className="bg-muted/20 border-border focus-visible:ring-primary rounded-xl"
              disabled={isSigned}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medicamentos" className="text-foreground">
              Uso Contínuo de Medicamentos
            </Label>
            <Textarea
              id="medicamentos"
              placeholder="Ex: Roacutan (isotretinoína), Anticoncepcional..."
              className="bg-muted/20 border-border focus-visible:ring-primary rounded-xl"
              disabled={isSigned}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="procedimentos_previos" className="text-foreground">
            Procedimentos Estéticos Prévios
          </Label>
          <Textarea
            id="procedimentos_previos"
            placeholder="Detalhe tratamentos anteriores, intercorrências, insatisfações..."
            className="min-h-[100px] bg-muted/20 border-border focus-visible:ring-primary rounded-xl"
            disabled={isSigned}
          />
        </div>
      </CardContent>
    </Card>
  )
}
