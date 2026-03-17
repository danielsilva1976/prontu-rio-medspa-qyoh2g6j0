import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Clock, FileText, Activity, Syringe, ClipboardList } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PatientHeader from '@/components/consultation/PatientHeader'
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
        <PatientHeader patient={patient} id={id} />

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
