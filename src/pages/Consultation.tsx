import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, FileText, Activity, Syringe, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import AnamnesisTab from '@/components/consultation/AnamnesisTab'
import PhysicalExamTab from '@/components/consultation/PhysicalExamTab'
import ProcedureTab from '@/components/consultation/ProcedureTab'
import EvolutionTab from '@/components/consultation/EvolutionTab'
import DocumentsTab from '@/components/consultation/DocumentsTab'
import PlanningTab from '@/components/consultation/PlanningTab'
import { patients } from '@/lib/mock-data'

export default function Consultation() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('anamnese')

  // In a real app, we would fetch patient data based on ID
  const patient = patients[0]

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Patient Header */}
      <div className="bg-white border-b border-border shadow-sm z-10">
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/pacientes">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage
                src={`https://img.usecurling.com/ppl/thumbnail?gender=female&seed=${id || 1}`}
              />
              <AvatarFallback>{patient.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                {patient.name}
                <Badge variant="outline" className="text-primary border-primary bg-primary/5">
                  Atendimento em curso
                </Badge>
              </h1>
              <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                <span>{patient.age} anos</span>
                <span>•</span>
                <span>Convênio: Particular</span>
                <span>•</span>
                <span>Última visita: 12/02/2026</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/5">
              Histórico Completo
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Finalizar Atendimento
            </Button>
          </div>
        </div>

        {/* Custom Branded Tabs Navigation */}
        <div className="px-6 overflow-x-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-max">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto">
              <TabsTrigger
                value="anamnese"
                className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-4 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground"
              >
                <FileText className="h-4 w-4 mr-2 inline-block" />
                Anamnese
              </TabsTrigger>
              <TabsTrigger
                value="exame"
                className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-4 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground"
              >
                <Activity className="h-4 w-4 mr-2 inline-block" />
                Exame Físico
              </TabsTrigger>
              <TabsTrigger
                value="planejamento"
                className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-4 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground"
              >
                <ClipboardList className="h-4 w-4 mr-2 inline-block" />
                Planejamento
              </TabsTrigger>
              <TabsTrigger
                value="procedimentos"
                className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-4 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground"
              >
                <Syringe className="h-4 w-4 mr-2 inline-block" />
                Procedimentos
              </TabsTrigger>
              <TabsTrigger
                value="evolucao"
                className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-4 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground"
              >
                <Clock className="h-4 w-4 mr-2 inline-block" />
                Evolução
              </TabsTrigger>
              <TabsTrigger
                value="documentos"
                className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-4 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground"
              >
                <FileText className="h-4 w-4 mr-2 inline-block" />
                Receitas & Laudos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-auto bg-muted/20 p-6">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} className="w-full">
            <TabsContent
              value="anamnese"
              className="m-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <AnamnesisTab isSigned={false} />
            </TabsContent>
            <TabsContent
              value="exame"
              className="m-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <PhysicalExamTab isSigned={false} />
            </TabsContent>
            <TabsContent
              value="planejamento"
              className="m-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <PlanningTab isSigned={false} />
            </TabsContent>
            <TabsContent
              value="procedimentos"
              className="m-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <ProcedureTab isSigned={false} />
            </TabsContent>
            <TabsContent
              value="evolucao"
              className="m-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <EvolutionTab isSigned={false} />
            </TabsContent>
            <TabsContent
              value="documentos"
              className="m-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <DocumentsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
