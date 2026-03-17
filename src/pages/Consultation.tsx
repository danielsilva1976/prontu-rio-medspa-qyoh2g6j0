import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Clock, FileText, Activity, Syringe, ClipboardList, ShieldCheck } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PatientHeader from '@/components/consultation/PatientHeader'
import AnamnesisTab from '@/components/consultation/AnamnesisTab'
import PhysicalExamTab from '@/components/consultation/PhysicalExamTab'
import ProcedureTab from '@/components/consultation/ProcedureTab'
import EvolutionTab from '@/components/consultation/EvolutionTab'
import DocumentsTab from '@/components/consultation/DocumentsTab'
import PlanningTab from '@/components/consultation/PlanningTab'
import AuditLogTab from '@/components/consultation/AuditLogTab'
import useUserStore from '@/stores/useUserStore'
import useAuditStore from '@/stores/useAuditStore'
import { patients } from '@/lib/mock-data'

export default function Consultation() {
  const { id } = useParams()
  const location = useLocation()
  const patientId = id || 'p-001'
  const { currentUser } = useUserStore()
  const { addLog } = useAuditStore()

  const [isFinalized, setIsFinalized] = useState(false)

  const showAnamneseExame = currentUser.role === 'Médico' || currentUser.role === 'Estético'
  const showDocs = currentUser.role === 'Médico'

  // Check URL for specific tab request (e.g. ?tab=evolucao for Novo Atendimento)
  const searchParams = new URLSearchParams(location.search)
  const tabParam = searchParams.get('tab')

  const defaultTab = tabParam || (showAnamneseExame ? 'anamnese' : 'planejamento')
  const [activeTab, setActiveTab] = useState(defaultTab)

  useEffect(() => {
    addLog('Prontuário visualizado', patientId)
  }, [patientId, addLog])

  // Ensure active tab updates if user switches role and loses access to current tab
  useEffect(() => {
    if (!showAnamneseExame && (activeTab === 'anamnese' || activeTab === 'exame')) {
      setActiveTab('planejamento')
    }
    if (!showDocs && activeTab === 'documentos') {
      setActiveTab('planejamento')
    }
  }, [showAnamneseExame, showDocs, activeTab])

  const handleFinalize = () => {
    setIsFinalized(true)
    addLog('Status alterado: Consulta Finalizada', patientId)
  }

  // In a real app, we would fetch patient data based on ID
  const patient = patients.find((p) => p.id === patientId) || patients[0]

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Patient Header */}
      <div className="bg-white border-b border-border shadow-sm z-10">
        <PatientHeader
          patient={patient}
          id={patientId}
          isFinalized={isFinalized}
          onFinalize={handleFinalize}
        />

        {/* Custom Branded Tabs Navigation */}
        <div className="px-6 overflow-x-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-max">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto">
              {showAnamneseExame && (
                <>
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
                </>
              )}
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
              {showDocs && (
                <TabsTrigger
                  value="documentos"
                  className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-4 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground"
                >
                  <FileText className="h-4 w-4 mr-2 inline-block" />
                  Receitas & Laudos
                </TabsTrigger>
              )}
              <TabsTrigger
                value="auditoria"
                className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-4 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground"
              >
                <ShieldCheck className="h-4 w-4 mr-2 inline-block" />
                Auditoria
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-auto bg-muted/20 p-6">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} className="w-full">
            {showAnamneseExame && (
              <>
                <TabsContent
                  value="anamnese"
                  className="m-0 focus-visible:outline-none focus-visible:ring-0"
                >
                  <AnamnesisTab isSigned={isFinalized} patientId={patientId} />
                </TabsContent>
                <TabsContent
                  value="exame"
                  className="m-0 focus-visible:outline-none focus-visible:ring-0"
                >
                  <PhysicalExamTab isSigned={isFinalized} patientId={patientId} />
                </TabsContent>
              </>
            )}
            <TabsContent
              value="planejamento"
              className="m-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <PlanningTab isSigned={isFinalized} patientId={patientId} />
            </TabsContent>
            <TabsContent
              value="procedimentos"
              className="m-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <ProcedureTab isSigned={isFinalized} patientId={patientId} />
            </TabsContent>
            <TabsContent
              value="evolucao"
              className="m-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <EvolutionTab isSigned={isFinalized} patientId={patientId} />
            </TabsContent>
            {showDocs && (
              <TabsContent
                value="documentos"
                className="m-0 focus-visible:outline-none focus-visible:ring-0"
              >
                <DocumentsTab isSigned={isFinalized} patientId={patientId} />
              </TabsContent>
            )}
            <TabsContent
              value="auditoria"
              className="m-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <AuditLogTab patientId={patientId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
