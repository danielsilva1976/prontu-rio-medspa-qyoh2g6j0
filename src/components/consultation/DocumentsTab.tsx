import { useState } from 'react'
import { Plus, Printer, Download, FileText, CheckCircle2 } from 'lucide-react'
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
import logoMarca from '@/assets/marca-principal_page-0001-2e968.jpg'
import { ScrollArea } from '@/components/ui/scroll-area'

// Mock generated documents
const generatedDocuments = [
  {
    id: 1,
    type: 'Receituário',
    title: 'Receituário Skincare Routine',
    date: '17/03/2026',
    status: 'Assinado',
    content:
      'Uso Tópico:\n\n1. Ácido Retinóico 0.025% creme - 30g\n   Aplicar uma fina camada no rosto à noite, 3x na semana.\n\n2. Vitamina C 15% sérum - 30ml\n   Aplicar no rosto pela manhã, antes do protetor solar.\n\n3. Protetor Solar FPS 50+ toque seco\n   Aplicar generosamente pela manhã e reaplicar a cada 3 horas.',
  },
  {
    id: 2,
    type: 'Laudo Médico',
    title: 'Laudo de Procedimento Estético',
    date: '17/03/2026',
    status: 'Rascunho',
    content:
      'Atesto para os devidos fins que a paciente supramencionada submeteu-se, nesta data, a procedimento dermatológico estético minimamente invasivo (Aplicação de Toxina Botulínica tipo A) nas regiões frontal, glabelar e periorbicular.\n\nProcedimento transcorreu sem intercorrências.\n\nRecomendações pós-procedimento fornecidas por escrito à paciente.',
  },
]

