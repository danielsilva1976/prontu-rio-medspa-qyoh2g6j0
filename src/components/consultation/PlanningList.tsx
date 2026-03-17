import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { History, Calendar, Plus, ClipboardList } from 'lucide-react'
import type { SavedPlan } from './PlanningForm'

type Props = {
  plans: SavedPlan[]
  onCreate: () => void
  isSigned: boolean
}

export default function PlanningList({ plans, onCreate, isSigned }: Props) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-6 animate-fade-in">
      {plans.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <History className="w-4 h-4 text-primary" /> Histórico de Planejamentos
          </h3>
          <div className="grid gap-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border/50 bg-muted/5 hover:bg-muted/10 transition-colors shadow-none rounded-xl"
              >
                <div>
                  <p className="font-semibold text-foreground text-base">{plan.planName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5 font-medium">
                    <Calendar className="w-3 h-3" /> Data de criação: {plan.date}
                  </p>
                </div>
                <div className="text-left sm:text-right bg-white p-3 rounded-lg border border-border/50">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Investimento Previsto
                  </p>
                  <p className="text-lg font-bold text-primary tracking-tight mt-0.5">
                    {formatCurrency(plan.totalInvestment)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/10 rounded-xl border border-dashed border-border/50 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <ClipboardList className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <p className="text-base font-medium text-foreground">Nenhum planejamento salvo</p>
          <p className="text-sm text-muted-foreground mt-1">
            Crie um novo planejamento para estruturar o tratamento.
          </p>
        </div>
      )}

      {!isSigned && (
        <Button
          onClick={onCreate}
          className="w-full h-14 text-base rounded-xl mt-2 border border-primary/10 shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" /> Incluir novo planejamento
        </Button>
      )}
    </div>
  )
}
