import { useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Trash2 } from 'lucide-react'

export type ChronogramEntry = {
  id: string
  timing: string
  procedure: string
  quantity: string
  standardValue: string
  discountValue: string
  discountType: 'currency' | 'percentage'
  finalValue: string
}

type Props = {
  entry: ChronogramEntry
  isSigned: boolean
  uniqueProcedures: string[]
  onUpdate: (id: string, field: keyof ChronogramEntry, value: string) => void
  onRemove: (id: string) => void
}

export default function PlanningEntryItem({
  entry,
  isSigned,
  uniqueProcedures,
  onUpdate,
  onRemove,
}: Props) {
  // Auto-calculate final value based on standard value and discount
  useEffect(() => {
    // Avoid calculating if both inputs are empty and final value is already empty
    if (!entry.standardValue && !entry.discountValue && !entry.finalValue) return

    const standard = parseFloat(entry.standardValue) || 0
    const discount = parseFloat(entry.discountValue) || 0
    let final = standard

    if (entry.discountType === 'percentage') {
      final = standard - standard * (discount / 100)
    } else {
      final = standard - discount
    }

    final = Math.max(0, final)

    // Allow empty state if no inputs
    const finalStr = entry.standardValue || entry.discountValue ? final.toFixed(2) : ''

    if (entry.finalValue !== finalStr && !isSigned) {
      onUpdate(entry.id, 'finalValue', finalStr)
    }
  }, [
    entry.standardValue,
    entry.discountValue,
    entry.discountType,
    entry.finalValue,
    entry.id,
    isSigned,
    onUpdate,
  ])

  return (
    <div className="relative pl-6 md:pl-8 animate-fade-in">
      <div className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full -left-[9px] top-5 shadow-sm" />

      <div className="bg-white border border-border/60 hover:border-primary/40 transition-colors rounded-xl p-4 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="w-full md:w-1/3 space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Momento / Ordem
            </Label>
            <Input
              value={entry.timing}
              onChange={(e) => onUpdate(entry.id, 'timing', e.target.value)}
              disabled={isSigned}
              placeholder="Ex: Sessão 01"
              className="bg-muted/5 h-9"
            />
          </div>
          <div className="w-full md:w-1/2 space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Procedimento / Etapa
            </Label>
            <Select
              disabled={isSigned}
              value={entry.procedure}
              onValueChange={(val) => onUpdate(entry.id, 'procedure', val)}
            >
              <SelectTrigger className="bg-muted/5 h-9">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {uniqueProcedures.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-24 space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Qtd
            </Label>
            <Input
              type="number"
              min="1"
              value={entry.quantity}
              onChange={(e) => onUpdate(entry.id, 'quantity', e.target.value)}
              disabled={isSigned}
              className="bg-muted/5 h-9 text-center"
            />
          </div>
          {!isSigned && (
            <div className="flex justify-end pt-5 md:pt-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(entry.id)}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2 md:mr-0 h-8 w-8"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 border-t border-border/40 pt-3">
          <div className="w-full md:w-1/3 space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Valor Padrão (R$)
            </Label>
            <Input
              type="number"
              placeholder="0.00"
              value={entry.standardValue}
              onChange={(e) => onUpdate(entry.id, 'standardValue', e.target.value)}
              disabled={isSigned}
              className="bg-muted/5 h-9"
            />
          </div>
          <div className="w-full md:w-1/3 space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Desconto
            </Label>
            <div className="flex gap-1.5">
              <Input
                type="number"
                placeholder="0.00"
                value={entry.discountValue}
                onChange={(e) => onUpdate(entry.id, 'discountValue', e.target.value)}
                disabled={isSigned}
                className="bg-muted/5 h-9 w-full"
              />
              <ToggleGroup
                type="single"
                variant="outline"
                value={entry.discountType || 'currency'}
                onValueChange={(val) => {
                  if (val) onUpdate(entry.id, 'discountType', val)
                }}
                disabled={isSigned}
                className="shrink-0 gap-0 -space-x-px rounded-md h-9"
              >
                <ToggleGroupItem
                  value="currency"
                  className="rounded-r-none focus:z-10 text-[11px] px-2.5 h-9 font-semibold"
                >
                  R$
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="percentage"
                  className="rounded-l-none focus:z-10 text-[11px] px-2.5 h-9 font-semibold"
                >
                  %
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          <div className="w-full md:w-1/3 space-y-1.5">
            <Label className="text-[10px] text-primary uppercase tracking-wider font-semibold">
              Valor Final (R$)
            </Label>
            <Input
              type="number"
              placeholder="0.00"
              value={entry.finalValue}
              readOnly
              className="bg-primary/5 border-primary/30 h-9 focus-visible:ring-primary text-primary font-medium pointer-events-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
