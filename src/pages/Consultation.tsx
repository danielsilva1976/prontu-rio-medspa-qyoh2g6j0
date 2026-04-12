import { useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PatientHeader from '@/components/consultation/PatientHeader'
import ConsultationSidebar from '@/components/consultation/ConsultationSidebar'
import AnamnesisTab from '@/components/consultation/AnamnesisTab'
import PhysicalExamTab from '@/components/consultation/PhysicalExamTab'
import ProcedureTab from '@/components/consultation/ProcedureTab'
import EvolutionTab from '@/components/consultation/EvolutionTab'
import DocumentsTab from '@/components/consultation/DocumentsTab'
import PlanningTab from '@/components/consultation/PlanningTab'
import AuditLogTab from '@/components/consultation/AuditLogTab'
import HistoryTab from '@/components/consultation/HistoryTab'
import useUserStore from '@/stores/useUserStore'
import useAuditStore from '@/stores/useAuditStore'
import usePatientStore from '@/stores/usePatientStore'
import useConsultationStore from '@/stores/useConsultationStore'
import { cn } from '@/lib/utils'

export default function Consultation() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const patientId = id || ''

  const { currentUser } = useUserStore()
  const { addLog } = useAuditStore()
  const { patients } = usePatientStore()
  const { activeConsultations, startConsultation, endConsultation } = useConsultationStore()

  const isStarted = activeConsultations[patientId] || false

  const showAnamneseExame = currentUser.role === 'Médico' || currentUser.role === 'Estético'
  const showDocs = currentUser.role === 'Médico'
  const showAudit = currentUser.id === 'usr-admin'

  const activeTab = searchParams.get('tab') || 'historico'

  const patient = patients.find((p) => p.id === patientId)

  useEffect(() => {
    if (patientId && patient) {
      addLog('Prontuário visualizado', patientId)
    }
  }, [patientId, patient, addLog])

  // Sync tab state with URL and ensure tab access is valid for role
  useEffect(() => {
    let newTab = activeTab

    // Redirect if trying to access disabled "Novo Atendimento" tabs while consultation is not started
    const novoAtendimentoTabs = ['anamnese', 'exame', 'procedimentos', 'evolucao']
    if (!isStarted && novoAtendimentoTabs.includes(activeTab)) {
      newTab = 'historico'
    }

    if (!showAnamneseExame && (activeTab === 'anamnese' || activeTab === 'exame')) {
      newTab = newTab === activeTab ? 'historico' : newTab
    }
    if (!showDocs && (activeTab === 'receitas' || activeTab === 'laudos')) {
      newTab = newTab === activeTab ? 'historico' : newTab
    }
    if (!showAudit && activeTab === 'auditoria') {
      newTab = newTab === activeTab ? 'historico' : newTab
    }

    if (newTab !== activeTab) {
      setSearchParams({ tab: newTab }, { replace: true })
    }
  }, [showAnamneseExame, showDocs, showAudit, activeTab, isStarted, setSearchParams])

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true })
  }

  const handleToggleConsultation = () => {
    if (isStarted) {
      endConsultation(patientId)
      addLog('Status alterado: Consulta Finalizada', patientId)
      setSearchParams({ tab: 'historico' }, { replace: true })
    } else {
      startConsultation(patientId)
      addLog('Status alterado: Consulta Iniciada', patientId)
    }
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
      <div className="bg-white border-b border-border shadow-sm z-10 shrink-0">
        <PatientHeader
          patient={patient}
          id={patientId}
          isStarted={isStarted}
          onToggleConsultation={handleToggleConsultation}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <ConsultationSidebar
          activeTab={activeTab}
          isStarted={isStarted}
          showAnamneseExame={showAnamneseExame}
          showDocs={showDocs}
          showAudit={showAudit}
          onTabChange={handleTabChange}
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto bg-muted/20 p-4 md:p-6 w-full relative">
          {/* Mobile Navigation Scroll */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-4 mb-2 -mx-4 px-4 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={() => handleTabChange('planejamento')}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                activeTab === 'planejamento'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white text-muted-foreground border-border hover:bg-muted',
              )}
            >
              Planejamento
            </button>
            <button
              onClick={() => handleTabChange('historico')}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                activeTab === 'historico'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white text-muted-foreground border-border hover:bg-muted',
              )}
            >
              Histórico
            </button>

            <div className="w-px bg-border shrink-0 mx-1 my-1" />

            {showAnamneseExame && (
              <button
                disabled={!isStarted}
                onClick={() => handleTabChange('anamnese')}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                  activeTab === 'anamnese'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white text-muted-foreground border-border hover:bg-muted',
                  !isStarted && 'opacity-50 pointer-events-none bg-muted',
                )}
              >
                Anamnese
              </button>
            )}
            {showAnamneseExame && (
              <button
                disabled={!isStarted}
                onClick={() => handleTabChange('exame')}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                  activeTab === 'exame'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white text-muted-foreground border-border hover:bg-muted',
                  !isStarted && 'opacity-50 pointer-events-none bg-muted',
                )}
              >
                Exame Físico
              </button>
            )}
            <button
              disabled={!isStarted}
              onClick={() => handleTabChange('procedimentos')}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                activeTab === 'procedimentos'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white text-muted-foreground border-border hover:bg-muted',
                !isStarted && 'opacity-50 pointer-events-none bg-muted',
              )}
            >
              Procedimentos
            </button>
            <button
              disabled={!isStarted}
              onClick={() => handleTabChange('evolucao')}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                activeTab === 'evolucao'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white text-muted-foreground border-border hover:bg-muted',
                !isStarted && 'opacity-50 pointer-events-none bg-muted',
              )}
            >
              Evolução
            </button>

            {showDocs && <div className="w-px bg-border shrink-0 mx-1 my-1" />}

            {showDocs && (
              <button
                onClick={() => handleTabChange('receitas')}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                  activeTab === 'receitas'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white text-muted-foreground border-border hover:bg-muted',
                )}
              >
                Receitas
              </button>
            )}
            {showDocs && (
              <button
                onClick={() => handleTabChange('laudos')}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                  activeTab === 'laudos'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white text-muted-foreground border-border hover:bg-muted',
                )}
              >
                Laudos
              </button>
            )}
            {showAudit && (
              <button
                onClick={() => handleTabChange('auditoria')}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                  activeTab === 'auditoria'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-muted-foreground border-border hover:bg-muted',
                )}
              >
                Auditoria
              </button>
            )}
          </div>

          <div className="max-w-5xl mx-auto">
            <div className={cn(activeTab !== 'historico' && 'hidden')}>
              <HistoryTab patientId={patientId} />
            </div>
            {showAnamneseExame && (
              <div className={cn(activeTab !== 'anamnese' && 'hidden')}>
                <AnamnesisTab isSigned={!isStarted} patientId={patientId} />
              </div>
            )}
            {showAnamneseExame && (
              <div className={cn(activeTab !== 'exame' && 'hidden')}>
                <PhysicalExamTab isSigned={!isStarted} patientId={patientId} />
              </div>
            )}
            <div className={cn(activeTab !== 'planejamento' && 'hidden')}>
              <PlanningTab isSigned={false} patientId={patientId} />
            </div>
            <div className={cn(activeTab !== 'procedimentos' && 'hidden')}>
              <ProcedureTab isSigned={!isStarted} patientId={patientId} />
            </div>
            <div className={cn(activeTab !== 'evolucao' && 'hidden')}>
              <EvolutionTab isSigned={!isStarted} patientId={patientId} />
            </div>
            {showDocs && (
              <div className={cn(activeTab !== 'receitas' && 'hidden')}>
                <DocumentsTab type="receita" isSigned={false} patientId={patientId} />
              </div>
            )}
            {showDocs && (
              <div className={cn(activeTab !== 'laudos' && 'hidden')}>
                <DocumentsTab type="laudo" isSigned={false} patientId={patientId} />
              </div>
            )}
            {showAudit && (
              <div className={cn(activeTab !== 'auditoria' && 'hidden')}>
                <AuditLogTab patientId={patientId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
