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
import { Trash2 } from 'lucide-react'

export type ChronogramEntry = {
  id: string
  timing: string
  procedure: string
  quantity: string
  standardValue: string
  discountValue: string
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
              Valor de Desconto (R$)
            </Label>
            <Input
              type="number"
              placeholder="0.00"
              value={entry.discountValue}
              onChange={(e) => onUpdate(entry.id, 'discountValue', e.target.value)}
              disabled={isSigned}
              className="bg-muted/5 h-9"
            />
          </div>
          <div className="w-full md:w-1/3 space-y-1.5">
            <Label className="text-[10px] text-primary uppercase tracking-wider font-semibold">
              Valor Final (R$)
            </Label>
            <Input
              type="number"
              placeholder="0.00"
              value={entry.finalValue}
              onChange={(e) => onUpdate(entry.id, 'finalValue', e.target.value)}
              disabled={isSigned}
              className="bg-primary/5 border-primary/30 h-9 focus-visible:ring-primary text-primary font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
