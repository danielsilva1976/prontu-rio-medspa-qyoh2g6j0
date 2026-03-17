import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import useSettingsStore from '@/stores/useSettingsStore'

export type ProcedureEntry = {
  id: string
  type: string
  area: string
  technology: string
  product: string
  brand: string
  batch: string
  dose: string
}

type Props = {
  entry: ProcedureEntry
  index: number
  isSigned: boolean
  onUpdate: (id: string, field: keyof ProcedureEntry, value: string) => void
  onRemove: (id: string) => void
}

export default function ProcedureEntryCard({ entry, index, isSigned, onUpdate, onRemove }: Props) {
  const { procedures, areas, products, brands, technologies } = useSettingsStore()

  return (
    <Card className="relative border border-border bg-muted/5 shadow-sm animate-fade-in">
      <CardContent className="p-6 pt-8">
        <div className="absolute top-0 left-0 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-br-lg rounded-tl-lg">
          Procedimento {index + 1}
        </div>
        {!isSigned && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 transition-colors"
            onClick={() => onRemove(entry.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label className="text-foreground">Tipo de Procedimento</Label>
            <Select
              disabled={isSigned}
              value={entry.type}
              onValueChange={(val) => onUpdate(entry.id, 'type', val)}
            >
              <SelectTrigger className="bg-white border-border rounded-xl focus:ring-primary shadow-sm">
                <SelectValue placeholder="Selecione o procedimento..." />
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
            <Label className="text-foreground">Área Aplicada</Label>
            <Select
              disabled={isSigned}
              value={entry.area}
              onValueChange={(val) => onUpdate(entry.id, 'area', val)}
            >
              <SelectTrigger className="bg-white border-border rounded-xl focus:ring-primary shadow-sm">
                <SelectValue placeholder="Selecione a área..." />
              </SelectTrigger>
              <SelectContent>
                {areas.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Tecnologia</Label>
            <Select
              disabled={isSigned}
              value={entry.technology}
              onValueChange={(val) => onUpdate(entry.id, 'technology', val)}
            >
              <SelectTrigger className="bg-white border-border rounded-xl focus:ring-primary shadow-sm">
                <SelectValue placeholder="Selecione a tecnologia..." />
              </SelectTrigger>
              <SelectContent>
                {technologies.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Produto</Label>
            <Select
              disabled={isSigned}
              value={entry.product}
              onValueChange={(val) => onUpdate(entry.id, 'product', val)}
            >
              <SelectTrigger className="bg-white border-border rounded-xl focus:ring-primary shadow-sm">
                <SelectValue placeholder="Selecione o produto..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Marca</Label>
            <Select
              disabled={isSigned}
              value={entry.brand}
              onValueChange={(val) => onUpdate(entry.id, 'brand', val)}
            >
              <SelectTrigger className="bg-white border-border rounded-xl focus:ring-primary shadow-sm">
                <SelectValue placeholder="Selecione a marca..." />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Lote</Label>
            <Input
              placeholder="Ex: AB12345"
              className="bg-white border-border rounded-xl focus-visible:ring-primary shadow-sm"
              value={entry.batch}
              onChange={(e) => onUpdate(entry.id, 'batch', e.target.value)}
              disabled={isSigned}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Dose / Volume / Parâmetros</Label>
            <Input
              placeholder="Ex: 50U, 1mL, 20J/cm²"
              className="bg-white border-border rounded-xl focus-visible:ring-primary shadow-sm"
              value={entry.dose}
              onChange={(e) => onUpdate(entry.id, 'dose', e.target.value)}
              disabled={isSigned}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
