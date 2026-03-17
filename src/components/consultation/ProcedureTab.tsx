import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Syringe, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import useSettingsStore from '@/stores/useSettingsStore'

export default function ProcedureTab({ isSigned }: { isSigned: boolean }) {
  const { procedures } = useSettingsStore()
  const [selectedProcs, setSelectedProcs] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  const toggleProcedure = (proc: string) => {
    setSelectedProcs((prev) =>
      prev.includes(proc) ? prev.filter((p) => p !== proc) : [...prev, proc],
    )
  }

  return (
    <Card className="border-none shadow-subtle overflow-hidden animate-slide-up">
      <div className="h-1 w-full bg-gradient-to-r from-primary/20 to-primary"></div>
      <CardHeader>
        <CardTitle className="font-serif text-xl text-primary flex items-center gap-2">
          <Syringe className="w-5 h-5 text-primary" /> Registro Técnico
        </CardTitle>
        <CardDescription>Detalhes do material utilizado e técnica aplicada.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6 bg-muted/10 p-6 rounded-xl border border-border">
          <div className="space-y-2 md:col-span-2">
            <Label className="text-foreground">Tipos de Procedimentos Realizados</Label>
            <Popover open={open && !isSigned} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between bg-white border-border rounded-xl focus:ring-primary shadow-sm h-auto min-h-[2.5rem] py-2 hover:bg-white"
                  disabled={isSigned}
                >
                  <div className="flex flex-wrap gap-1 items-center">
                    {selectedProcs.length > 0 ? (
                      selectedProcs.map((sp) => (
                        <Badge
                          key={sp}
                          variant="secondary"
                          className="bg-primary/10 text-primary hover:bg-primary/20 font-normal shadow-none border-none"
                        >
                          {sp}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground font-normal">
                        Buscar e selecionar procedimentos...
                      </span>
                    )}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar procedimento cadastrado..." />
                  <CommandList>
                    <CommandEmpty>Nenhum procedimento encontrado.</CommandEmpty>
                    <CommandGroup>
                      {procedures.map((proc) => (
                        <CommandItem key={proc} value={proc} onSelect={() => toggleProcedure(proc)}>
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4 text-primary',
                              selectedProcs.includes(proc) ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          {proc}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Áreas Tratadas</Label>
            <Input
              placeholder="Ex: Glabela, Fronte, Periorbicular"
              className="bg-white border-border rounded-xl focus-visible:ring-primary shadow-sm"
              disabled={isSigned}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Produto / Marca</Label>
            <Input
              placeholder="Ex: Botox® (Allergan), Restylane"
              className="bg-white border-border rounded-xl focus-visible:ring-primary shadow-sm"
              disabled={isSigned}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 md:col-span-2">
            <div className="space-y-2">
              <Label className="text-foreground">Lote</Label>
              <Input
                placeholder="Nº do lote"
                className="bg-white border-border rounded-xl focus-visible:ring-primary shadow-sm"
                disabled={isSigned}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Dose / Volume (U ou mL)</Label>
              <Input
                placeholder="Ex: 50U, 1mL"
                className="bg-white border-border rounded-xl focus-visible:ring-primary shadow-sm"
                disabled={isSigned}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Técnica de Aplicação e Observações</Label>
          <Textarea
            placeholder="Descreva os planos de aplicação (supraperiosteal, derme profunda), uso de cânula ou agulha, intercorrências imediatas (sangramento, hematoma)..."
            className="min-h-[120px] bg-muted/20 border-border focus-visible:ring-primary rounded-xl"
            disabled={isSigned}
          />
        </div>
      </CardContent>
    </Card>
  )
}
