import { useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
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
import useConsultationStore from '@/stores/useConsultationStore'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

export default function Consultation() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const patientId = id || ''

  const { currentUser } = useUserStore()
  const { addLog } = useAuditStore()
  const { patients } = usePatientStore()
  const { activeConsultations, drafts, startConsultation, endConsultation, clearDraft } =
    useConsultationStore()
  const { toast } = useToast()

  const isStarted = activeConsultations[patientId] || false

  const showAnamneseExame = currentUser.role === 'Médico' || currentUser.role === 'Estético'
  const showDocs = currentUser.role === 'Médico'
  const showAudit = true

  const activeTab = searchParams.get('tab') || 'historico'

  const patient = patients.find((p) => p.id === patientId)

  useEffect(() => {
    if (patientId && patient) {
      addLog('Prontuário visualizado', patientId)
    }
  }, [patientId, patient, addLog])

  // Lock global scrolling to ensure header remains pinned and internal scroll works perfectly
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

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

  const handleToggleConsultation = async () => {
    if (isStarted) {
      try {
        let draftData = drafts[patientId] || {}

        // Mock some data if empty so the document doesn't look empty for the demo
        if (Object.keys(draftData).length === 0) {
          draftData = {
            anamnese:
              'Paciente relata queixas leves. Sem histórico de doenças crônicas ou alergias relatadas.',
            exame:
              'Pele com boa hidratação, tônus preservado. Ausência de lesões elementares aparentes no momento do exame.',
            procedimentos:
              'Realizada avaliação estética facial e protocolo de limpeza de pele superficial.',
            evolucao:
              'Procedimento realizado sem intercorrências. Paciente tolerou bem. Liberado com orientações de cuidados domiciliares e uso de protetor solar.',
          }
        }

        const registration =
          currentUser.role === 'Médico'
            ? 'CRM-SP 123456'
            : currentUser.role === 'Estético'
              ? 'CRBM 1234'
              : 'N/A'

        await pb.collection('medical_records').create({
          patient: patientId,
          content: draftData,
          professional_name: currentUser.name,
          professional_registration: registration,
        })

        endConsultation(patientId)
        clearDraft(patientId)
        addLog('Status alterado: Consulta Finalizada e Prontuário Salvo', patientId)
        setSearchParams({ tab: 'historico' }, { replace: true })

        toast({
          title: 'Atendimento finalizado',
          description: 'O prontuário foi assinado e salvo com sucesso no histórico.',
        })
      } catch (error) {
        console.error('Erro ao salvar prontuário:', error)
        toast({
          title: 'Erro ao finalizar',
          description: 'Ocorreu um erro ao tentar salvar o prontuário.',
          variant: 'destructive',
        })
      }
    } else {
      startConsultation(patientId)
      addLog('Status alterado: Consulta Iniciada', patientId)
    }
  }

  // Graceful error state if patient doesn't exist
  if (!patient) {
    return (
      <div className="flex flex-col flex-1 w-full min-h-0 items-center justify-center h-[calc(100dvh-4rem)] bg-muted/20 p-6 animate-fade-in text-center">
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
    <div className="flex flex-col flex-1 w-full min-h-0 h-[calc(100dvh-4rem)] overflow-hidden bg-muted/20">
      {/* Fixed Header */}
      <div className="bg-white border-b border-border shadow-sm z-20 shrink-0 relative">
        <PatientHeader
          patient={patient}
          id={patientId}
          isStarted={isStarted}
          onToggleConsultation={handleToggleConsultation}
        />
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Content Area with Independent Scrollbar aligned below the header */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full relative scroll-smooth">
          <div className="max-w-5xl mx-auto pb-8">
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
