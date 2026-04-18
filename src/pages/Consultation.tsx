import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PatientHeader from '@/components/consultation/PatientHeader'
import AnamnesisTab from '@/components/consultation/AnamnesisTab'
import PhysicalExamTab from '@/components/consultation/PhysicalExamTab'
import ProcedureTab from '@/components/consultation/ProcedureTab'
import EvolutionTab from '@/components/consultation/EvolutionTab'
import ReviewTab from '@/components/consultation/ReviewTab'
import DocumentsTab from '@/components/consultation/DocumentsTab'
import PlanningTab from '@/components/consultation/PlanningTab'
import AuditLogTab from '@/components/consultation/AuditLogTab'
import HistoryTab from '@/components/consultation/HistoryTab'
import LivePreview from '@/components/consultation/LivePreview'
import UploadRecordTab from '@/components/consultation/UploadRecordTab'
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

  const [appointmentDate, setAppointmentDate] = useState<string>(
    () => new Date().toISOString().split('T')[0],
  )
  const [appointmentTime, setAppointmentTime] = useState<string>(() => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  })

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
    const novoAtendimentoTabs = ['anamnese', 'exame', 'procedimentos', 'evolucao', 'resumo']
    if (!isStarted && novoAtendimentoTabs.includes(activeTab)) {
      newTab = 'historico'
    }

    if (!isStarted && activeTab === 'novo') {
      newTab = 'historico'
    }

    if (!showAnamneseExame && (activeTab === 'anamnese' || activeTab === 'exame')) {
      newTab = newTab === activeTab ? 'historico' : newTab
    }
    if (
      !showDocs &&
      (activeTab === 'receitas' || activeTab === 'laudos' || activeTab === 'inclusao')
    ) {
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

      const orderedAnamneseKeys = Object.keys(anamneseMap)
      orderedAnamneseKeys.forEach((k) => {
        const v = draftData.anamnese[k]
        if (v && typeof v === 'string' && v.trim() !== '') {
          anamneseSection[anamneseMap[k]] = v.trim()
        }
      })

      Object.entries(draftData.anamnese).forEach(([k, v]) => {
        if (!orderedAnamneseKeys.includes(k) && v && typeof v === 'string' && v.trim() !== '') {
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

      const orderedExameKeys = Object.keys(exameMap)
      orderedExameKeys.forEach((k) => {
        const v = draftData.exame[k]
        if (v && typeof v === 'string' && v.trim() !== '') {
          exameSection[exameMap[k]] = v.trim()
        }
      })

      Object.entries(draftData.exame).forEach(([k, v]) => {
        if (!orderedExameKeys.includes(k) && v && typeof v === 'string' && v.trim() !== '') {
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

    if (draftData.evolucao) {
      const evolucaoSection: Record<string, string> = {}

      if (typeof draftData.evolucao === 'string' && draftData.evolucao.trim() !== '') {
        evolucaoSection['Registro'] = draftData.evolucao.trim()
      } else {
        Object.entries(draftData.evolucao).forEach(([k, v]) => {
          if (v && typeof v === 'string' && v.trim() !== '') {
            let keyName = k.charAt(0).toUpperCase() + k.slice(1)
            if (
              [
                'note',
                'text',
                'evolucao',
                'content',
                'registro',
                'descricao',
                'observacao',
              ].includes(k.toLowerCase())
            ) {
              keyName = 'Registro'
            }
            evolucaoSection[keyName] = v.trim()
          }
        })
      }

      if (Object.keys(evolucaoSection).length > 0) {
        finalContent['Evolução Clínica'] = evolucaoSection
      }
    }

    return finalContent
  }

  const [dbDraft, setDbDraft] = useState<any>(null)

  const fetchDbDraft = async () => {
    if (!patientId) return
    try {
      const records = await pb.collection('medical_records').getFullList({
        filter: `patient = "${patientId}" && professional_registration = "Sem Assinatura"`,
      })
      if (records.length > 0) {
        setDbDraft(records[0].content)
        if (records[0].appointment_date) {
          setAppointmentDate(records[0].appointment_date.split('T')[0])
        }
        if (records[0].horario) {
          setAppointmentTime(records[0].horario)
        }
      } else {
        setDbDraft(null)
      }
    } catch (e) {
      console.error('Erro ao buscar rascunho:', e)
    }
  }

  useEffect(() => {
    fetchDbDraft()
  }, [patientId, isStarted])

  const handleSaveSection = async (tab?: string) => {
    if (!appointmentDate || !appointmentTime) {
      toast({
        title: 'Atenção',
        description: 'Por favor, preencha a data e o horário do atendimento antes de salvar.',
        variant: 'destructive',
      })
      return
    }

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
          appointment_date: new Date(`${appointmentDate}T12:00:00Z`).toISOString(),
          horario: appointmentTime,
        })
      } else {
        await pb.collection('medical_records').create({
          patient: patientId,
          content: finalContent,
          professional_name: currentUser.name,
          professional_registration: 'Sem Assinatura',
          appointment_date: new Date(`${appointmentDate}T12:00:00Z`).toISOString(),
          horario: appointmentTime,
        })
      }

      await fetchDbDraft()

      if (tab) {
        const tabsSequence = ['anamnese', 'exame', 'procedimentos', 'evolucao', 'resumo']
        const currentIndex = tabsSequence.indexOf(tab)
        if (currentIndex !== -1 && currentIndex < tabsSequence.length - 1) {
          setSearchParams({ tab: tabsSequence[currentIndex + 1] }, { replace: true })
        }
      }
    } catch (error) {
      console.error('Erro ao salvar rascunho na base:', error)
    }
  }

  const handleCancelConsultation = async () => {
    endConsultation(patientId)
    clearDraft(patientId)
    setDbDraft(null)
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
      if (!appointmentDate || !appointmentTime) {
        toast({
          title: 'Atenção',
          description: 'Por favor, preencha a data e o horário do atendimento antes de salvar.',
          variant: 'destructive',
        })
        return
      }

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
            appointment_date: new Date(`${appointmentDate}T12:00:00Z`).toISOString(),
            horario: appointmentTime,
          })
        } else {
          await pb.collection('medical_records').create({
            patient: patientId,
            content: finalContent,
            professional_name: currentUser.name,
            professional_registration: registration,
            appointment_date: new Date(`${appointmentDate}T12:00:00Z`).toISOString(),
            horario: appointmentTime,
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
        setDbDraft(null)
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
          <div className="w-full bg-slate-50/80 border-t border-border px-4 md:px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="appt-date"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Data
                </Label>
                <Input
                  id="appt-date"
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="h-8 text-xs w-[130px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="appt-time"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Horário
                </Label>
                <Input
                  id="appt-time"
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="h-8 text-xs w-[100px] bg-white"
                />
              </div>
            </div>
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
            {isStarted && dbDraft && Object.keys(dbDraft).length > 0 && activeTab !== 'resumo' && (
              <LivePreview content={dbDraft} />
            )}
            <div className={cn(activeTab !== 'historico' && 'hidden', 'history-tab-wrapper')}>
              <HistoryTab patientId={patientId} />
            </div>
            {showAnamneseExame && (
              <div className={cn(activeTab !== 'anamnese' && 'hidden')}>
                <AnamnesisTab
                  isSigned={!isStarted}
                  patientId={patientId}
                  onSaveSection={() => handleSaveSection('anamnese')}
                />
              </div>
            )}
            {showAnamneseExame && (
              <div className={cn(activeTab !== 'exame' && 'hidden')}>
                <PhysicalExamTab
                  isSigned={!isStarted}
                  patientId={patientId}
                  onSaveSection={() => handleSaveSection('exame')}
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
                onSaveSection={() => handleSaveSection('procedimentos')}
              />
            </div>
            <div className={cn(activeTab !== 'evolucao' && 'hidden')}>
              <EvolutionTab
                isSigned={!isStarted}
                patientId={patientId}
                onSaveSection={() => handleSaveSection('evolucao')}
              />
            </div>
            <div className={cn(activeTab !== 'resumo' && 'hidden')}>
              <ReviewTab
                content={dbDraft || {}}
                onEdit={() => setSearchParams({ tab: 'anamnese' }, { replace: true })}
                onFinalize={handleToggleConsultation}
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
            {showDocs && (
              <div className={cn(activeTab !== 'inclusao' && 'hidden')}>
                <UploadRecordTab patientId={patientId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
