import { useState } from 'react'
import { Plus, Printer, Download, FileText, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import useAuditStore from '@/stores/useAuditStore'
import useDocumentStore from '@/stores/useDocumentStore'
import { DocumentA4 } from '@/components/documents/DocumentA4'

const generatedDocuments = [
  {
    id: 1,
    type: 'Receituário Médico',
    title: 'Receituário Skincare Routine',
    date: '17/03/2026',
    status: 'Assinado',
    content:
      'Uso Tópico:\n\n1. Ácido Retinóico 0.025% creme - 30g\n   Aplicar uma fina camada no rosto à noite, 3x na semana.\n\n2. Vitamina C 15% sérum - 30ml\n   Aplicar no rosto pela manhã, antes do protetor solar.\n\n3. Protetor Solar FPS 50+ toque seco\n   Aplicar generosamente pela manhã e reaplicar a cada 3 horas.',
  },
]

export default function DocumentsTab({
  isSigned,
  patientId,
}: {
  isSigned: boolean
  patientId: string
}) {
  const { addLog } = useAuditStore()
  const { templates, layout } = useDocumentStore()

  const [docType, setDocType] = useState('prescription')
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')

  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false)

  const availableTemplates = templates.filter(
    (t) => t.type === (docType === 'prescription' ? 'receita' : 'laudo'),
  )

  const handleTemplateSelect = (val: string) => {
    const tmpl = templates.find((t) => t.id === val)
    if (tmpl) {
      setContent(tmpl.content)
      if (!title) setTitle(tmpl.title)
    }
  }

  const handlePreview = (doc: any) => {
    setSelectedDoc(doc)
    setPreviewOpen(true)
  }

  const handleConfirmAndSign = () => {
    addLog('Documento gerado e assinado', patientId)
    setIsSignDialogOpen(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
      <Card className="lg:col-span-2 border-t-[6px] border-t-primary shadow-subtle rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-serif text-primary flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary/80" />
            Gerar Novo Documento
          </CardTitle>
          <CardDescription className="text-base">
            Crie receitas e laudos com a identidade visual configurada da Clínica.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-5 rounded-xl border border-border/50">
            <div className="space-y-2">
              <Label className="text-foreground/80">Tipo de Documento</Label>
              <Select
                disabled={isSigned}
                value={docType}
                onValueChange={(v) => {
                  setDocType(v)
                  setContent('')
                }}
              >
                <SelectTrigger className="bg-white border-border rounded-lg">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prescription">Receituário</SelectItem>
                  <SelectItem value="report">Laudo Médico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">Título / Referência</Label>
              <Input
                disabled={isSigned}
                placeholder="Ex: Receita Rotina Noturna"
                className="bg-white rounded-lg"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground/80 flex justify-between items-end">
              <span>Conteúdo do Documento</span>
              <div className="flex items-center gap-2">
                <Select onValueChange={handleTemplateSelect} disabled={isSigned}>
                  <SelectTrigger className="h-8 bg-primary/5 border-primary/20 text-primary w-[220px] text-xs">
                    <SelectValue placeholder="Carregar modelo salvo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.length === 0 && (
                      <SelectItem value="none" disabled>
                        Nenhum modelo cadastrado
                      </SelectItem>
                    )}
                    {availableTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Label>
            <Textarea
              disabled={isSigned}
              placeholder="Digite o conteúdo aqui..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[300px] resize-y font-serif text-[15px] leading-loose p-5 rounded-xl bg-card"
            />
          </div>

          {!isSigned ? (
            <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
              <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 gap-2 rounded-lg shadow-sm">
                    <Plus className="h-4 w-4" />
                    Gerar e Assinar
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-xl text-primary">
                      Assinatura Digital
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Insira seu PIN para aplicar sua assinatura digital e gerar o documento oficial
                      em PDF com o timbre da clínica.
                    </p>
                    <div className="space-y-3 bg-muted/20 p-4 rounded-lg border border-border">
                      <Label className="text-center block text-foreground/80">
                        PIN de Assinatura
                      </Label>
                      <Input
                        type="password"
                        placeholder="••••"
                        className="text-center text-2xl tracking-[1em] h-12 bg-white"
                        maxLength={4}
                      />
                    </div>
                    <Button
                      onClick={handleConfirmAndSign}
                      className="w-full bg-primary hover:bg-primary/90 h-11 text-base"
                    >
                      Confirmar e Assinar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="pt-6 border-t border-border/50">
              <div className="bg-amber-50/80 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Edição Bloqueada</p>
                  <p className="text-sm mt-1 opacity-90 leading-relaxed">
                    A consulta foi finalizada. A emissão de documentos está desabilitada.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-subtle border-t-4 border-t-muted rounded-xl bg-gradient-to-b from-white to-muted/10">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-serif">Documentos Gerados</CardTitle>
          <CardDescription>Histórico de emissões desta consulta.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {generatedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl border border-border/80 bg-white hover:border-primary/50 hover:shadow-sm transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-success/80"></div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground group-hover:text-primary">
                      {doc.title}
                    </h4>
                    <span className="text-xs text-muted-foreground font-medium">
                      {doc.type} • {doc.date}
                    </span>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-success drop-shadow-sm" />
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-border/40">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs bg-muted/30 hover:bg-primary/10 hover:text-primary"
                    onClick={() => handlePreview(doc)}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Visualizar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden bg-gray-100/95 flex flex-col border-none shadow-elevation backdrop-blur-sm sm:rounded-xl">
          <DialogHeader className="p-4 px-6 bg-white border-b border-border/50 flex flex-row items-center justify-between shadow-sm sticky top-0 z-10 shrink-0">
            <DialogTitle className="text-primary font-serif text-xl flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Pré-visualização do Documento
            </DialogTitle>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> Baixar PDF
              </Button>
              <Button size="sm" onClick={() => setTimeout(() => window.print(), 500)}>
                <Printer className="h-4 w-4 mr-2" /> Imprimir Documento
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 p-8 flex justify-center w-full">
            <DocumentA4
              type={selectedDoc?.type || 'Documento Médico'}
              patientName="Maria da Silva Santos" // Mocked for context
              date={selectedDoc?.date || ''}
              content={selectedDoc?.content || ''}
              config={layout}
              isSigned={selectedDoc?.status === 'Assinado'}
              className="border border-gray-200"
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
