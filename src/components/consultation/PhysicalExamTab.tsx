import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function PhysicalExamTab({ isSigned }: { isSigned: boolean }) {
  return (
    <Card className="border-none shadow-subtle overflow-hidden animate-slide-up">
      <div className="h-1 w-full bg-gradient-to-r from-primary/20 to-primary"></div>
      <CardHeader>
        <CardTitle className="font-serif text-xl text-primary">
          Mapeamento Facial e Corporal
        </CardTitle>
        <CardDescription>Classificação clínica e notas de inspeção visual.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>Fototipo (Fitzpatrick)</Label>
            <Select disabled={isSigned}>
              <SelectTrigger className="bg-muted/20 border-border rounded-xl focus:ring-primary">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="I">I - Pele Branca (Sempre queima)</SelectItem>
                <SelectItem value="II">II - Pele Branca (Queima fácil)</SelectItem>
                <SelectItem value="III">III - Pele Morena Clara</SelectItem>
                <SelectItem value="IV">IV - Pele Morena Moderada</SelectItem>
                <SelectItem value="V">V - Pele Morena Escura</SelectItem>
                <SelectItem value="VI">VI - Pele Negra</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Grau de Envelhecimento (Glogau)</Label>
            <Select disabled={isSigned}>
              <SelectTrigger className="bg-muted/20 border-border rounded-xl focus:ring-primary">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Tipo I (Sem rugas)</SelectItem>
                <SelectItem value="2">Tipo II (Rugas em movimento)</SelectItem>
                <SelectItem value="3">Tipo III (Rugas em repouso)</SelectItem>
                <SelectItem value="4">Tipo IV (Apenas rugas)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de Pele</Label>
            <Select disabled={isSigned}>
              <SelectTrigger className="bg-muted/20 border-border rounded-xl focus:ring-primary">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="seca">Seca</SelectItem>
                <SelectItem value="oleosa">Oleosa</SelectItem>
                <SelectItem value="mista">Mista</SelectItem>
                <SelectItem value="sensivel">Sensível/Reativa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Inspeção Visual, Marcações e Achados</Label>
          <Textarea
            placeholder="Descreva assimetrias, áreas de ptose, manchas (melasma, melanose), cicatrizes, flacidez e detalhe os pontos de marcação para o procedimento..."
            className="min-h-[120px] bg-muted/20 border-border focus-visible:ring-primary rounded-xl"
            disabled={isSigned}
          />
        </div>
      </CardContent>
    </Card>
  )
}
