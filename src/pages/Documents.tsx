import { useState } from 'react'
import { Navigate } from 'react-router-dom'
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
import useUserStore from '@/stores/useUserStore'
import logoMarca from '@/assets/marca-principal_page-0001-2e968.jpg'

export default function Documents() {
  const { currentUser } = useUserStore()
  const { toast } = useToast()

  const [docType, setDocType] = useState('receita')
  const [patientName, setPatientName] = useState('Isabella Rodrigues')
  const [content, setContent] = useState(
    'Uso Tópico:\n\n1. Vitamina C 10% - Aplicar 3 a 4 gotas na face pela manhã, antes do protetor solar.\n\n2. Protetor Solar FPS 50+ - Reaplicar a cada 3 horas.\n\n3. Ácido Retinoico 0.025% (Creme) - Aplicar pequena quantidade à noite. Iniciar uso em dias alternados para evitar sensibilização.',
  )

  // Strict RBAC: Only Médico has access to documents module
  if (currentUser.role !== 'Médico') {
    return <Navigate to="/" replace />
  }

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
    <div className="space-y-6 animate-slide-up h-[calc(100vh-8rem)] flex flex-col p-6 lg:p-8 print:p-0 print:h-auto print:block">
      <div className="flex items-center justify-between shrink-0 print:hidden">
        <div>
          <h1 className="text-3xl font-serif text-primary tracking-tight">Documentos Legais</h1>
          <p className="text-muted-foreground mt-1">
            Gere receitas e laudos com o padrão oficial da Clínica
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="bg-white border-border shadow-subtle hover:text-primary hover:border-primary/50 transition-colors"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button className="bg-primary text-white shadow-elevation hover:bg-primary/90 transition-colors">
            <Download className="w-4 h-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[1fr_1.2fr] gap-8 min-h-0 print:block print:w-full">
        {/* Editor Column - Hidden when printing */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2 pb-8 print:hidden">
          <Tabs value={docType} onValueChange={setDocType} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger
                value="receita"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
              >
                Receituário
              </TabsTrigger>
              <TabsTrigger
                value="laudo"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
              >
                Laudo Médico
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="border-none shadow-subtle flex-1 bg-white relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 to-primary"></div>
            <CardContent className="p-6 pt-8 space-y-6 h-full flex flex-col">
              <div className="space-y-2 shrink-0">
                <Label className="text-foreground/80">
                  Vincular Paciente (Busca Belle Software)
                </Label>
                <Select value={patientName} onValueChange={setPatientName}>
                  <SelectTrigger className="bg-muted/20 border-border rounded-xl focus:ring-primary/50">
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
                    <Label className="text-foreground/80">Prescrição (Uso interno/externo)</Label>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-primary hover:text-primary/80 font-medium text-xs"
                    >
                      Carregar modelo salvo
                    </Button>
                  </div>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="flex-1 min-h-[300px] resize-none bg-muted/10 border-border rounded-xl p-5 font-mono text-sm leading-relaxed focus-visible:ring-primary/50"
                    placeholder="Digite os medicamentos e posologia..."
                  />
                </div>
              ) : (
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="space-y-2">
                    <Label className="text-foreground/80">Título do Laudo</Label>
                    <Input
                      placeholder="Ex: Laudo de Procedimento Estético"
                      className="bg-muted/10 border-border rounded-xl focus-visible:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-2 flex-1 flex flex-col">
                    <Label className="text-foreground/80">Conteúdo Descritivo</Label>
                    <Textarea
                      className="flex-1 min-h-[250px] resize-none bg-muted/10 border-border rounded-xl p-5 text-sm focus-visible:ring-primary/50 leading-relaxed"
                      placeholder="Atesto para os devidos fins que a paciente..."
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Column (A4 Paper Simulation) */}
        <div className="hidden lg:flex items-start justify-center bg-muted/20 rounded-2xl border border-border/50 overflow-y-auto p-8 relative print:block print:p-0 print:border-none print:bg-transparent print:h-auto print:overflow-visible">
          <div className="w-full max-w-[21cm] min-h-[29.7cm] bg-white shadow-elevation flex flex-col relative transition-all duration-300 transform xl:scale-95 origin-top print:scale-100 print:shadow-none print:m-0 print:max-w-full">
            {/* MedSpa Branded Letterhead */}
            <div className="flex justify-between items-center px-12 pt-12 pb-8 shrink-0 relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-primary/80"></div>

              <div className="flex flex-col items-start gap-1">
                <img
                  src={logoMarca}
                  alt="Clínica MEDSPA"
                  className="h-20 w-auto object-contain mix-blend-multiply"
                />
              </div>

              <div className="text-right text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-primary text-sm tracking-wide">
                  Dra. Fabíola Kleinert
                </p>
                <p className="font-medium text-foreground/70">Dermatologista • CRM-SP 123456</p>
                <p className="pt-2">Av. Paulista, 1000 - Bela Vista</p>
                <p>São Paulo, SP - 01310-100</p>
                <p>(11) 99999-9999</p>
              </div>
            </div>

            {/* Golden Separator */}
            <div className="mx-12 h-[2px] bg-primary/20 shrink-0"></div>

            {/* Document Body */}
            <div className="flex-1 px-16 pt-10 pb-16 flex flex-col">
              <h3 className="text-center font-serif text-2xl tracking-[0.2em] text-primary uppercase mb-12">
                {docType === 'receita' ? 'Receituário Médico' : 'Laudo Médico'}
              </h3>

              <div className="mb-10 p-4 bg-muted/5 border border-border rounded-lg">
                <p className="text-sm flex gap-2">
                  <span className="font-semibold text-primary uppercase tracking-wider text-xs flex items-center">
                    Paciente:
                  </span>
                  <span className="font-medium text-foreground/90">{patientName}</span>
                </p>
                <p className="text-sm flex gap-2 mt-2">
                  <span className="font-semibold text-primary uppercase tracking-wider text-xs flex items-center">
                    Data:
                  </span>
                  <span className="text-foreground/80">{currentDate}</span>
                </p>
              </div>

              <div className="flex-1 text-[15px] text-foreground/90 whitespace-pre-wrap leading-loose font-serif">
                {content}
              </div>

              {/* Signature Area */}
              <div className="mt-24 flex flex-col items-center justify-center shrink-0 mb-8">
                <div className="w-72 border-t-[1.5px] border-primary/40 relative flex justify-center mb-4">
                  {/* Digital signature watermark */}
                  <div className="absolute -top-12 flex flex-col items-center opacity-80">
                    <FileSignature className="w-10 h-10 text-primary/40" />
                  </div>
                </div>
                <p className="font-serif font-semibold text-lg text-primary">
                  Dra. Fabíola Kleinert
                </p>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  Médica Dermatologista • CRM-SP 123456
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-primary/5 border-t border-primary/20 text-primary/70 text-[10px] py-4 px-12 text-center shrink-0 uppercase tracking-widest leading-relaxed">
              Documento assinado digitalmente conforme MP nº 2.200-2/2001, que institui a
              Infraestrutura de Chaves Públicas Brasileira - ICP-Brasil.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
