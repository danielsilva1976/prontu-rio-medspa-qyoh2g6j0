import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Printer, Download, FileSignature } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function DocumentsTab({
  patientName,
  isSigned,
}: {
  patientName: string
  isSigned: boolean
}) {
  const [docType, setDocType] = useState('receita')
  const [content, setContent] = useState(
    'Uso Tópico:\n\n1. Vitamina C 10% - Aplicar 3 a 4 gotas na face pela manhã, antes do protetor solar.\n\n2. Protetor Solar FPS 50+ - Reaplicar a cada 3 horas.\n\n3. Ácido Retinoico 0.025% (Creme) - Aplicar pequena quantidade à noite. Iniciar uso em dias alternados para evitar sensibilização.',
  )
  const { toast } = useToast()

  const handlePrint = () => {
    toast({ title: 'Preparando impressão...' })
    setTimeout(() => window.print(), 500)
  }

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 items-start animate-slide-up">
      <div className="space-y-6">
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

        <Card className="border-none shadow-subtle bg-white">
          <CardContent className="p-6 space-y-4">
            {docType === 'laudo' && (
              <div className="space-y-2">
                <Label>Título do Documento</Label>
                <Input
                  placeholder="Ex: Laudo de Procedimento Estético"
                  className="bg-muted/10 border-border rounded-xl"
                  disabled={isSigned}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Conteúdo Descritivo</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[300px] resize-y bg-muted/10 border-border rounded-xl focus-visible:ring-accent leading-relaxed text-sm"
                disabled={isSigned}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="w-full border-border hover:bg-muted/50 hover:text-primary"
              >
                <Printer className="w-4 h-4 mr-2" /> Imprimir
              </Button>
              <Button className="w-full bg-primary text-white hover:bg-primary/90 shadow-sm">
                <Download className="w-4 h-4 mr-2" /> Exportar PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:flex items-start justify-center bg-muted/30 rounded-2xl border border-border/50 p-6 overflow-hidden">
        <div className="w-full max-w-[21cm] aspect-[1/1.414] bg-white shadow-elevation flex flex-col relative text-sm transform origin-top xl:scale-95">
          <div className="flex justify-between items-start border-b border-muted p-8 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary flex items-center justify-center rounded">
                <span className="text-white font-serif font-bold">M</span>
              </div>
              <div>
                <h2 className="font-serif text-xl font-semibold tracking-tight text-primary">
                  Clínica MEDSPA
                </h2>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
                  Dermatologia Avançada
                </p>
              </div>
            </div>
            <div className="text-right text-[10px] text-muted-foreground space-y-0.5">
              <p>Av. Paulista, 1000 - SP</p>
              <p>(11) 3000-0000</p>
            </div>
          </div>

          <div className="flex-1 p-8 pt-10 flex flex-col">
            <h3 className="text-center font-serif text-lg font-medium tracking-wide text-primary uppercase mb-8">
              {docType === 'receita' ? 'Receituário Médico' : 'Laudo Médico'}
            </h3>

            <p className="mb-6">
              <span className="font-semibold text-primary">Paciente:</span> {patientName}
            </p>

            <div className="flex-1 whitespace-pre-wrap leading-relaxed text-foreground/90">
              {content}
            </div>

            <div className="mt-12 flex flex-col items-center justify-center pt-8 border-t border-primary/20 relative">
              {isSigned && (
                <div className="absolute -top-6 flex flex-col items-center opacity-80">
                  <FileSignature className="w-6 h-6 text-accent/50" />
                </div>
              )}
              <p className="font-serif font-medium text-primary">Dra. Sofia Alencar</p>
              <p className="text-xs text-muted-foreground">Médica Dermatologista - CRM 123456/SP</p>
              <p className="text-[10px] text-muted-foreground mt-4">São Paulo, {currentDate}</p>
            </div>
          </div>

          <div className="bg-primary text-white text-[9px] py-2 text-center opacity-90">
            Documento gerado digitalmente pela Clínica MEDSPA.
          </div>
        </div>
      </div>
    </div>
  )
}
