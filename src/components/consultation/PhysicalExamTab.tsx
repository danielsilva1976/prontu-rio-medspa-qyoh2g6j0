import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'
import useAuditStore from '@/stores/useAuditStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function PhysicalExamTab({
  isSigned,
  patientId,
}: {
  isSigned: boolean
  patientId: string
}) {
  const { addLog } = useAuditStore()
  const [examData, setExamData] = useState({
    // Facial
    fototipo: '',
    glogau: '',
    tipoPele: '',
    inspecaoFacial: '',
    // Cabelo
    padraoQueda: '',
    testeTracao: '',
    textura: '',
    densidade: '',
    tricoscopia: '',
    // Corporal
    grauCelulite: '',
    flacidez: '',
    gordura: '',
    inspecaoCorporal: '',
  })

  const handleChange = (field: keyof typeof examData, value: string) => {
    setExamData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    addLog('Exame Físico atualizado', patientId)
  }

  return (
    <Card className="border-none shadow-subtle overflow-hidden animate-slide-up">
      <div className="h-1 w-full bg-gradient-to-r from-primary/20 to-primary"></div>
      <CardHeader>
        <CardTitle className="font-serif text-xl text-primary">Exame Físico</CardTitle>
        <CardDescription>Mapeamento e classificação clínica por região anatômica.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="facial" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1 rounded-xl h-auto">
            <TabsTrigger
              value="facial"
              className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Facial
            </TabsTrigger>
            <TabsTrigger
              value="cabelo"
              className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Cabelo
            </TabsTrigger>
            <TabsTrigger
              value="corporal"
              className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Corporal
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="facial"
            className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
          >
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Fototipo (Fitzpatrick)</Label>
                <Select
                  disabled={isSigned}
                  value={examData.fototipo}
                  onValueChange={(v) => handleChange('fototipo', v)}
                >
                  <SelectTrigger className="bg-muted/20 border-border rounded-xl focus:ring-primary h-11">
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
                <Select
                  disabled={isSigned}
                  value={examData.glogau}
                  onValueChange={(v) => handleChange('glogau', v)}
                >
                  <SelectTrigger className="bg-muted/20 border-border rounded-xl focus:ring-primary h-11">
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
                <Select
                  disabled={isSigned}
                  value={examData.tipoPele}
                  onValueChange={(v) => handleChange('tipoPele', v)}
                >
                  <SelectTrigger className="bg-muted/20 border-border rounded-xl focus:ring-primary h-11">
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
              <Label>Inspeção Visual, Marcações e Achados - Facial</Label>
              <Textarea
                value={examData.inspecaoFacial}
                onChange={(e) => handleChange('inspecaoFacial', e.target.value)}
                placeholder="Descreva assimetrias, áreas de ptose, manchas (melasma, melanose), cicatrizes, flacidez e detalhe os pontos de marcação para o procedimento..."
                className="min-h-[120px] bg-muted/20 border-border focus-visible:ring-primary rounded-xl p-4"
                disabled={isSigned}
              />
            </div>
          </TabsContent>

          <TabsContent
            value="cabelo"
            className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Padrão de Queda</Label>
                <Select
                  disabled={isSigned}
                  value={examData.padraoQueda}
                  onValueChange={(v) => handleChange('padraoQueda', v)}
                >
                  <SelectTrigger className="bg-muted/20 border-border rounded-xl focus:ring-primary h-11">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="androgenetica">Alopécia Androgenética</SelectItem>
                    <SelectItem value="areata">Alopécia Areata</SelectItem>
                    <SelectItem value="efluvio">Eflúvio Telógeno</SelectItem>
                    <SelectItem value="frontal">Alopécia Frontal Fibrosante</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Teste de Tração</Label>
                <Select
                  disabled={isSigned}
                  value={examData.testeTracao}
                  onValueChange={(v) => handleChange('testeTracao', v)}
                >
                  <SelectTrigger className="bg-muted/20 border-border rounded-xl focus:ring-primary h-11">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positivo">Positivo</SelectItem>
                    <SelectItem value="negativo">Negativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Textura do Fio</Label>
                <Select
                  disabled={isSigned}
                  value={examData.textura}
                  onValueChange={(v) => handleChange('textura', v)}
                >
                  <SelectTrigger className="bg-muted/20 border-border rounded-xl focus:ring-primary h-11">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fina">Fina</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="grossa">Grossa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Densidade</Label>
                <Select
                  disabled={isSigned}
                  value={examData.densidade}
                  onValueChange={(v) => handleChange('densidade', v)}
                >
                  <SelectTrigger className="bg-muted/20 border-border rounded-xl focus:ring-primary h-11">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="reduzida">Reduzida</SelectItem>
                    <SelectItem value="rarefacao">Rarefação Acentuada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="uppercase font-bold text-foreground">Tricoscopia</Label>
              <Textarea
                value={examData.tricoscopia}
                onChange={(e) => handleChange('tricoscopia', e.target.value)}
                placeholder="Descreva detalhadamente os achados tricoscópicos, afinamento folicular, descamação, eritema, halos peripilares, pontos amarelos/pretos ou outras alterações no couro cabeludo..."
                className="min-h-[120px] bg-muted/20 border-border focus-visible:ring-primary rounded-xl p-4"
                disabled={isSigned}
              />
            </div>
          </TabsContent>

          <TabsContent
            value="corporal"
            className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
          >
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Grau de Celulite (FEG)</Label>
                <Select
                  disabled={isSigned}
                  value={examData.grauCelulite}
                  onValueChange={(v) => handleChange('grauCelulite', v)}
                >
                  <SelectTrigger className="bg-muted/20 border-border rounded-xl focus:ring-primary h-11">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Grau 0 (Sem alterações)</SelectItem>
                    <SelectItem value="1">Grau 1 (Apenas à compressão)</SelectItem>
                    <SelectItem value="2">Grau 2 (Visível em repouso)</SelectItem>
                    <SelectItem value="3">Grau 3 (Nódulos e dor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Flacidez Tissular</Label>
                <Select
                  disabled={isSigned}
                  value={examData.flacidez}
                  onValueChange={(v) => handleChange('flacidez', v)}
                >
                  <SelectTrigger className="bg-muted/20 border-border rounded-xl focus:ring-primary h-11">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leve">Leve</SelectItem>
                    <SelectItem value="moderada">Moderada</SelectItem>
                    <SelectItem value="intensa">Intensa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gordura Localizada</Label>
                <Select
                  disabled={isSigned}
                  value={examData.gordura}
                  onValueChange={(v) => handleChange('gordura', v)}
                >
                  <SelectTrigger className="bg-muted/20 border-border rounded-xl focus:ring-primary h-11">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ausente">Ausente</SelectItem>
                    <SelectItem value="leve">Leve</SelectItem>
                    <SelectItem value="moderada">Moderada</SelectItem>
                    <SelectItem value="acentuada">Acentuada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Inspeção Visual e Marcações - Corporal</Label>
              <Textarea
                value={examData.inspecaoCorporal}
                onChange={(e) => handleChange('inspecaoCorporal', e.target.value)}
                placeholder="Descreva áreas de flacidez, estrias, cicatrizes, distribuição de gordura e detalhe os pontos de aplicação/tratamento..."
                className="min-h-[120px] bg-muted/20 border-border focus-visible:ring-primary rounded-xl p-4"
                disabled={isSigned}
              />
            </div>
          </TabsContent>
        </Tabs>

        {!isSigned && (
          <div className="flex justify-end pt-4 mt-6 border-t border-border/50">
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              <Save className="w-4 h-4 mr-2" /> Salvar Exames
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
