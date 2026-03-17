import { useState, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Target, Plus, CalendarClock, Tag, Calculator, CreditCard, Save } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useSettingsStore from '@/stores/useSettingsStore'
import useAuditStore from '@/stores/useAuditStore'
import PlanningEntryItem, { type ChronogramEntry, type ProcedureOption } from './PlanningEntryItem'

export type SavedPlan = {
  id: string
  date: string
  planName: string
  objective: string
  totalInvestment: number
  entries: ChronogramEntry[]
  downPayment: number
  downPaymentMethod: string
  installments: number
  installmentValue: number
  paymentMethod: string
}

export const PAYMENT_METHODS = [
  { id: 'credit', label: 'Cartão de Crédito' },
  { id: 'pix', label: 'PIX' },
  { id: 'boleto', label: 'Boleto Bancário' },
  { id: 'cash', label: 'Dinheiro' },
]

export const getPaymentMethodLabel = (id: string) =>
  PAYMENT_METHODS.find((m) => m.id === id)?.label || 'Não informado'

type Props = {
  isSigned: boolean
  patientId: string
  onSave: (plan: SavedPlan) => void
  onCancel: () => void
}

export default function PlanningForm({ isSigned, patientId, onSave, onCancel }: Props) {
  const { procedures, technologies, prices } = useSettingsStore()
  const { addLog } = useAuditStore()

  const [objective, setObjective] = useState('')
  const [planName, setPlanName] = useState('')
  const [downPayment, setDownPayment] = useState('')
  const [downPaymentMethod, setDownPaymentMethod] = useState('')
  const [installments, setInstallments] = useState('1')
  const [paymentMethod, setPaymentMethod] = useState('')

  const [entries, setEntries] = useState<ChronogramEntry[]>([
    {
      id: '1',
      timing: 'Sessão 01',
      procedure: '',
      quantity: '1',
      standardValue: '',
      discountValue: '',
      discountType: 'currency',
      finalValue: '',
    },
  ])

  const addEntry = () =>
    setEntries((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        timing: '',
        procedure: '',
        quantity: '1',
        standardValue: '',
        discountValue: '',
        discountType: 'currency',
        finalValue: '',
      },
    ])

  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id))

  const updateEntry = (id: string, field: keyof ChronogramEntry, value: string) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)))

  const uniqueProcedures: ProcedureOption[] = useMemo(() => {
    const combined = [...procedures, ...technologies, 'Retorno', 'Consulta']
    return Array.from(new Set(combined)).map((name) => ({
      name,
      standardValue: prices[name] || '',
    }))
  }, [procedures, technologies, prices])

  const totalInvestment = useMemo(
    () => entries.reduce((acc, e) => acc + (parseFloat(e.finalValue) || 0), 0),
    [entries],
  )
  const installmentValue = useMemo(
    () =>
      Math.max(0, totalInvestment - (parseFloat(downPayment) || 0)) / (parseInt(installments) || 1),
    [totalInvestment, downPayment, installments],
  )

  const formatCurr = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const handleSave = () => {
    addLog('Planejamento salvo', patientId)
    onSave({
      id: Math.random().toString(36).slice(2),
      date: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
        new Date(),
      ),
      planName: planName || 'Plano Personalizado',
      objective,
      totalInvestment,
      entries,
      downPayment: parseFloat(downPayment) || 0,
      downPaymentMethod,
      installments: parseInt(installments) || 1,
      installmentValue,
      paymentMethod,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-3">
        <Label className="flex items-center gap-1.5 text-base">
          <Target className="w-4 h-4 text-primary/70" /> Objetivo principal do paciente
        </Label>
        <Textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          disabled={isSigned}
          className="min-h-[80px] bg-muted/10 border-border/50 focus-visible:ring-primary rounded-xl"
        />
      </div>

      <div className="space-y-3 pt-1">
        <Label className="flex items-center gap-1.5 text-base">
          <Tag className="w-4 h-4 text-primary/70" /> Nome do Plano Personalizado
        </Label>
        <Input
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          disabled={isSigned}
          className="bg-muted/10 border-border/50 focus-visible:ring-primary rounded-xl"
        />
      </div>

      <div className="space-y-4 pt-1">
        <Label className="flex items-center gap-1.5 text-base">
          <CalendarClock className="w-4 h-4 text-primary/70" /> Cronograma de Tratamento
        </Label>
        <div className="relative border-l-2 border-primary/20 ml-3 md:ml-4 space-y-4 py-2">
          {entries.map((entry) => (
            <PlanningEntryItem
              key={entry.id}
              entry={entry}
              isSigned={isSigned}
              uniqueProcedures={uniqueProcedures}
              onUpdate={updateEntry}
              onRemove={removeEntry}
            />
          ))}
        </div>
        {!isSigned && (
          <Button
            onClick={addEntry}
            variant="outline"
            className="w-full mt-2 border-dashed border-2 hover:bg-primary/5 hover:text-primary hover:border-primary/50 text-muted-foreground rounded-xl py-6 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" /> Adicionar Procedimento/Sessão
          </Button>
        )}
      </div>

      <div className="bg-muted/10 rounded-xl p-5 border border-border/50 space-y-5 mt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" /> Investimento
          </Label>
          <div className="text-3xl font-bold text-primary tracking-tight">
            {formatCurr(totalInvestment)}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-1">
          <div className="space-y-2">
            <Label className="text-xs uppercase font-semibold text-muted-foreground">
              Entrada (R$)
            </Label>
            <Input
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              disabled={isSigned}
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase font-semibold text-muted-foreground">
              Forma de pgto. Entrada
            </Label>
            <Select
              disabled={isSigned}
              value={downPaymentMethod}
              onValueChange={setDownPaymentMethod}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase font-semibold text-muted-foreground">
              Número de parcelas
            </Label>
            <Select disabled={isSigned} value={installments} onValueChange={setInstallments}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 10, 12].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase font-semibold text-primary">Valor da Parcela</Label>
            <Input
              readOnly
              value={formatCurr(installmentValue)}
              className="bg-primary/5 text-primary font-semibold border-primary/20 pointer-events-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase font-semibold text-muted-foreground flex items-center gap-1">
              <CreditCard className="w-3 h-3" /> Forma de pgto. Saldo
            </Label>
            <Select disabled={isSigned} value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button variant="outline" onClick={onCancel} className="rounded-xl">
          Cancelar
        </Button>
        {!isSigned && (
          <Button onClick={handleSave} className="rounded-xl">
            <Save className="w-4 h-4 mr-2" /> Salvar plano
          </Button>
        )}
      </div>
    </div>
  )
}
