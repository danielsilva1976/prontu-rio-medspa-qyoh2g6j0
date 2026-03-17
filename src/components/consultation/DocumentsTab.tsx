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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Document Generator Form */}
      <Card className="lg:col-span-2 border-t-4 border-t-primary shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Novo Documento
          </CardTitle>
          <CardDescription>
            Crie receitas, laudos e atestados com a identidade visual da clínica.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="border-border focus:ring-primary">
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
              <Label>Título / Referência</Label>
              <Input
                placeholder="Ex: Receita Rotina Noturna"
                className="focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Conteúdo do Documento</Label>
            <Textarea
              placeholder="Digite o conteúdo aqui..."
              className="min-h-[300px] resize-y focus-visible:ring-primary font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline">Salvar Rascunho</Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 gap-2">
                  <Plus className="h-4 w-4" />
                  Gerar e Assinar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Assinatura Digital</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Insira seu PIN para aplicar sua assinatura digital e gerar o documento oficial
                    em PDF.
                  </p>
                  <div className="space-y-2">
                    <Label>PIN de Assinatura</Label>
                    <Input
                      type="password"
                      placeholder="••••"
                      className="text-center text-lg tracking-widest focus-visible:ring-primary"
                    />
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Confirmar e Assinar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Document History / List */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Documentos Gerados</CardTitle>
          <CardDescription>Documentos desta consulta.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {generatedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-sm">{doc.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      {doc.type} • {doc.date}
                    </span>
                  </div>
                  {doc.status === 'Assinado' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                      Rascunho
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handlePreview(doc)}
                  >
                    <Printer className="h-3 w-3 mr-1" />
                    Visualizar
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <Download className="h-3 w-3 mr-1" />
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
        <DialogContent className="max-w-3xl h-[85vh] p-0 overflow-hidden bg-gray-100 flex flex-col">
          <DialogHeader className="p-4 bg-white border-b flex flex-row items-center justify-between shadow-sm sticky top-0 z-10">
            <DialogTitle className="text-primary font-medium">
              Visualização do Documento
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> PDF
              </Button>
              <Button className="bg-primary hover:bg-primary/90" size="sm">
                <Printer className="h-4 w-4 mr-2" /> Imprimir
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 p-6 flex justify-center">
            {/* The A4 "Paper" Element */}
            <div className="bg-white shadow-xl mx-auto rounded-sm min-h-[1056px] w-[816px] p-16 flex flex-col relative shrink-0">
              {/* Letterhead Header */}
              <div className="flex flex-col items-center mb-10">
                <img
                  src={logoMarca}
                  alt="MEDSPA Logo"
                  className="h-28 w-auto object-contain mb-6"
                />
                <div className="w-full h-[1px] bg-primary/30"></div>
                <div className="w-full h-[2px] bg-primary mt-1"></div>
              </div>

              {/* Document Body */}
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-center mb-10 uppercase tracking-[0.2em] text-primary">
                  {selectedDoc?.type || 'Documento Médico'}
                </h1>

                {/* Patient Info Header */}
                <div className="mb-8 text-sm text-gray-700">
                  <p>
                    <strong>Paciente:</strong> Maria da Silva Santos
                  </p>
                  <p>
                    <strong>Data:</strong> {selectedDoc?.date}
                  </p>
                </div>

                <div className="text-gray-800 text-[15px] leading-loose whitespace-pre-wrap font-serif">
                  {selectedDoc?.content}
                </div>
              </div>

              {/* Letterhead Footer with Signature */}
              <div className="mt-20 pt-8 flex flex-col items-center justify-end">
                <div className="w-72 border-t border-gray-400 mb-3"></div>
                <p className="font-semibold text-gray-900 tracking-wide text-lg">
                  Dra. Fabíola Kleinert
                </p>
                <p className="text-sm text-gray-500 font-medium">
                  Médica Dermatologista • CRM-SP 123456
                </p>

                {/* Brand Divider */}
                <div className="w-full h-[1px] bg-primary/20 mt-12 mb-2"></div>

                {/* Clinic Footer Info */}
                <p className="text-[11px] text-gray-400 text-center uppercase tracking-wider leading-relaxed">
                  Clínica MEDSPA Dermatologia Avançada
                  <br />
                  Av. Paulista, 1000, Conjunto 101 - Bela Vista, São Paulo - SP
                  <br />
                  (11) 99999-9999 • contato@medspa.com.br
                </p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
