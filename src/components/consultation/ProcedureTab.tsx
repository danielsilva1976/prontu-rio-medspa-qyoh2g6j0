import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Syringe } from 'lucide-react'

export default function ProcedureTab({ isSigned }: { isSigned: boolean }) {
  return (
    <Card className="border-none shadow-subtle overflow-hidden animate-slide-up">
      <div className="h-1 w-full bg-gradient-to-r from-primary/20 to-primary"></div>
      <CardHeader>
        <CardTitle className="font-serif text-xl text-primary flex items-center gap-2">
          <Syringe className="w-5 h-5 text-primary" /> Registro Técnico
        </CardTitle>
        <CardDescription>Detalhes do material utilizado e técnica aplicada.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6 bg-muted/10 p-6 rounded-xl border border-border">
          <div className="space-y-2">
            <Label className="text-foreground">Tipo de Procedimento Principal</Label>
            <Select disabled={isSigned}>
              <SelectTrigger className="bg-white border-border rounded-xl focus:ring-primary shadow-sm">
                <SelectValue placeholder="Ex: Toxina Botulínica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toxina">Toxina Botulínica</SelectItem>
                <SelectItem value="preenchimento">Preenchimento com Ácido Hialurônico</SelectItem>
                <SelectItem value="bioestimulador">Bioestimulador de Colágeno</SelectItem>
                <SelectItem value="fios">Fios de PDO</SelectItem>
                <SelectItem value="laser">Laser / Tecnologias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Áreas Tratadas</Label>
            <Input
              placeholder="Ex: Glabela, Fronte, Periorbicular"
              className="bg-white border-border rounded-xl focus-visible:ring-primary shadow-sm"
              disabled={isSigned}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Produto / Marca</Label>
            <Input
              placeholder="Ex: Botox® (Allergan), Restylane"
              className="bg-white border-border rounded-xl focus-visible:ring-primary shadow-sm"
              disabled={isSigned}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Lote</Label>
              <Input
                placeholder="Nº do lote"
                className="bg-white border-border rounded-xl focus-visible:ring-primary shadow-sm"
                disabled={isSigned}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Dose / Volume (U ou mL)</Label>
              <Input
                placeholder="Ex: 50U, 1mL"
                className="bg-white border-border rounded-xl focus-visible:ring-primary shadow-sm"
                disabled={isSigned}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Técnica de Aplicação e Observações</Label>
          <Textarea
            placeholder="Descreva os planos de aplicação (supraperiosteal, derme profunda), uso de cânula ou agulha, intercorrências imediatas (sangramento, hematoma)..."
            className="min-h-[120px] bg-muted/20 border-border focus-visible:ring-primary rounded-xl"
            disabled={isSigned}
          />
        </div>
      </CardContent>
    </Card>
  )
}
