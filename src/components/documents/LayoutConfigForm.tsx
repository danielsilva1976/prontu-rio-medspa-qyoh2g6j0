import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Save, LayoutTemplate } from 'lucide-react'
import useDocumentStore from '@/stores/useDocumentStore'
import { useToast } from '@/hooks/use-toast'

export default function LayoutConfigForm() {
  const { layout, updateLayout } = useDocumentStore()
  const [form, setForm] = useState(layout)
  const { toast } = useToast()

  const handleSave = () => {
    updateLayout(form)
    toast({ title: 'Configurações de layout salvas com sucesso!' })
  }

  return (
    <Card className="border-none shadow-subtle bg-white max-w-4xl">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-serif text-primary flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-primary/80" />
          Configuração de Cabeçalho e Rodapé
        </CardTitle>
        <CardDescription>
          Defina as informações profissionais e de contato que aparecerão impressas em todos os
          documentos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-primary uppercase tracking-wider">
            Identificação Profissional
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-5 rounded-xl border border-border/50">
            <div className="space-y-2">
              <Label>Nome do Profissional (Assinatura e Cabeçalho)</Label>
              <Input
                value={form.proName}
                onChange={(e) => setForm({ ...form, proName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <Input
                value={form.proSpecialty}
                onChange={(e) => setForm({ ...form, proSpecialty: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Registro (Ex: CRM-SP 123456)</Label>
              <Input
                value={form.proRegistry}
                onChange={(e) => setForm({ ...form, proRegistry: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome da Clínica (Interno)</Label>
              <Input
                value={form.clinicName}
                onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-sm text-primary uppercase tracking-wider">
            Contato e Endereço
          </h3>
          <div className="grid grid-cols-1 gap-4 bg-muted/20 p-5 rounded-xl border border-border/50">
            <div className="space-y-2">
              <Label>Endereço - Linha 1</Label>
              <Input
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Endereço - Linha 2 (Cidade/CEP)</Label>
              <Input
                value={form.addressLine2}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone / E-mail</Label>
              <Input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-sm text-primary uppercase tracking-wider">Rodapé</h3>
          <div className="space-y-2">
            <Label>Termo de Isenção / Assinatura Digital</Label>
            <Textarea
              className="resize-none h-24"
              value={form.disclaimer}
              onChange={(e) => setForm({ ...form, disclaimer: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border/50">
          <Button onClick={handleSave} className="shadow-sm">
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
