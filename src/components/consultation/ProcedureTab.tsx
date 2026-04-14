import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Syringe, Plus, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ProcedureEntryCard, { type ProcedureEntry } from './ProcedureEntryCard'
import useAuditStore from '@/stores/useAuditStore'
import useConsultationStore from '@/stores/useConsultationStore'

export default function ProcedureTab({
  isSigned,
  patientId,
}: {
  isSigned: boolean
  patientId: string
}) {
  const { addLog } = useAuditStore()
  const { toast } = useToast()
  const { drafts, updateDraft } = useConsultationStore()

  const procData = drafts[patientId]?.procedimentos || { entries: [], generalNotes: '' }
  const entries: ProcedureEntry[] = procData.entries || []
  const generalNotes: string = procData.generalNotes || ''

  const addEntry = () => {
    const currentDrafts = useConsultationStore.getState().drafts
    const currentProcData = currentDrafts[patientId]?.procedimentos || {
      entries: [],
      generalNotes: '',
    }
    const currentEntries = currentProcData.entries || []

    const newEntries = [
      ...currentEntries,
      {
        id: Math.random().toString(36).slice(2),
        type: '',
        area: '',
        technology: '',
        product: '',
        brand: '',
        batch: '',
        dose: '',
        enableMarking: false,
        markingArea: '',
        photo: '',
        points: [],
        vectors: [],
        lines: [],
      },
    ]
    updateDraft(patientId, 'procedimentos', { ...currentProcData, entries: newEntries })
  }

  const removeEntry = (id: string) => {
    const currentDrafts = useConsultationStore.getState().drafts
    const currentProcData = currentDrafts[patientId]?.procedimentos || {
      entries: [],
      generalNotes: '',
    }
    const currentEntries = currentProcData.entries || []
    const newEntries = currentEntries.filter((e: any) => e.id !== id)
    updateDraft(patientId, 'procedimentos', { ...currentProcData, entries: newEntries })
  }

  const updateEntry = (id: string, field: keyof ProcedureEntry, value: any) => {
    const currentDrafts = useConsultationStore.getState().drafts
    const currentProcData = currentDrafts[patientId]?.procedimentos || {
      entries: [],
      generalNotes: '',
    }
    const currentEntries = currentProcData.entries || []
    const newEntries = currentEntries.map((e: any) => (e.id === id ? { ...e, [field]: value } : e))
    updateDraft(patientId, 'procedimentos', { ...currentProcData, entries: newEntries })
  }

  const setGeneralNotes = (val: string) => {
    const currentDrafts = useConsultationStore.getState().drafts
    const currentProcData = currentDrafts[patientId]?.procedimentos || {
      entries: [],
      generalNotes: '',
    }
    updateDraft(patientId, 'procedimentos', { ...currentProcData, generalNotes: val })
  }

  const handleSave = () => {
    addLog('Procedimentos atualizados', patientId)
    toast({
      title: 'Procedimentos salvos',
      description: 'O registro técnico das aplicações foi atualizado.',
    })
  }

  return (
    <Card className="border-none shadow-subtle overflow-hidden animate-slide-up">
      <div className="h-1 w-full bg-gradient-to-r from-primary/20 to-primary"></div>
      <CardHeader>
        <CardTitle className="font-serif text-xl text-primary flex items-center gap-2">
          <Syringe className="w-5 h-5 text-primary" /> Registro Técnico
        </CardTitle>
        <CardDescription>Detalhes dos materiais utilizados e técnicas aplicadas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {entries.length > 0 && (
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <ProcedureEntryCard
                key={entry.id}
                entry={entry}
                index={index}
                isSigned={isSigned}
                onUpdate={updateEntry}
                onRemove={removeEntry}
              />
            ))}
          </div>
        )}

        {!isSigned && (
          <Button
            onClick={addEntry}
            variant="outline"
            className="w-full border-dashed border-2 hover:bg-primary/5 hover:text-primary hover:border-primary/50 text-muted-foreground rounded-xl py-6 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Novo Procedimento
          </Button>
        )}

        <div className="space-y-2 pt-4 border-t border-border">
          <Label>Técnica de Aplicação e Observações Gerais</Label>
          <Textarea
            placeholder="Descreva os planos de aplicação (supraperiosteal, derme profunda), uso de cânula ou agulha, intercorrências imediatas..."
            className="min-h-[120px] bg-muted/20 border-border focus-visible:ring-primary rounded-xl"
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            disabled={isSigned}
          />
        </div>

        {!isSigned && (
          <div className="flex justify-end pt-4 mt-6 border-t border-border/50">
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              <Save className="w-4 h-4 mr-2" /> Salvar Registro
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
