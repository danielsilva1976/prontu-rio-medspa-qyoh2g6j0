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
  History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import PatientHeader from '@/components/consultation/PatientHeader'
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
import { cn } from '@/lib/utils'

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
  const defaultTab = tabParam || 'historico'
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

  const renderContent = () => {
    switch (activeTab) {
      case 'historico':
        return <HistoryTab patientId={patientId} />
      case 'anamnese':
        return showAnamneseExame ? (
          <AnamnesisTab isSigned={isFinalized} patientId={patientId} />
        ) : null
      case 'exame':
        return showAnamneseExame ? (
          <PhysicalExamTab isSigned={isFinalized} patientId={patientId} />
        ) : null
      case 'planejamento':
        return <PlanningTab isSigned={isFinalized} patientId={patientId} />
      case 'procedimentos':
        return <ProcedureTab isSigned={isFinalized} patientId={patientId} />
      case 'evolucao':
        return <EvolutionTab isSigned={isFinalized} patientId={patientId} />
      case 'receitas':
        return showDocs ? (
          <DocumentsTab type="receita" isSigned={isFinalized} patientId={patientId} />
        ) : null
      case 'laudos':
        return showDocs ? (
          <DocumentsTab type="laudo" isSigned={isFinalized} patientId={patientId} />
        ) : null
      case 'auditoria':
        return showAudit ? <AuditLogTab patientId={patientId} /> : null
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="bg-white border-b border-border shadow-sm z-10 shrink-0">
        <PatientHeader
          patient={patient}
          id={patientId}
          isFinalized={isFinalized}
          onFinalize={handleFinalize}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Desktop */}
        <div className="w-64 border-r border-border bg-white flex-col overflow-y-auto hidden md:flex shrink-0">
          <nav className="flex-1 p-4 space-y-6">
            {/* Histórico */}
            <div>
              <button
                onClick={() => handleTabChange('historico')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === 'historico'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <History className="w-4 h-4" />
                Histórico
              </button>
            </div>

            {/* Novo Atendimento */}
            <div>
              <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Novo Atendimento
              </h4>
              <div className="space-y-1">
                {showAnamneseExame && (
                  <>
                    <button
                      onClick={() => handleTabChange('anamnese')}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        activeTab === 'anamnese'
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <FileText className="w-4 h-4" />
                      Anamnese
                    </button>
                    <button
                      onClick={() => handleTabChange('exame')}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        activeTab === 'exame'
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Activity className="w-4 h-4" />
                      Exame Físico
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleTabChange('planejamento')}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    activeTab === 'planejamento'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <ClipboardList className="w-4 h-4" />
                  Planejamento
                </button>
                <button
                  onClick={() => handleTabChange('procedimentos')}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    activeTab === 'procedimentos'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Syringe className="w-4 h-4" />
                  Procedimentos
                </button>
                <button
                  onClick={() => handleTabChange('evolucao')}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    activeTab === 'evolucao'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Clock className="w-4 h-4" />
                  Evolução
                </button>
              </div>
            </div>

            {/* Documentos e Auditoria */}
            <div className="space-y-1">
              {showDocs && (
                <>
                  <button
                    onClick={() => handleTabChange('receitas')}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      activeTab === 'receitas'
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <FileText className="w-4 h-4" />
                    Receitas
                  </button>
                  <button
                    onClick={() => handleTabChange('laudos')}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      activeTab === 'laudos'
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <FileText className="w-4 h-4" />
                    Laudos
                  </button>
                </>
              )}
              {showAudit && (
                <button
                  onClick={() => handleTabChange('auditoria')}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mt-4',
                    activeTab === 'auditoria'
                      ? 'bg-amber-100 text-amber-800'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Auditoria
                </button>
              )}
            </div>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto bg-muted/20 p-4 md:p-6 w-full relative">
          {/* Mobile Navigation Scroll */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-4 mb-2 -mx-4 px-4 scroll-smooth">
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
            {showAnamneseExame && (
              <button
                onClick={() => handleTabChange('anamnese')}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                  activeTab === 'anamnese'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white text-muted-foreground border-border hover:bg-muted',
                )}
              >
                Anamnese
              </button>
            )}
            {showAnamneseExame && (
              <button
                onClick={() => handleTabChange('exame')}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                  activeTab === 'exame'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white text-muted-foreground border-border hover:bg-muted',
                )}
              >
                Exame Físico
              </button>
            )}
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
              onClick={() => handleTabChange('procedimentos')}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                activeTab === 'procedimentos'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white text-muted-foreground border-border hover:bg-muted',
              )}
            >
              Procedimentos
            </button>
            <button
              onClick={() => handleTabChange('evolucao')}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                activeTab === 'evolucao'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white text-muted-foreground border-border hover:bg-muted',
              )}
            >
              Evolução
            </button>
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

          <div className="max-w-5xl mx-auto">{renderContent()}</div>
        </div>
      </div>
    </div>
  )
}
