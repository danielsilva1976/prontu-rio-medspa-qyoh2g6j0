import { useState } from 'react'
import { Plus, Edit2, Trash2, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useDocumentStore, { DocTemplate } from '@/stores/useDocumentStore'

export default function TemplatesManager() {
  const { templates, addTemplate, updateTemplate, removeTemplate } = useDocumentStore()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<DocTemplate>>({
    type: 'receita',
    title: '',
    content: '',
  })

  const openNew = () => {
    setEditingId(null)
    setForm({ type: 'receita', title: '', content: '' })
    setIsOpen(true)
  }

  const openEdit = (t: DocTemplate) => {
    setEditingId(t.id)
    setForm(t)
    setIsOpen(true)
  }

  const handleSave = () => {
    if (editingId) {
      updateTemplate(editingId, form)
    } else {
      addTemplate(form as Omit<DocTemplate, 'id'>)
    }
    setIsOpen(false)
  }

  return (
    <Card className="border-none shadow-subtle bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <div>
          <CardTitle className="text-xl font-serif text-primary">Modelos de Documentos</CardTitle>
          <CardDescription>
            Gerencie os textos padrão para prescrições e laudos recorrentes.
          </CardDescription>
        </div>
        <Button onClick={openNew} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Novo Modelo
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Título do Modelo</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Nenhum modelo cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium capitalize">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        t.type === 'receita'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {t.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-foreground">{t.title}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(t)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTemplate(t.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-serif text-primary flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {editingId ? 'Editar Modelo' : 'Novo Modelo'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receituário</SelectItem>
                      <SelectItem value="laudo">Laudo Médico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Título Interno</Label>
                  <Input
                    placeholder="Ex: Pós Ultraformer"
                    value={form.title || ''}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Conteúdo do Modelo</Label>
                <Textarea
                  className="min-h-[250px] font-serif text-[15px] leading-loose p-4 resize-y"
                  placeholder="Digite o texto padrão..."
                  value={form.content || ''}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!form.title || !form.content}>
                Salvar Modelo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
