import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Trash2, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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

export type ProcedureOption = {
  name: string
  standardValue?: string
}

type Props = {
  entry: ChronogramEntry
  isSigned: boolean
  uniqueProcedures: ProcedureOption[]
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
  const [open, setOpen] = useState(false)

  const unitPrice = parseFloat(entry.standardValue) || 0
  const qty = parseInt(entry.quantity, 10) || 1
  const subtotal = unitPrice * qty

  // Auto-calculate final value based on standard value, quantity, and discount
  useEffect(() => {
    if (!entry.standardValue && !entry.discountValue && !entry.finalValue) return

    const discount = parseFloat(entry.discountValue) || 0
    let final = subtotal

    if (entry.discountType === 'percentage') {
      final = subtotal - subtotal * (discount / 100)
    } else {
      final = subtotal - discount
    }

    final = Math.max(0, final)
    const finalStr = entry.standardValue || entry.discountValue ? final.toFixed(2) : ''

    if (entry.finalValue !== finalStr && !isSigned) {
      onUpdate(entry.id, 'finalValue', finalStr)
    }
  }, [
    subtotal,
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
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  disabled={isSigned}
                  className={cn(
                    'w-full justify-between bg-muted/5 h-9 font-normal border-input',
                    !entry.procedure && 'text-muted-foreground',
                  )}
                >
                  {entry.procedure
                    ? uniqueProcedures.find((p) => p.name === entry.procedure)?.name ||
                      entry.procedure
                    : 'Selecione ou busque...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar procedimento..." />
                  <CommandList>
                    <CommandEmpty>Nenhum procedimento encontrado.</CommandEmpty>
                    <CommandGroup>
                      {uniqueProcedures.map((p) => (
                        <CommandItem
                          key={p.name}
                          value={p.name}
                          onSelect={(currentValue) => {
                            const originalValue =
                              uniqueProcedures.find(
                                (item) => item.name.toLowerCase() === currentValue.toLowerCase(),
                              ) || p

                            const newProcedure =
                              originalValue.name === entry.procedure ? '' : originalValue.name

                            onUpdate(entry.id, 'procedure', newProcedure)

                            if (newProcedure && originalValue.standardValue) {
                              onUpdate(entry.id, 'standardValue', originalValue.standardValue)
                            }

                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              entry.procedure === p.name ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          {p.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
          <div className="w-full md:w-1/4 space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              V. Unitário (R$)
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
          <div className="w-full md:w-1/4 space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Subtotal (R$)
            </Label>
            <Input
              type="number"
              placeholder="0.00"
              value={subtotal ? subtotal.toFixed(2) : ''}
              readOnly
              className="bg-muted/5 h-9 text-muted-foreground pointer-events-none opacity-80"
            />
          </div>
          <div className="w-full md:w-1/4 space-y-1.5">
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
                  if (val) onUpdate(entry.id, 'discountType', val as 'currency' | 'percentage')
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
          <div className="w-full md:w-1/4 space-y-1.5">
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
