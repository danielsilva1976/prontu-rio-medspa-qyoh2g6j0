import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Stethoscope, Save, Eraser } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import useAuditStore from '@/stores/useAuditStore'
import useConsultationStore from '@/stores/useConsultationStore'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const SECTIONS = [
  {
    id: 'gineco',
    title: 'ANTECEDENTES GINECO-OBSTÉTRICOS',
    fields: [
      { id: 'ciclo', label: 'Ciclo menstrual' },
      { id: 'contraceptivos', label: 'Uso de contraceptivos' },
      { id: 'hormonais', label: 'Alterações hormonais (reposição)', full: true },
      { id: 'menarca', label: 'Menarca, pré-menopausa e menopausa', full: true },
      { id: 'cirurgias_gineco', label: 'Cirurgias', full: true },
    ],
  },
  {
    id: 'alergicos',
    title: 'ANTECEDENTES ALÉRGICOS',
    fields: [
      { id: 'atopias', label: 'Atopias (rinite, bronquite e outras)', full: true },
      { id: 'alergias_meds', label: 'Alergias medicamentosas', full: true },
      {
        id: 'alergias_cosmeticos',
        label: 'Alergias a cosméticos, perfumes, tinturas...',
        full: true,
      },
    ],
  },
  {
    id: 'cirurgicos',
    title: 'ANTECEDENTES CIRÚRGICOS',
    fields: [
      { id: 'tipo_cirurgia', label: 'Tipo de cirurgia e datas', full: true },
      { id: 'cirurgias_plasticas', label: 'Cirurgias plásticas - tipos e datas', full: true },
      { id: 'marcapasso', label: 'Marcapasso' },
      { id: 'proteses', label: 'Uso de próteses' },
    ],
  },
  {
    id: 'dermocosmeticos',
    title: 'ANTECEDENTES DERMOCOSMÉTICOS',
    fields: [
      { id: 'laser', label: 'Laser' },
      { id: 'peeling', label: 'Peeling' },
      { id: 'preenchimentos', label: 'Preenchimentos' },
      { id: 'toxina', label: 'Toxina botulínica' },
      { id: 'tratamentos_derm', label: 'Tratamentos dermatológicos' },
      { id: 'farmacos_ant', label: 'Fármacos de uso anterior' },
      { id: 'farmacos_atual', label: 'Fármacos de uso atual' },
      { id: 'herpes', label: 'Herpes labial e genital' },
      { id: 'tratamentos_esteticos', label: 'Tratamentos estéticos anteriores' },
      { id: 'cosmeticos', label: 'Cosméticos em uso' },
    ],
  },
  {
    id: 'gerais',
    title: 'ANTECEDENTES GERAIS',
    fields: [
      { id: 'habitos', label: 'Hábitos alimentares', full: true },
      { id: 'atividade', label: 'Atividade física', full: true },
      { id: 'sol', label: 'Exposição solar', full: true },
      { id: 'tabagismo', label: 'Tabagismo', full: true },
      { id: 'patologias', label: 'Patologias', full: true },
      { id: 'medicacoes', label: 'Medicações em uso', full: true },
    ],
  },
]

export default function AnamnesisTab({
  isSigned,
  patientId,
}: {
  isSigned: boolean
  patientId: string
}) {
  const { addLog } = useAuditStore()
  const { toast } = useToast()
  const { drafts, updateDraft } = useConsultationStore()

  const formData = drafts[patientId]?.anamnese || {}

  const handleChange = (id: string, value: string) => {
    updateDraft(patientId, 'anamnese', { ...formData, [id]: value })
  }

  const handleSave = () => {
    addLog('Anamnese atualizada', patientId)
    toast({
      title: 'Anamnese salva',
      description: 'As informações do histórico clínico foram atualizadas.',
    })
  }

  const handleClear = () => {
    updateDraft(patientId, 'anamnese', {})
  }

  return (
    <Card className="border-none shadow-subtle overflow-hidden animate-slide-up">
      <div className="h-1 w-full bg-gradient-to-r from-primary/20 to-primary"></div>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary font-serif text-xl">
          <Stethoscope className="w-5 h-5 text-primary" /> História Clínica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="queixa" className="text-base text-foreground font-semibold">
            Queixa Principal
          </Label>
          <Textarea
            id="queixa"
            placeholder="Descreva o motivo da consulta com as palavras do paciente..."
            className="min-h-[100px] resize-y bg-muted/10 border-border/50 shadow-sm focus-visible:ring-primary rounded-xl"
            disabled={isSigned}
            value={formData.queixa || ''}
            onChange={(e) => handleChange('queixa', e.target.value)}
          />
        </div>

        <Accordion type="multiple" className="w-full space-y-4">
          {SECTIONS.map((section) => (
            <AccordionItem
              value={section.id}
              key={section.id}
              className="border border-border/50 bg-white rounded-xl px-5 shadow-sm data-[state=open]:border-primary/30 transition-colors"
            >
              <AccordionTrigger className="text-sm font-bold uppercase tracking-wider text-muted-foreground hover:no-underline hover:text-primary py-4">
                {section.title}
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {section.fields.map((field) => (
                    <div
                      key={field.id}
                      className={cn('space-y-1.5', field.full && 'md:col-span-2')}
                    >
                      <Label htmlFor={field.id} className="text-foreground/80 font-medium">
                        {field.label}
                      </Label>
                      <Input
                        id={field.id}
                        className="bg-muted/10 border-border/50 shadow-sm focus-visible:ring-primary rounded-lg h-9"
                        disabled={isSigned}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {!isSigned && (
          <div className="flex justify-end gap-2 pt-4 mt-6 border-t border-border/50">
            <Button onClick={handleClear} variant="outline" className="shadow-sm">
              <Eraser className="w-4 h-4 mr-2" /> Limpar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              <Save className="w-4 h-4 mr-2" /> Salvar Anamnese
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
