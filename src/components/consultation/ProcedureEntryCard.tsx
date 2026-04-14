import React, { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, ImagePlus, X } from 'lucide-react'
import ApplicationMarker, {
  type PointMark,
  type VectorMark,
  type LineMark,
} from './ApplicationMarker'

export type ProcedureEntry = {
  id: string
  type: string
  area: string
  technology: string
  product: string
  brand: string
  batch: string
  dose: string
  enableMarking: boolean
  markingArea: string
  photo?: string
  points: PointMark[]
  vectors: VectorMark[]
  lines: LineMark[]
}

type Props = {
  entry: ProcedureEntry
  index: number
  isSigned: boolean
  onUpdate: (id: string, field: keyof ProcedureEntry, value: any) => void
  onRemove: (id: string) => void
}

export default function ProcedureEntryCard({ entry, index, isSigned, onUpdate, onRemove }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        onUpdate(entry.id, 'photo', ev.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Card className="border border-border shadow-sm rounded-xl overflow-hidden relative group">
      <CardContent className="p-5 space-y-5">
        <div className="flex justify-between items-center border-b pb-3">
          <h4 className="font-semibold text-primary/80">Procedimento {index + 1}</h4>
          {!isSigned && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(entry.id)}
              className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-full"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-medium">Tipo</Label>
            <Input
              value={entry.type || ''}
              onChange={(e) => onUpdate(entry.id, 'type', e.target.value)}
              disabled={isSigned}
              placeholder="Ex: Preenchimento"
              className="bg-muted/30 focus-visible:bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-medium">Área</Label>
            <Input
              value={entry.area || ''}
              onChange={(e) => onUpdate(entry.id, 'area', e.target.value)}
              disabled={isSigned}
              placeholder="Ex: Mandíbula"
              className="bg-muted/30 focus-visible:bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-medium">Técnica</Label>
            <Input
              value={entry.technology || ''}
              onChange={(e) => onUpdate(entry.id, 'technology', e.target.value)}
              disabled={isSigned}
              placeholder="Ex: Agulha 27G"
              className="bg-muted/30 focus-visible:bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-medium">Produto</Label>
            <Input
              value={entry.product || ''}
              onChange={(e) => onUpdate(entry.id, 'product', e.target.value)}
              disabled={isSigned}
              placeholder="Ex: Ácido Hialurônico"
              className="bg-muted/30 focus-visible:bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-medium">Marca</Label>
            <Input
              value={entry.brand || ''}
              onChange={(e) => onUpdate(entry.id, 'brand', e.target.value)}
              disabled={isSigned}
              placeholder="Ex: Restylane"
              className="bg-muted/30 focus-visible:bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-medium">Lote</Label>
            <Input
              value={entry.batch || ''}
              onChange={(e) => onUpdate(entry.id, 'batch', e.target.value)}
              disabled={isSigned}
              placeholder="Nº do Lote"
              className="bg-muted/30 focus-visible:bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-medium">Dose/Volume</Label>
            <Input
              value={entry.dose || ''}
              onChange={(e) => onUpdate(entry.id, 'dose', e.target.value)}
              disabled={isSigned}
              placeholder="Ex: 1ml"
              className="bg-muted/30 focus-visible:bg-background"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border/40">
          <div className="flex items-center space-x-3">
            <Switch
              checked={entry.enableMarking || false}
              onCheckedChange={(v) => onUpdate(entry.id, 'enableMarking', v)}
              disabled={isSigned}
              id={`marking-${entry.id}`}
            />
            <Label htmlFor={`marking-${entry.id}`} className="font-medium cursor-pointer">
              Habilitar Marcação de Aplicação
            </Label>
          </div>
        </div>

        {entry.enableMarking && (
          <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-xl border border-border/50">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Diagrama Base</Label>
                <Select
                  value={entry.markingArea || ''}
                  onValueChange={(v) => onUpdate(entry.id, 'markingArea', v)}
                  disabled={isSigned}
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Selecione um diagrama anatômico..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Face">Face</SelectItem>
                    <SelectItem value="Pescoço">Pescoço</SelectItem>
                    <SelectItem value="Braço">Braço</SelectItem>
                    <SelectItem value="Abdome">Abdome</SelectItem>
                    <SelectItem value="Coxas">Coxas</SelectItem>
                    <SelectItem value="Pernas">Pernas</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Selecione um diagrama pré-definido para usar como base das marcações.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Ou Foto do Paciente</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    disabled={isSigned}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-background hover:bg-muted/50 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSigned}
                  >
                    <ImagePlus className="w-4 h-4 mr-2 text-primary" />
                    {entry.photo ? 'Trocar Foto' : 'Fazer Upload de Foto'}
                  </Button>
                  {entry.photo && !isSigned && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onUpdate(entry.id, 'photo', '')}
                      className="text-destructive hover:bg-destructive/10 shrink-0"
                      title="Remover Foto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Faça upload de uma foto real para marcações personalizadas. A foto substitui o
                  diagrama.
                </p>
              </div>
            </div>

            {(entry.markingArea || entry.photo) && (
              <div className="bg-muted/10 p-2 md:p-6 rounded-xl border border-border/30">
                <ApplicationMarker
                  area={entry.markingArea || 'Face'}
                  photo={entry.photo}
                  points={entry.points || []}
                  vectors={entry.vectors || []}
                  lines={entry.lines || []}
                  isSigned={isSigned}
                  onChange={(p, v, l) => {
                    onUpdate(entry.id, 'points', p)
                    onUpdate(entry.id, 'vectors', v)
                    onUpdate(entry.id, 'lines', l)
                  }}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
