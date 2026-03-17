import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
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
import { CheckCircle, Save, PenTool, User, FileSignature } from 'lucide-react'
import { patients } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'

import AnamnesisTab from '@/components/consultation/AnamnesisTab'
import PhysicalExamTab from '@/components/consultation/PhysicalExamTab'
import ProcedureTab from '@/components/consultation/ProcedureTab'
import EvolutionTab from '@/components/consultation/EvolutionTab'
import DocumentsTab from '@/components/consultation/DocumentsTab'

export default function Consultation() {
  const { id } = useParams()
  const { toast } = useToast()

  const patient = patients.find((p) => p.id === id) || patients[0] // fallback for stable navigation

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
            <p className="text-muted-foreground mt-1 text-sm flex items-center gap-4 flex-wrap">
              <span>
                Nascimento: {new Date(patient.dob).toLocaleDateString('pt-BR')} ({patient.age} anos)
              </span>
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
                <PenTool className="w-4 h-4 mr-2" /> Finalizar Atendimento
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
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="anamnese" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1 bg-white border shadow-subtle rounded-xl mb-6">
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
            Mapeamento Facial
          </TabsTrigger>
          <TabsTrigger
            value="procedimento"
            className="rounded-lg py-3 data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:shadow-none transition-all"
          >
            Procedimentos
          </TabsTrigger>
          <TabsTrigger
            value="evolucao"
            className="rounded-lg py-3 data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:shadow-none transition-all"
          >
            Evolução
          </TabsTrigger>
          <TabsTrigger
            value="documentos"
            className="rounded-lg py-3 data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:shadow-none transition-all"
          >
            Documentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anamnese" className="mt-0 outline-none">
          <AnamnesisTab isSigned={isSigned} />
        </TabsContent>
        <TabsContent value="exame" className="mt-0 outline-none">
          <PhysicalExamTab isSigned={isSigned} />
        </TabsContent>
        <TabsContent value="procedimento" className="mt-0 outline-none">
          <ProcedureTab isSigned={isSigned} />
        </TabsContent>
        <TabsContent value="evolucao" className="mt-0 outline-none">
          <EvolutionTab isSigned={isSigned} />
        </TabsContent>
        <TabsContent value="documentos" className="mt-0 outline-none">
          <DocumentsTab patientName={patient.name} isSigned={isSigned} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
