import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  Clock,
  FileText,
  Activity,
  Syringe,
  ClipboardList,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
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
import usePatientStore from '@/stores/usePatientStore'

export default function Consultation() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const patientId = id || ''

  const { currentUser } = useUserStore()
  const { addLog } = useAuditStore()
  const { patients } = usePatientStore()

  const [isFinalized, setIsFinalized] = useState(false)

  const showAnamneseExame = currentUser.role === 'Médico' || currentUser.role === 'Estético'
  const showDocs = currentUser.role === 'Médico'
  const showAudit = currentUser.id === 'usr-admin'

  const tabParam = searchParams.get('tab')
  const defaultTab = tabParam || (showAnamneseExame ? 'anamnese' : 'planejamento')
  const [activeTab, setActiveTab] = useState(defaultTab)

  const patient = patients.find((p) => p.id === patientId)

  useEffect(() => {
    if (patientId && patient) {
      addLog('Prontuário visualizado', patientId)
    }
  }, [patientId, patient, addLog])

  // Sync tab state with URL and ensure tab access is valid for role
  useEffect(() => {
    let newTab = activeTab
    if (!showAnamneseExame && (activeTab === 'anamnese' || activeTab === 'exame')) {
      newTab = 'planejamento'
    }
    if (!showDocs && (activeTab === 'receitas' || activeTab === 'laudos')) {
      newTab = 'planejamento'
    }
    if (!showAudit && activeTab === 'auditoria') {
      newTab = 'planejamento'
    }

    if (newTab !== activeTab || newTab !== tabParam) {
      setActiveTab(newTab)
      setSearchParams({ tab: newTab }, { replace: true })
    }
  }, [showAnamneseExame, showDocs, showAudit, activeTab, tabParam, setSearchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSearchParams({ tab: value }, { replace: true })
  }

  const handleFinalize = () => {
    setIsFinalized(true)
    addLog('Status alterado: Consulta Finalizada', patientId)
  }

  // Graceful error state if patient doesn't exist
  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-muted/20 p-6 animate-fade-in text-center">
        <div className="w-20 h-20 bg-white border border-border rounded-full flex items-center justify-center mb-6 shadow-sm">
          <AlertCircle className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <h2 className="text-2xl font-serif text-primary mb-2">Prontuário não encontrado</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          O paciente que você está tentando acessar não existe ou o identificador é inválido.
        </p>
        <Button asChild className="rounded-xl shadow-sm">
          <Link to="/pacientes">Voltar para a Lista de Pacientes</Link>
        </Button>
      </div>
    )
  }

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
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full min-w-max">
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
                <>
                  <TabsTrigger
                    value="receitas"
                    className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-4 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground"
                  >
                    <FileText className="h-4 w-4 mr-2 inline-block" />
                    Receitas
                  </TabsTrigger>
                  <TabsTrigger
                    value="laudos"
                    className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-4 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-foreground"
                  >
                    <FileText className="h-4 w-4 mr-2 inline-block" />
                    Laudos
                  </TabsTrigger>
                </>
              )}
              {showAudit && (
                <TabsTrigger
                  value="auditoria"
                  className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-4 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-amber-600 data-[state=active]:text-amber-700 data-[state=active]:shadow-none hover:text-foreground"
                >
                  <ShieldCheck className="h-4 w-4 mr-2 inline-block" />
                  Auditoria
                </TabsTrigger>
              )}
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
              <>
                <TabsContent
                  value="receitas"
                  className="m-0 focus-visible:outline-none focus-visible:ring-0"
                >
                  <DocumentsTab type="receita" isSigned={isFinalized} patientId={patientId} />
                </TabsContent>
                <TabsContent
                  value="laudos"
                  className="m-0 focus-visible:outline-none focus-visible:ring-0"
                >
                  <DocumentsTab type="laudo" isSigned={isFinalized} patientId={patientId} />
                </TabsContent>
              </>
            )}
            {showAudit && (
              <TabsContent
                value="auditoria"
                className="m-0 focus-visible:outline-none focus-visible:ring-0"
              >
                <AuditLogTab patientId={patientId} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
