import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Printer, Download, FileSignature } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Documents() {
  const [docType, setDocType] = useState('receita')
  const [patientName, setPatientName] = useState('Isabella Rodrigues')
  const [content, setContent] = useState(
    'Uso Tópico:\n\n1. Vitamina C 10% - Aplicar 3 a 4 gotas na face pela manhã, antes do protetor solar.\n\n2. Protetor Solar FPS 50+ - Reaplicar a cada 3 horas.\n\n3. Ácido Retinoico 0.025% (Creme) - Aplicar pequena quantidade à noite. Iniciar uso em dias alternados para evitar sensibilização.',
  )
  const { toast } = useToast()

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const handlePrint = () => {
    toast({ title: 'Preparando impressão...' })
    setTimeout(() => window.print(), 500)
  }

  return (
    <div className="space-y-6 animate-slide-up h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-serif text-primary">Documentos Legais</h1>
          <p className="text-muted-foreground mt-1">Gere receitas e laudos com padrão Clínico</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-white border-border shadow-subtle hover:text-accent hover:border-accent/30"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button className="bg-primary text-white shadow-elevation hover:bg-primary/90">
            <Download className="w-4 h-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[1fr_1.2fr] gap-8 min-h-0">
        {/* Editor Column */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2 pb-8">
          <Tabs value={docType} onValueChange={setDocType} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger
                value="receita"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Receita Médica
              </TabsTrigger>
              <TabsTrigger
                value="laudo"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Laudo / Atestado
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="border-none shadow-subtle flex-1 bg-white">
            <CardContent className="p-6 space-y-6 h-full flex flex-col">
              <div className="space-y-2 shrink-0">
                <Label>Vincular Paciente (Busca Belle Software)</Label>
                <Select value={patientName} onValueChange={setPatientName}>
                  <SelectTrigger className="bg-muted/20 border-border rounded-xl">
                    <SelectValue placeholder="Selecione o paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Isabella Rodrigues">Isabella Rodrigues</SelectItem>
                    <SelectItem value="Carolina Mendes Costa">Carolina Mendes Costa</SelectItem>
                    <SelectItem value="Juliana Carvalho">Juliana Carvalho</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {docType === 'receita' ? (
                <div className="space-y-2 flex-1 flex flex-col">
                  <div className="flex justify-between items-end">
                    <Label>Prescrição (Uso interno/externo)</Label>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-accent font-normal text-xs"
                    >
                      Carregar modelo salvo
                    </Button>
                  </div>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="flex-1 min-h-[300px] resize-none bg-muted/10 border-border rounded-xl p-4 font-mono text-sm leading-relaxed focus-visible:ring-accent"
                    placeholder="Digite os medicamentos e posologia..."
                  />
                </div>
              ) : (
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="space-y-2">
                    <Label>Título do Laudo</Label>
                    <Input
                      placeholder="Ex: Laudo de Procedimento Estético"
                      className="bg-muted/10 border-border rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 flex-1 flex flex-col">
                    <Label>Conteúdo Descritivo</Label>
                    <Textarea
                      className="flex-1 min-h-[250px] resize-none bg-muted/10 border-border rounded-xl p-4 text-sm focus-visible:ring-accent"
                      placeholder="Atesto para os devidos fins que a paciente..."
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Column (A4 Paper Simulation) */}
        <div className="hidden lg:flex items-center justify-center bg-muted/30 rounded-2xl border border-border/50 overflow-hidden p-8 relative">
          <div className="w-full max-w-[21cm] aspect-[1/1.414] bg-white shadow-elevation flex flex-col relative transition-all duration-300 transform scale-[0.85] xl:scale-95 origin-top">
            {/* MedSpa Letterhead */}
            <div className="flex justify-between items-start border-b border-muted p-10 pb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary flex items-center justify-center rounded">
                  <span className="text-white font-serif font-bold text-xl">M</span>
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-semibold tracking-tight text-primary">
                    Clínica MEDSPA
                  </h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                    Dermatologia Avançada
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground space-y-1">
                <p>Av. Paulista, 1000 - Bela Vista</p>
                <p>São Paulo, SP - 01310-100</p>
                <p>(11) 3000-0000</p>
              </div>
            </div>

            {/* Document Body */}
            <div className="flex-1 p-10 pt-12 flex flex-col">
              <h3 className="text-center font-serif text-xl font-medium tracking-wide text-primary uppercase mb-12">
                {docType === 'receita' ? 'Receituário Médico' : 'Laudo Médico'}
              </h3>

              <div className="mb-8">
                <p className="text-sm">
                  <span className="font-semibold text-primary">Paciente:</span> {patientName}
                </p>
              </div>

              <div className="flex-1 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {content}
              </div>

              {/* Signature Area */}
              <div className="mt-16 flex flex-col items-center justify-center shrink-0 mb-8">
                <div className="w-64 border-t border-primary/50 relative flex justify-center mb-2">
                  {/* Fake digital signature mark */}
                  <div className="absolute -top-10 flex flex-col items-center opacity-80">
                    <FileSignature className="w-8 h-8 text-accent/50" />
                  </div>
                </div>
                <p className="font-serif font-medium text-primary">Dra. Sofia Alencar</p>
                <p className="text-xs text-muted-foreground">
                  Médica Dermatologista - CRM 123456/SP
                </p>
                <p className="text-[10px] text-muted-foreground mt-4">São Paulo, {currentDate}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-primary text-white text-[10px] py-3 text-center opacity-90 shrink-0">
              Documento assinado digitalmente conforme MP nº 2.200-2/2001, que institui a
              Infraestrutura de Chaves Públicas Brasileira - ICP-Brasil.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
