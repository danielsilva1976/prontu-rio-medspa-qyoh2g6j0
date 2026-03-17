import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { History, CheckCircle, Plus } from 'lucide-react'

export default function EvolutionTab({ isSigned }: { isSigned: boolean }) {
  return (
    <Card className="border-none shadow-subtle overflow-hidden animate-slide-up">
      <div className="h-1 w-full bg-gradient-to-r from-muted to-muted-foreground/30"></div>
      <CardHeader>
        <CardTitle className="font-serif text-xl text-primary flex items-center gap-2">
          <History className="w-5 h-5" /> Histórico do Paciente & Evolução
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/20 p-5 rounded-xl border border-border space-y-4 mb-8">
          <Label className="text-base text-foreground">Nova Evolução Clínica</Label>
          <Textarea
            placeholder="Registre a evolução, retorno do paciente, queixas atuais ou orientações dadas..."
            className="bg-white border-border rounded-xl focus-visible:ring-accent min-h-[100px]"
            disabled={isSigned}
          />
          <div className="flex justify-end">
            <Button
              disabled={isSigned}
              className="bg-primary text-white shadow-sm hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" /> Adicionar Nota
            </Button>
          </div>
        </div>

        <div className="relative border-l-2 border-muted ml-4 md:ml-6 space-y-8 pb-4">
          <div className="relative pl-6">
            <div className="absolute w-4 h-4 bg-background border-2 border-accent rounded-full -left-[9px] top-1"></div>
            <p className="text-sm font-bold text-accent mb-1">15 de Setembro, 2023</p>
            <div className="bg-white border border-border/50 rounded-xl p-4 shadow-sm">
              <p className="font-medium text-primary mb-2">Toxina Botulínica (Terço Superior)</p>
              <p className="text-sm text-muted-foreground">
                Aplicação de 45U de Dysport. Paciente queixava-se de vincos glabelares fortes. Sem
                intercorrências. Orientada sobre cuidados pós.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-success">
                <CheckCircle className="w-3 h-3" /> Assinado por Dra. Sofia Alencar
              </div>
            </div>
          </div>

          <div className="relative pl-6">
            <div className="absolute w-4 h-4 bg-background border-2 border-muted-foreground rounded-full -left-[9px] top-1"></div>
            <p className="text-sm font-bold text-muted-foreground mb-1">10 de Março, 2023</p>
            <div className="bg-white border border-border/50 rounded-xl p-4 shadow-sm opacity-80">
              <p className="font-medium text-primary mb-2">Primeira Consulta - Avaliação Global</p>
              <p className="text-sm text-muted-foreground">
                Mapeamento facial realizado. Indicado plano de tratamento anual focando em prevenção
                de rugas dinâmicas e melhora de textura da pele.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
