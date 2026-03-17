import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { History, Save } from 'lucide-react'
import useAuditStore from '@/stores/useAuditStore'

export default function EvolutionTab({
  isSigned,
  patientId,
}: {
  isSigned: boolean
  patientId: string
}) {
  const { addLog } = useAuditStore()
  const [note, setNote] = useState('')

  const handleSave = () => {
    if (!note.trim()) return
    addLog('Evolução adicionada', patientId)
  }

  return (
    <Card className="border-none shadow-subtle overflow-hidden animate-slide-up">
      <div className="h-1 w-full bg-gradient-to-r from-primary/20 to-primary"></div>
      <CardHeader>
        <CardTitle className="font-serif text-xl text-primary flex items-center gap-2">
          <History className="w-5 h-5 text-primary" /> Evolução
        </CardTitle>
        <CardDescription>Registre a evolução clínica atual do paciente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Textarea
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Registre o retorno do paciente, queixas atuais, evolução do tratamento ou orientações dadas..."
          className="min-h-[300px] resize-y bg-muted/10 border-border/50 shadow-sm focus-visible:ring-primary rounded-xl text-base p-4"
          disabled={isSigned}
        />

        {!isSigned && (
          <div className="flex justify-end pt-4 mt-6 border-t border-border/50">
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              <Save className="w-4 h-4 mr-2" /> Salvar Evolução
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