export default function DocumentsTab() {
  const [docType, setDocType] = useState('prescription')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)

  const handlePreview = (doc: any) => {
    setSelectedDoc(doc)
    setPreviewOpen(true)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
      {/* Document Generator Form */}
      <Card className="lg:col-span-2 border-t-[6px] border-t-primary shadow-subtle rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-serif text-primary flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary/80" />
            Gerar Novo Documento
          </CardTitle>
          <CardDescription className="text-base">
            Crie receitas, laudos e atestados com a identidade visual da Clínica MEDSPA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-5 rounded-xl border border-border/50">
            <div className="space-y-2">
              <Label className="text-foreground/80">Tipo de Documento</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="bg-white border-border focus:ring-primary rounded-lg">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prescription">Receituário</SelectItem>
                  <SelectItem value="report">Laudo Médico</SelectItem>
                  <SelectItem value="certificate">Atestado</SelectItem>
                  <SelectItem value="consent">Termo de Consentimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">Título / Referência</Label>
              <Input
                placeholder="Ex: Receita Rotina Noturna"
                className="bg-white focus-visible:ring-primary rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground/80 flex justify-between items-center">
              <span>Conteúdo do Documento</span>
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                Formato livre
              </span>
            </Label>
            <Textarea
              placeholder="Digite o conteúdo aqui..."
              className="min-h-[300px] resize-y focus-visible:ring-primary font-serif text-[15px] leading-loose p-5 rounded-xl border-border/80 shadow-inner bg-card"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button
              variant="outline"
              className="rounded-lg border-primary/20 text-primary hover:bg-primary/5"
            >
              Salvar Rascunho
            </Button>
            <Dialog>
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
                      className="text-center text-2xl tracking-[1em] focus-visible:ring-primary h-12 bg-white"
                      maxLength={4}
                    />
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90 h-11 text-base">
                    Confirmar e Assinar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Document History / List */}
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
                {doc.status === 'Assinado' && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-success/80"></div>
                )}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {doc.title}
                    </h4>
                    <span className="text-xs text-muted-foreground font-medium">
                      {doc.type} • {doc.date}
                    </span>
                  </div>
                  {doc.status === 'Assinado' ? (
                    <CheckCircle2 className="h-5 w-5 text-success drop-shadow-sm" />
                  ) : (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                      Rascunho
                    </span>
                  )}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs bg-muted/30 hover:bg-primary/10 hover:text-primary"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Beautiful Letterhead Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden bg-gray-100/95 flex flex-col border-none shadow-elevation backdrop-blur-sm sm:rounded-xl">
          <DialogHeader className="p-4 px-6 bg-white border-b border-border/50 flex flex-row items-center justify-between shadow-sm sticky top-0 z-10 shrink-0">
            <DialogTitle className="text-primary font-serif text-xl flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Pré-visualização do Documento
            </DialogTitle>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-primary/20 hover:bg-primary/5 hover:text-primary"
              >
                <Download className="h-4 w-4 mr-2" /> Baixar PDF
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 shadow-sm"
                size="sm"
                onClick={() => {
                  setTimeout(() => window.print(), 500)
                }}
              >
                <Printer className="h-4 w-4 mr-2" /> Imprimir Documento
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 p-8 flex justify-center w-full">
            {/* The A4 "Paper" Element - Styled to match physical print out */}
            <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] mx-auto rounded-sm min-h-[1056px] w-[816px] p-0 flex flex-col relative shrink-0 mb-8 border border-gray-200">
              {/* Premium Gold Header Bar */}
              <div className="h-2.5 w-full bg-gradient-to-r from-primary to-primary/80"></div>

              <div className="p-16 flex-1 flex flex-col pt-12">
                {/* Letterhead Header */}
                <div className="flex flex-col items-center mb-12">
                  <img
                    src={logoMarca}
                    alt="MEDSPA Logo"
                    className="h-28 w-auto object-contain mb-8 mix-blend-multiply drop-shadow-sm"
                  />
                  <div className="w-full max-w-[80%] h-[1px] bg-primary/20"></div>
                  <div className="w-full max-w-[80%] h-[2px] bg-primary mt-1"></div>
                </div>

                {/* Document Body */}
                <div className="flex-1">
                  <h1 className="text-2xl font-serif text-center mb-12 uppercase tracking-[0.25em] text-primary/90">
                    {selectedDoc?.type || 'Documento Médico'}
                  </h1>

                  {/* Patient Info Header */}
                  <div className="mb-10 text-sm text-gray-700 bg-muted/5 p-4 rounded border border-border/50">
                    <p className="flex items-center gap-2 mb-1">
                      <strong className="text-primary font-semibold uppercase tracking-wider text-xs w-20">
                        Paciente:
                      </strong>
                      <span className="text-base text-foreground">Maria da Silva Santos</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <strong className="text-primary font-semibold uppercase tracking-wider text-xs w-20">
                        Data:
                      </strong>
                      <span className="text-base text-foreground">{selectedDoc?.date}</span>
                    </p>
                  </div>

                  <div className="text-gray-800 text-[16px] leading-loose whitespace-pre-wrap font-serif px-2">
                    {selectedDoc?.content}
                  </div>
                </div>

                {/* Letterhead Footer with Signature */}
                <div className="mt-24 pt-8 flex flex-col items-center justify-end">
                  <div className="w-80 border-t-[1.5px] border-primary/40 mb-4 relative flex justify-center">
                    {/* Visual representation of digital signature */}
                    <div className="absolute -top-14 flex flex-col items-center opacity-70">
                      <FileSignature className="w-12 h-12 text-primary" />
                    </div>
                  </div>
                  <p className="font-serif font-bold text-gray-900 tracking-wide text-xl text-primary">
                    Dra. Fabíola Kleinert
                  </p>
                  <p className="text-[15px] text-gray-500 font-medium mt-1">
                    Médica Dermatologista • CRM-SP 123456
                  </p>

                  {/* Clinic Footer Info */}
                  <div className="w-full mt-16 pt-6 border-t border-primary/20">
                    <p className="text-[11px] text-primary/70 text-center uppercase tracking-[0.15em] leading-loose">
                      Clínica MEDSPA Dermatologia Avançada
                      <br />
                      Av. Paulista, 1000, Conjunto 101 - Bela Vista, São Paulo - SP
                      <br />
                      (11) 99999-9999 • contato@medspa.com.br
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
