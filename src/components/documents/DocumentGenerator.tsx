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
import { Printer, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import useDocumentStore from '@/stores/useDocumentStore'
import { DocumentA4 } from './DocumentA4'

export default function DocumentGenerator() {
  const { toast } = useToast()
  const { layout, templates } = useDocumentStore()
  const [docType, setDocType] = useState<'receita' | 'laudo'>('receita')
  const [patientName, setPatientName] = useState('Isabella Rodrigues')
  const [content, setContent] = useState('')

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const typeTemplates = templates.filter((t) => t.type === docType)

  const handlePrint = () => {
    toast({ title: 'Preparando impressão...' })
    setTimeout(() => window.print(), 500)
  }

  const handleTemplateSelect = (val: string) => {
    const tmpl = templates.find((t) => t.id === val)
    if (tmpl) setContent(tmpl.content)
  }

  return (
    <div className="flex-1 grid lg:grid-cols-[1fr_1.2fr] gap-8 min-h-0 print:block print:w-full h-full">
      <div className="flex flex-col gap-6 overflow-y-auto pr-2 pb-8 print:hidden">
        <Tabs
          value={docType}
          onValueChange={(v) => setDocType(v as 'receita' | 'laudo')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="receita" className="rounded-lg">
              Receituário
            </TabsTrigger>
            <TabsTrigger value="laudo" className="rounded-lg">
              Laudo Médico
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="border-none shadow-subtle flex-1 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 to-primary"></div>
          <CardContent className="p-6 pt-8 space-y-6 h-full flex flex-col">
            <div className="space-y-2 shrink-0">
              <Label className="text-foreground/80">Vincular Paciente (Busca Belle Software)</Label>
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

            {docType === 'laudo' && (
              <div className="space-y-2 shrink-0">
                <Label className="text-foreground/80">Título do Laudo</Label>
                <Input placeholder="Ex: Laudo de Procedimento Estético" className="rounded-xl" />
              </div>
            )}

            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex justify-between items-end mb-1">
                <Label className="text-foreground/80">Conteúdo do Documento</Label>
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="h-8 w-[200px] text-xs bg-primary/5 text-primary border-primary/20">
                    <SelectValue placeholder="Carregar modelo salvo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {typeTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 min-h-[300px] resize-none bg-muted/10 border-border rounded-xl p-5 text-[15px] leading-relaxed font-serif"
                placeholder="Digite o conteúdo aqui..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" /> Imprimir
              </Button>
              <Button>
                <Download className="w-4 h-4 mr-2" /> Baixar PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:flex items-start justify-center bg-muted/20 rounded-2xl border border-border/50 overflow-y-auto p-8 relative print:block print:p-0 print:border-none print:bg-transparent print:h-auto print:overflow-visible">
        <div className="transform xl:scale-[0.85] 2xl:scale-95 origin-top print:scale-100 flex justify-center w-full">
          <DocumentA4
            type={docType === 'receita' ? 'Receituário Médico' : 'Laudo Médico'}
            patientName={patientName}
            date={currentDate}
            content={content}
            config={layout}
          />
        </div>
      </div>
    </div>
  )
}
