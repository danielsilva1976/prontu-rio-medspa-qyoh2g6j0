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

    if (!isStarted && activeTab === 'novo') {
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

  const buildContent = () => {
    const draftData = drafts[patientId] || {}
    const finalContent: Record<string, Record<string, any>> = {}

    const anamneseMap: Record<string, string> = {
      queixa: 'Queixa Principal',
      ciclo: 'Ciclo Menstrual',
      contraceptivos: 'Uso de Contraceptivos',
      hormonais: 'Alterações Hormonais',
      menarca: 'Menarca/Menopausa',
      cirurgias_gineco: 'Cirurgias Ginecológicas',
      atopias: 'Atopias',
      alergias_meds: 'Alergias Medicamentosas',
      alergias_cosmeticos: 'Alergias a Cosméticos',
      tipo_cirurgia: 'Cirurgias Gerais',
      cirurgias_plasticas: 'Cirurgias Plásticas',
      marcapasso: 'Marcapasso',
      proteses: 'Próteses',
      laser: 'Laser',
      peeling: 'Peeling',
      preenchimentos: 'Preenchimentos',
      toxina: 'Toxina Botulínica',
      tratamentos_derm: 'Tratamentos Dermatológicos',
      farmacos_ant: 'Fármacos Anteriores',
      farmacos_atual: 'Fármacos Atuais',
      herpes: 'Herpes',
      tratamentos_esteticos: 'Tratamentos Estéticos',
      cosmeticos: 'Cosméticos em Uso',
      habitos: 'Hábitos Alimentares',
      atividade: 'Atividade Física',
      sol: 'Exposição Solar',
      tabagismo: 'Tabagismo',
      patologias: 'Patologias',
      medicacoes: 'Medicações em Uso',
    }

    if (draftData.anamnese) {
      const anamneseSection: Record<string, string> = {}
      Object.entries(draftData.anamnese).forEach(([k, v]) => {
        if (v && typeof v === 'string' && v.trim() !== '') {
          anamneseSection[anamneseMap[k] || k] = v.trim()
        }
      })
      if (Object.keys(anamneseSection).length > 0) finalContent['Anamnese'] = anamneseSection
    }

    const exameMap: Record<string, string> = {
      fototipo: 'Fototipo (Fitzpatrick)',
      glogau: 'Grau de Envelhecimento (Glogau)',
      tipoPele: 'Tipo de Pele',
      inspecaoFacial: 'Inspeção Facial',
      padraoQueda: 'Padrão de Queda',
      testeTracao: 'Teste de Tração',
      textura: 'Textura do Fio',
      densidade: 'Densidade',
      tricoscopia: 'Tricoscopia',
      grauCelulite: 'Grau de Celulite (FEG)',
      flacidez: 'Flacidez Tissular',
      gordura: 'Gordura Localizada',
      inspecaoCorporal: 'Inspeção Corporal',
    }

    if (draftData.exame) {
      const exameSection: Record<string, string> = {}
      Object.entries(draftData.exame).forEach(([k, v]) => {
        if (v && typeof v === 'string' && v.trim() !== '') {
          exameSection[exameMap[k] || k] = v.trim()
        }
      })
      if (Object.keys(exameSection).length > 0) finalContent['Exame Físico'] = exameSection
    }

    if (draftData.procedimentos) {
      const procSection: Record<string, any> = {}
      if (draftData.procedimentos.generalNotes?.trim()) {
        procSection['Observações Gerais'] = draftData.procedimentos.generalNotes.trim()
      }
      if (Array.isArray(draftData.procedimentos.entries)) {
        draftData.procedimentos.entries.forEach((entry: any, idx: number) => {
          const details = []
          if (entry.type) details.push(`Tipo: ${entry.type}`)
          if (entry.area) details.push(`Área: ${entry.area}`)
          if (entry.technology) details.push(`Tecnologia: ${entry.technology}`)
          if (entry.product)
            details.push(`Produto: ${entry.product} ${entry.brand ? `(${entry.brand})` : ''}`)
          if (entry.batch) details.push(`Lote: ${entry.batch}`)
          if (entry.dose) details.push(`Dose/Qtd: ${entry.dose}`)

          const hasMarkers =
            entry.points?.length > 0 || entry.vectors?.length > 0 || entry.lines?.length > 0

          if (details.length > 0 || hasMarkers) {
            if (details.length > 0) {
              procSection[`Procedimento ${idx + 1}`] = details.join(' | ')
            } else {
              procSection[`Procedimento ${idx + 1}`] = 'Mapeamento visual registrado.'
            }

            if (hasMarkers) {
              procSection[`_markers_${idx + 1}`] = {
                area: entry.markingArea || entry.area || 'Face',
                points: entry.points || [],
                vectors: entry.vectors || [],
                lines: entry.lines || [],
              }
            }
          }
        })
      }
      if (Object.keys(procSection).length > 0)
        finalContent['Procedimentos Realizados'] = procSection
    }

    if (draftData.evolucao && draftData.evolucao.note?.trim()) {
      finalContent['Evolução Clínica'] = {
        Registro: draftData.evolucao.note.trim(),
      }
    }

    return finalContent
  }

  const handleSaveSection = async () => {
    const finalContent = buildContent()
    if (Object.keys(finalContent).length === 0) return

    try {
      const records = await pb.collection('medical_records').getFullList({
        filter: `patient = "${patientId}" && professional_registration = "Sem Assinatura"`,
      })

      if (records.length > 0) {
        await pb.collection('medical_records').update(records[0].id, {
          content: finalContent,
          professional_name: currentUser.name,
        })
      } else {
        await pb.collection('medical_records').create({
          patient: patientId,
          content: finalContent,
          professional_name: currentUser.name,
          professional_registration: 'Sem Assinatura',
        })
      }
    } catch (error) {
      console.error('Erro ao salvar rascunho na base:', error)
    }
  }

  const handleCancelConsultation = async () => {
    endConsultation(patientId)
    clearDraft(patientId)
    addLog('Status alterado: Atendimento Cancelado', patientId)
    setSearchParams({ tab: 'historico' }, { replace: true })

    try {
      const records = await pb.collection('medical_records').getFullList({
        filter: `patient = "${patientId}" && professional_registration = "Sem Assinatura"`,
      })
      for (const record of records) {
        await pb.collection('medical_records').delete(record.id)
      }
    } catch (e) {
      console.error('Erro ao remover rascunho do prontuário:', e)
    }

    toast({
      title: 'Atendimento cancelado',
      description: 'O atendimento foi encerrado sem salvar os dados.',
    })
  }

  const handleToggleConsultation = async () => {
    if (isStarted) {
      try {
        const finalContent = buildContent()

        const registration =
          currentUser.role === 'Médico'
            ? 'CRM-SP 123456'
            : currentUser.role === 'Estético'
              ? 'CRBM 1234'
              : 'N/A'

        const records = await pb.collection('medical_records').getFullList({
          filter: `patient = "${patientId}" && professional_registration = "Sem Assinatura"`,
        })

        if (records.length > 0) {
          await pb.collection('medical_records').update(records[0].id, {
            content: finalContent,
            professional_name: currentUser.name,
            professional_registration: registration,
          })
        } else {
          await pb.collection('medical_records').create({
            patient: patientId,
            content: finalContent,
            professional_name: currentUser.name,
            professional_registration: registration,
          })
        }

        const draftData = drafts[patientId] || {}
        if (
          draftData.procedimentos &&
          Array.isArray(draftData.procedimentos.entries) &&
          draftData.procedimentos.entries.length > 0
        ) {
          try {
            const patientRecord = await pb.collection('patients').getOne(patientId)
            const existingProcedures = patientRecord.procedures || []
            const newProcedures = draftData.procedimentos.entries
              .filter((e: any) => e.type || e.product)
              .map((e: any) => ({
                date: new Date().toISOString(),
                type: e.type,
                area: e.area,
                product: e.product,
                brand: e.brand,
                dose: e.dose,
                technology: e.technology,
              }))

            if (newProcedures.length > 0) {
              await pb.collection('patients').update(patientId, {
                procedures: [...existingProcedures, ...newProcedures],
              })
            }
          } catch (e) {
            console.error('Erro ao atualizar procedimentos do paciente', e)
          }
        }

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
      setSearchParams({ tab: 'novo' }, { replace: true })
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
      <div className="bg-white border-b border-border shadow-sm z-20 shrink-0 relative flex flex-col">
        <PatientHeader
          patient={patient}
          id={patientId}
          isStarted={isStarted}
          onToggleConsultation={handleToggleConsultation}
        />
        {isStarted && (
          <div className="w-full bg-slate-50/80 border-t border-border px-4 md:px-6 py-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelConsultation}
              className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground transition-colors h-8 text-xs font-medium"
            >
              Cancelar Atendimento
            </Button>
          </div>
        )}
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
                <AnamnesisTab
                  isSigned={!isStarted}
                  patientId={patientId}
                  onSaveSection={handleSaveSection}
                />
              </div>
            )}
            {showAnamneseExame && (
              <div className={cn(activeTab !== 'exame' && 'hidden')}>
                <PhysicalExamTab
                  isSigned={!isStarted}
                  patientId={patientId}
                  onSaveSection={handleSaveSection}
                />
              </div>
            )}
            <div className={cn(activeTab !== 'planejamento' && 'hidden')}>
              <PlanningTab isSigned={false} patientId={patientId} />
            </div>
            <div className={cn(activeTab !== 'procedimentos' && 'hidden')}>
              <ProcedureTab
                isSigned={!isStarted}
                patientId={patientId}
                onSaveSection={handleSaveSection}
              />
            </div>
            <div className={cn(activeTab !== 'evolucao' && 'hidden')}>
              <EvolutionTab
                isSigned={!isStarted}
                patientId={patientId}
                onSaveSection={handleSaveSection}
              />
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
