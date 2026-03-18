import { useState } from 'react'
import {
  Plus,
  Printer,
  Download,
  FileText,
  CheckCircle2,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react'
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
import useDocumentStore, { IssuedDocument } from '@/stores/useDocumentStore'
import usePatientStore from '@/stores/usePatientStore'
import { DocumentA4 } from '@/components/documents/DocumentA4'

export default function DocumentsTab({
  type,
  isSigned,
  patientId,
}: {
  type: 'receita' | 'laudo'
  isSigned: boolean
  patientId: string
}) {
  const { addLog } = useAuditStore()
  const { templates, layout, issuedDocs, issueDocument } = useDocumentStore()
  const { patients } = usePatientStore()

  const patient = patients.find((p) => p.id === patientId)
  const patientName = patient?.name || 'Paciente'

  const [isCreating, setIsCreating] = useState(false)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('none')

  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<IssuedDocument | null>(null)
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false)

  const availableTemplates = templates.filter((t) => t.type === type)
  const patientDocs = issuedDocs.filter((d) => d.patientId === patientId && d.type === type)

  const handleTemplateSelect = (val: string) => {
    setSelectedTemplateId(val)
    const tmpl = templates.find((t) => t.id === val)
    if (tmpl) {
      setContent(tmpl.content)
      if (!title) setTitle(tmpl.title)
    } else {
      setContent('')
    }
  }

  const handlePreview = (doc: IssuedDocument) => {
    setSelectedDoc(doc)
    setPreviewOpen(true)
  }

  const handleConfirmAndSign = () => {
    const newDoc = issueDocument({
      patientId,
      type,
      title: title || (type === 'receita' ? 'Nova Receita' : 'Novo Laudo'),
      content,
      status: 'Assinado',
    })
    addLog(`Documento gerado e assinado (${type})`, patientId)
    setIsSignDialogOpen(false)
    setIsCreating(false)
    setTitle('')
    setContent('')
    setSelectedTemplateId('none')

    // Automatically trigger preview for the newly issued document
    setSelectedDoc(newDoc)
    setPreviewOpen(true)
  }

  const titleText = type === 'receita' ? 'Receitas' : 'Laudos'
  const addButtonText = type === 'receita' ? 'Adicionar Receita' : 'Adicionar Laudo'
  const typeLabel = type === 'receita' ? 'Receituário' : 'Laudo Médico'

  if (isCreating) {
    return (
      <Card className="border-t-[6px] border-t-primary shadow-subtle rounded-xl animate-slide-up">
        <CardHeader className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-serif text-primary flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary/80" />
              Nova {type === 'receita' ? 'Receita' : 'Laudo'}
            </CardTitle>
            <CardDescription className="text-base mt-1">
              Crie {type === 'receita' ? 'uma receita' : 'um laudo'} para {patientName}.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            onClick={() => setIsCreating(false)}
            className="text-muted-foreground self-start md:self-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-5 rounded-xl border border-border/50">
            <div className="space-y-2">
              <Label className="text-foreground/80">Carregar Modelo</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={handleTemplateSelect}
                disabled={isSigned}
              >
                <SelectTrigger className="bg-white border-border rounded-lg">
                  <SelectValue placeholder="Selecione um modelo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Novo Documento em Branco</SelectItem>
                  {availableTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">Título / Referência</Label>
              <Input
                disabled={isSigned}
                placeholder={
                  type === 'receita' ? 'Ex: Receita Rotina Noturna' : 'Ex: Laudo Pós-Procedimento'
                }
                className="bg-white rounded-lg"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground/80 flex justify-between items-end">
              <span>Conteúdo do Documento</span>
            </Label>
            <Textarea
              disabled={isSigned}
              placeholder="Digite o conteúdo aqui..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[300px] resize-y font-serif text-[15px] leading-loose p-5 rounded-xl bg-card"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancelar
            </Button>
            <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={!content.trim()}
                  className="bg-primary hover:bg-primary/90 gap-2 rounded-lg shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Emitir e Assinar
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
                    Insira seu PIN para aplicar sua assinatura digital e salvar o documento oficial
                    no histórico do paciente.
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
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <Card className="border-none shadow-subtle rounded-xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary/20 to-primary" />
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-4">
          <div>
            <CardTitle className="text-xl font-serif text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Histórico de {titleText}
            </CardTitle>
            <CardDescription className="mt-1">
              {type === 'receita'
                ? 'Visualize ou emita novas prescrições para este paciente.'
                : 'Visualize ou emita novos laudos para este paciente.'}
            </CardDescription>
          </div>
          {!isSigned ? (
            <Button onClick={() => setIsCreating(true)} className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              {addButtonText}
            </Button>
          ) : (
            <div className="bg-amber-50 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200 text-xs font-medium flex items-center gap-1.5 self-start sm:self-auto">
              <ShieldAlert className="w-3.5 h-3.5" />
              Edição Bloqueada
            </div>
          )}
        </CardHeader>
        <CardContent>
          {patientDocs.length === 0 ? (
            <div className="text-center py-12 bg-muted/10 rounded-xl border border-dashed border-border">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Nenhum(a) {type === 'receita' ? 'receita emitida' : 'laudo emitido'} para este
                paciente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patientDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-5 rounded-xl border border-border/80 bg-white hover:border-primary/50 hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-success/80"></div>
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-base text-foreground group-hover:text-primary mb-1 truncate">
                        {doc.title}
                      </h4>
                      <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md">
                        {doc.date}
                      </span>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  </div>
                  <div className="flex-1 text-sm text-muted-foreground line-clamp-3 font-serif mb-4 opacity-80">
                    {doc.content}
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-border/40 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs hover:bg-primary/5 hover:text-primary border-border/50"
                      onClick={() => handlePreview(doc)}
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                      Visualizar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs hover:bg-muted"
                      onClick={() => {
                        setSelectedDoc(doc)
                        setPreviewOpen(true)
                        setTimeout(() => window.print(), 500)
                      }}
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                <Printer className="h-4 w-4 mr-2" /> Imprimir
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 p-8 flex justify-center w-full">
            <DocumentA4
              type={typeLabel}
              patientName={patientName}
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
