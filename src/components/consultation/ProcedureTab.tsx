import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Syringe, Plus, Trash2 } from 'lucide-react'
import useSettingsStore from '@/stores/useSettingsStore'

type ProcedureEntry = {
  id: string
  type: string
  area: string
  product: string
  batch: string
  dose: string
}

export default function ProcedureTab({ isSigned }: { isSigned: boolean }) {
  const { procedures } = useSettingsStore()
  const [entries, setEntries] = useState<ProcedureEntry[]>(() => [
    {
      id: Math.random().toString(36).slice(2),
      type: '',
      area: '',
      product: '',
      batch: '',
      dose: '',
    },
  ])
  const [generalNotes, setGeneralNotes] = useState('')

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        type: '',
        area: '',
        product: '',
        batch: '',
        dose: '',
      },
    ])
  }

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const updateEntry = (id: string, field: keyof ProcedureEntry, value: string) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
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
              <Card key={entry.id} className="relative border border-border bg-muted/5 shadow-sm">
                <CardContent className="p-6 pt-8">
                  <div className="absolute top-0 left-0 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-br-lg rounded-tl-lg">
                    Procedimento {index + 1}
                  </div>
                  {!isSigned && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 transition-colors"
                      onClick={() => removeEntry(entry.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-foreground">Tipo de Procedimento</Label>
                      <Select
                        disabled={isSigned}
                        value={entry.type}
                        onValueChange={(val) => updateEntry(entry.id, 'type', val)}
                      >
                        <SelectTrigger className="bg-white border-border rounded-xl focus:ring-primary shadow-sm">
                          <SelectValue placeholder="Selecione um procedimento..." />
                        </SelectTrigger>
                        <SelectContent>
                          {procedures.map((proc) => (
                            <SelectItem key={proc} value={proc}>
                              {proc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Área Tratada</Label>
                      <Input
                        placeholder="Ex: Glabela, Fronte, Malares"
                        className="bg-white border-border rounded-xl focus-visible:ring-primary shadow-sm"
                        value={entry.area}
                        onChange={(e) => updateEntry(entry.id, 'area', e.target.value)}
                        disabled={isSigned}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Produto / Marca</Label>
                      <Input
                        placeholder="Ex: Botox® (Allergan), Restylane"
                        className="bg-white border-border rounded-xl focus-visible:ring-primary shadow-sm"
                        value={entry.product}
                        onChange={(e) => updateEntry(entry.id, 'product', e.target.value)}
                        disabled={isSigned}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Lote</Label>
                      <Input
                        placeholder="Nº do lote"
                        className="bg-white border-border rounded-xl focus-visible:ring-primary shadow-sm"
                        value={entry.batch}
                        onChange={(e) => updateEntry(entry.id, 'batch', e.target.value)}
                        disabled={isSigned}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Dose / Volume</Label>
                      <Input
                        placeholder="Ex: 50U, 1mL"
                        className="bg-white border-border rounded-xl focus-visible:ring-primary shadow-sm"
                        value={entry.dose}
                        onChange={(e) => updateEntry(entry.id, 'dose', e.target.value)}
                        disabled={isSigned}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
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
      </CardContent>
    </Card>
  )
}
