import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import useSettingsStore, { SettingsCategory } from '@/stores/useSettingsStore'

type SettingsListProps = {
  category: SettingsCategory
  title: string
  description: string
}

export default function SettingsList({ category, title, description }: SettingsListProps) {
  const store = useSettingsStore()
  const items = store[category]
  const [newItem, setNewItem] = useState('')
  const [editingItem, setEditingItem] = useState<{ old: string; current: string } | null>(null)
  const { toast } = useToast()

  const handleAdd = () => {
    const trimmed = newItem.trim()
    if (!trimmed) return

    if (items.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      toast({
        title: 'Item duplicado',
        description: 'Este item já existe na sua lista.',
        variant: 'destructive',
      })
      return
    }

    store.addItem(category, trimmed)
    setNewItem('')
    toast({ title: 'Adicionado com sucesso', description: `"${trimmed}" foi adicionado à lista.` })
  }

  const handleSaveEdit = () => {
    if (!editingItem || !editingItem.current.trim()) return
    store.updateItem(category, editingItem.old, editingItem.current)
    setEditingItem(null)
    toast({ title: 'Atualizado com sucesso' })
  }

  const handleRemove = (item: string) => {
    store.removeItem(category, item)
    toast({ title: 'Removido com sucesso', description: `"${item}" foi removido.` })
  }

  return (
    <Card className="border-none shadow-subtle animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-xl text-primary font-serif">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-3">
          <Input
            placeholder="Nome do novo item..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="bg-white border-border rounded-xl focus-visible:ring-primary shadow-sm"
          />
          <Button
            onClick={handleAdd}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-xl shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>

        <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-full">Nome</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item} className="group transition-colors hover:bg-muted/10 h-14">
                  <TableCell className="font-medium text-foreground">
                    {editingItem?.old === item ? (
                      <Input
                        value={editingItem.current}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, current: e.target.value })
                        }
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                        className="h-8 max-w-sm"
                        autoFocus
                      />
                    ) : (
                      item
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingItem?.old === item ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleSaveEdit}
                          className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingItem(null)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingItem({ old: item, current: item })}
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(item)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                    Nenhum registro encontrado. Adicione um acima.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
