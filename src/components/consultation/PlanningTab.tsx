import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  ClipboardList,
  Target,
  Plus,
  CalendarClock,
  Tag,
  Calculator,
  CreditCard,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useSettingsStore from '@/stores/useSettingsStore'
import PlanningEntryItem, { type ChronogramEntry } from './PlanningEntryItem'

export default function PlanningTab({ isSigned }: { isSigned: boolean }) {
  const { procedures } = useSettingsStore()

  const [entries, setEntries] = useState<ChronogramEntry[]>([
    {
      id: '1',
      timing: 'Sessão 01 (Hoje)',
      procedure: 'Toxina Botulínica',
      quantity: '1',
      standardValue: '1500',
      discountValue: '0',
      finalValue: '1500',
    },
    {
      id: '2',
      timing: 'Após 30 dias',
      procedure: 'Bioestimulador de Colágeno',
      quantity: '2',
      standardValue: '3000',
      discountValue: '500',
      finalValue: '2500',
    },
  ])

  const [planName, setPlanName] = useState('')
  const [downPayment, setDownPayment] = useState('')
  const [installments, setInstallments] = useState('1')
  const [paymentMethod, setPaymentMethod] = useState('')

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        id: Math.random().toString(36).slice(2),
        timing: '',
        procedure: '',
        quantity: '1',
        standardValue: '',
        discountValue: '',
        finalValue: '',
      },
    ])
  }

  const removeEntry = (id: string) => setEntries(entries.filter((e) => e.id !== id))

  const updateEntry = (id: string, field: keyof ChronogramEntry, value: string) => {
    setEntries(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  const uniqueProcedures = useMemo(() => {
    return Array.from(
      new Set([...procedures, 'Retorno / Avaliação', 'Consulta', 'Limpeza de Pele', 'Outro']),
    )
  }, [procedures])

  const totalInvestment = useMemo(() => {
    return entries.reduce((acc, entry) => acc + (parseFloat(entry.finalValue) || 0), 0)
  }, [entries])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <Card className="border-none shadow-subtle overflow-hidden animate-slide-up">
      <div className="h-1 w-full bg-gradient-to-r from-primary/20 to-primary" />
      <CardHeader>
        <CardTitle className="font-serif text-xl text-primary flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" /> Planejamento Terapêutico
        </CardTitle>
        <CardDescription>Estratégia clínica e plano de tratamento estruturado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-3">
          <Label className="flex items-center gap-1.5 text-foreground text-base">
            <Target className="w-4 h-4 text-primary/70" /> Objetivos Principais do Paciente
          </Label>
          <Textarea
            placeholder="Ex: Melhorar qualidade da pele..."
            className="bg-muted/10 border-border/50 focus-visible:ring-primary rounded-xl min-h-[80px]"
            disabled={isSigned}
          />
        </div>

        <div className="space-y-3 pt-2">
          <Label className="flex items-center gap-1.5 text-foreground text-base">
            <Tag className="w-4 h-4 text-primary/70" /> Nome que será dado ao plano personalizado
            para o paciente
          </Label>
          <Input
            placeholder="Ex: Protocolo Rejuvenescimento Global 360"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            disabled={isSigned}
            className="bg-muted/10 border-border/50 focus-visible:ring-primary rounded-xl"
          />
        </div>

        <div className="space-y-4 pt-2">
          <Label className="flex items-center gap-1.5 text-foreground text-base">
            <CalendarClock className="w-4 h-4 text-primary/70" /> Cronograma de Tratamento
          </Label>

          <div className="relative border-l-2 border-primary/20 ml-3 md:ml-4 space-y-6 pb-2 pt-2">
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
              className="w-full mt-4 border-dashed border-2 hover:bg-primary/5 hover:text-primary hover:border-primary/50 text-muted-foreground rounded-xl py-6 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Procedimento/Sessão
            </Button>
          )}
        </div>

        <div className="bg-muted/10 rounded-xl p-5 border border-border/50 space-y-5 mt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
            <div className="space-y-1">
              <Label className="text-base font-semibold flex items-center gap-2 text-foreground">
                <Calculator className="w-4 h-4 text-primary" /> Investimento
              </Label>
              <p className="text-sm text-muted-foreground">
                Soma automática dos valores finais previstos no cronograma.
              </p>
            </div>
            <div className="text-3xl font-bold text-primary tracking-tight">
              {formatCurrency(totalInvestment)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Entrada (R$)
              </Label>
              <Input
                type="number"
                placeholder="0.00"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
                disabled={isSigned}
                className="bg-white rounded-lg border-border/50 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Número de parcelas do saldo
              </Label>
              <Select disabled={isSigned} value={installments} onValueChange={setInstallments}>
                <SelectTrigger className="bg-white rounded-lg border-border/50 focus:ring-primary">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 10, 12].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}x {n === 1 ? 'vez' : 'vezes'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Forma de pagamento
              </Label>
              <Select disabled={isSigned} value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-white rounded-lg border-border/50 focus:ring-primary">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto Bancário</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
