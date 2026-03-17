import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Stethoscope, CheckCircle, Save, PenTool, User, AlertCircle, History } from 'lucide-react'
import { patients } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'

export default function Consultation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const patient = patients.find((p) => p.id === id) || patients[0] // fallback for demo

  const [isSigned, setIsSigned] = useState(false)
  const [signatureModalOpen, setSignatureModalOpen] = useState(false)

  const handleSaveDraft = () => {
    toast({
      title: 'Rascunho salvo',
      description: 'As informações foram salvas localmente.',
    })
  }

  const handleSign = () => {
    setIsSigned(true)
    setSignatureModalOpen(false)
    toast({
      title: 'Prontuário Finalizado',
      description: 'Documento assinado digitalmente e trancado para edição.',
      variant: 'default',
    })
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Consultation Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-white p-6 rounded-2xl shadow-subtle border border-border/50">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-muted rounded-xl text-primary">
            <User className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif font-semibold text-primary">{patient.name}</h1>
              {isSigned ? (
                <Badge variant="default" className="bg-success text-white border-none shadow-none">
                  <CheckCircle className="w-3 h-3 mr-1" /> Finalizado
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-accent border-accent/30 bg-accent/5 shadow-none"
                >
                  <span className="animate-pulse w-1.5 h-1.5 bg-accent rounded-full mr-2"></span> Em
                  atendimento
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1 text-sm flex items-center gap-4">
              <span>{patient.age} anos</span>
              <span>ID Belle: {patient.id.toUpperCase()}</span>
              <span>Última visita: {new Date(patient.lastVisit).toLocaleDateString('pt-BR')}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSigned}
            className="border-border hover:bg-muted"
          >
            <Save className="w-4 h-4 mr-2" /> Salvar Rascunho
          </Button>

          <Dialog open={signatureModalOpen} onOpenChange={setSignatureModalOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={isSigned}
                className="bg-primary text-white hover:bg-primary/90 shadow-elevation"
              >
                <PenTool className="w-4 h-4 mr-2" /> Finalizar e Assinar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Assinatura Digital</DialogTitle>
                <DialogDescription>
                  Revise o prontuário antes de assinar. Após assinar, o documento será bloqueado
                  legalmente.
                </DialogDescription>
              </DialogHeader>

              <div className="my-6">
                <div
                  className="bg-muted/30 border border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors group"
                  onClick={handleSign}
                >
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                    <FileSignature className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Clique para aplicar sua assinatura ICP-Brasil
                  </p>
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    Dra. Sofia Alencar - CRM 123456/SP
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSignatureModalOpen(false)}>
                  Cancelar
                </Button>
                {/* We trigger the action via the div above for demo, but keeping a primary button is good practice */}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Form Area */}
      <Tabs defaultValue="anamnese" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-white border shadow-subtle rounded-xl mb-6">
          <TabsTrigger
            value="anamnese"
            className="rounded-lg py-3 data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:shadow-none transition-all"
          >
            Anamnese
          </TabsTrigger>
          <TabsTrigger
            value="exame"
            className="rounded-lg py-3 data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:shadow-none transition-all"
          >
            Exame Físico
          </TabsTrigger>
          <TabsTrigger
            value="procedimento"
            className="rounded-lg py-3 data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:shadow-none transition-all"
          >
            Registro de Procedimento
          </TabsTrigger>
          <TabsTrigger
            value="evolucao"
            className="rounded-lg py-3 data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:shadow-none transition-all"
          >
            Evolução
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Anamnese */}
        <TabsContent value="anamnese" className="space-y-6 animate-slide-up mt-0">
          <Card className="border-none shadow-subtle overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-accent/20 to-accent"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary font-serif text-xl">
                <Stethoscope className="w-5 h-5 text-accent" /> História Clínica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="queixa" className="text-base text-foreground">
                  Queixa Principal
                </Label>
                <Textarea
                  id="queixa"
                  placeholder="Descreva o motivo da consulta com as palavras do paciente..."
                  className="min-h-[100px] resize-y bg-muted/20 border-border focus-visible:ring-accent rounded-xl"
                  disabled={isSigned}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="alergias" className="flex items-center gap-1 text-foreground">
                    <AlertCircle className="w-4 h-4 text-destructive" /> Alergias Conhecidas
                  </Label>
                  <Textarea
                    id="alergias"
                    placeholder="Ex: Látex, Dipirona, Lidocaína..."
                    className="bg-muted/20 border-border focus-visible:ring-accent rounded-xl"
                    disabled={isSigned}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicamentos" className="text-foreground">
                    Uso Contínuo de Medicamentos
                  </Label>
                  <Textarea
                    id="medicamentos"
                    placeholder="Ex: Roacutan (isotretinoína), Anticoncepcional..."
                    className="bg-muted/20 border-border focus-visible:ring-accent rounded-xl"
                    disabled={isSigned}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="procedimentos_previos" className="text-foreground">
                  Procedimentos Estéticos Prévios
                </Label>
                <Textarea
                  id="procedimentos_previos"
                  placeholder="Detalhe tratamentos anteriores, intercorrências, insatisfações..."
                  className="min-h-[100px] bg-muted/20 border-border focus-visible:ring-accent rounded-xl"
                  disabled={isSigned}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Exame Físico */}
        <TabsContent value="exame" className="space-y-6 animate-slide-up mt-0">
          <Card className="border-none shadow-subtle overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-accent/20 to-accent"></div>
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
                    <SelectTrigger className="bg-muted/20 border-border rounded-xl focus:ring-accent">
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
                    <SelectTrigger className="bg-muted/20 border-border rounded-xl focus:ring-accent">
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
                    <SelectTrigger className="bg-muted/20 border-border rounded-xl focus:ring-accent">
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
                <Label>Inspeção Visual e Achados</Label>
                <Textarea
                  placeholder="Descreva assimetrias, manchas (melasma, melanose), cicatrizes, flacidez..."
                  className="min-h-[120px] bg-muted/20 border-border focus-visible:ring-accent rounded-xl"
                  disabled={isSigned}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Procedimento */}
        <TabsContent value="procedimento" className="space-y-6 animate-slide-up mt-0">
          <Card className="border-none shadow-subtle overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-accent/20 to-accent"></div>
            <CardHeader>
              <CardTitle className="font-serif text-xl text-primary flex items-center gap-2">
                <Syringe className="w-5 h-5 text-accent" /> Registro Técnico
              </CardTitle>
              <CardDescription>Detalhes do material utilizado e técnica aplicada.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6 bg-muted/10 p-6 rounded-xl border border-border">
                <div className="space-y-2">
                  <Label className="text-foreground">Tipo de Procedimento Principal</Label>
                  <Select disabled={isSigned}>
                    <SelectTrigger className="bg-white border-border rounded-xl focus:ring-accent shadow-sm">
                      <SelectValue placeholder="Ex: Toxina Botulínica" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="toxina">Toxina Botulínica</SelectItem>
                      <SelectItem value="preenchimento">
                        Preenchimento com Ácido Hialurônico
                      </SelectItem>
                      <SelectItem value="bioestimulador">Bioestimulador de Colágeno</SelectItem>
                      <SelectItem value="fios">Fios de PDO</SelectItem>
                      <SelectItem value="laser">Laser / Tecnologias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Áreas Tratadas</Label>
                  <Input
                    placeholder="Ex: Glabela, Fronte, Periorbicular"
                    className="bg-white border-border rounded-xl focus-visible:ring-accent shadow-sm"
                    disabled={isSigned}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Produto / Marca</Label>
                  <Input
                    placeholder="Ex: Botox® (Allergan), Restylane"
                    className="bg-white border-border rounded-xl focus-visible:ring-accent shadow-sm"
                    disabled={isSigned}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Lote</Label>
                    <Input
                      placeholder="Nº do lote"
                      className="bg-white border-border rounded-xl focus-visible:ring-accent shadow-sm"
                      disabled={isSigned}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Dose / Volume (U ou mL)</Label>
                    <Input
                      placeholder="Ex: 50U, 1mL"
                      className="bg-white border-border rounded-xl focus-visible:ring-accent shadow-sm"
                      disabled={isSigned}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Técnica de Aplicação e Observações</Label>
                <Textarea
                  placeholder="Descreva os planos de aplicação (supraperiosteal, derme profunda), uso de cânula ou agulha, intercorrências imediatas (sangramento, hematoma)..."
                  className="min-h-[120px] bg-muted/20 border-border focus-visible:ring-accent rounded-xl"
                  disabled={isSigned}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Evolução */}
        <TabsContent value="evolucao" className="space-y-6 animate-slide-up mt-0">
          <Card className="border-none shadow-subtle overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-muted to-muted-foreground/30"></div>
            <CardHeader>
              <CardTitle className="font-serif text-xl text-primary flex items-center gap-2">
                <History className="w-5 h-5" /> Histórico do Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-l-2 border-muted ml-4 md:ml-6 space-y-8 pb-4">
                {/* Mock timeline items */}
                <div className="relative pl-6">
                  <div className="absolute w-4 h-4 bg-background border-2 border-accent rounded-full -left-[9px] top-1"></div>
                  <p className="text-sm font-bold text-accent mb-1">15 de Setembro, 2023</p>
                  <div className="bg-white border border-border/50 rounded-xl p-4 shadow-sm">
                    <p className="font-medium text-primary mb-2">
                      Toxina Botulínica (Terço Superior)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Aplicação de 45U de Dysport. Paciente queixava-se de vincos glabelares fortes.
                      Sem intercorrências. Orientada sobre cuidados pós.
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs font-medium text-success">
                      <CheckCircle className="w-3 h-3" /> Assinado por Dra. Sofia Alencar
                    </div>
                  </div>
                </div>

                <div className="relative pl-6">
                  <div className="absolute w-4 h-4 bg-background border-2 border-muted-foreground rounded-full -left-[9px] top-1"></div>
                  <p className="text-sm font-bold text-muted-foreground mb-1">10 de Março, 2023</p>
                  <div className="bg-white border border-border/50 rounded-xl p-4 shadow-sm opacity-80">
                    <p className="font-medium text-primary mb-2">
                      Primeira Consulta - Avaliação Global
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Mapeamento facial realizado. Indicado plano de tratamento anual focando em
                      prevenção de rugas dinâmicas e melhora de textura da pele.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
// Required Lucide Icon import helper for above file
import { FileSignature } from 'lucide-react'
