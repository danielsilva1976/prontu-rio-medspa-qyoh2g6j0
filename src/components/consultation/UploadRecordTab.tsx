import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import useUserStore from '@/stores/useUserStore'
import useAuditStore from '@/stores/useAuditStore'
import { FileUp, Loader2 } from 'lucide-react'

export default function UploadRecordTab({ patientId }: { patientId: string }) {
  const { currentUser } = useUserStore()
  const { addLog } = useAuditStore()
  const { toast } = useToast()

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(() => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!date || !time) {
      toast({
        title: 'Atenção',
        description: 'Por favor, preencha a data e o horário antes de salvar.',
        variant: 'destructive',
      })
      return
    }

    if (!file) {
      toast({
        title: 'Atenção',
        description: 'Por favor, selecione um arquivo para anexar.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('patient', patientId)
      formData.append('professional_name', currentUser.name)
      formData.append('professional_registration', 'Documento Externo')
      formData.append('appointment_date', new Date(`${date}T12:00:00Z`).toISOString())
      formData.append('horario', time)
      formData.append('attachment', file)

      const content = {
        'Documento Externo': 'Arquivo anexado via inclusão manual de prontuário anterior.',
      }
      formData.append('content', JSON.stringify(content))

      await pb.collection('medical_records').create(formData)
      addLog('Prontuário externo incluído', patientId)

      toast({
        title: 'Sucesso',
        description: 'Prontuário incluído com sucesso.',
      })
      setFile(null)
      const fileInput = document.getElementById('upload-file') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o prontuário.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-border shadow-sm animate-fade-in space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <FileUp className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-serif font-medium text-primary">Inclusão de Prontuário</h2>
          <p className="text-sm text-muted-foreground">
            Adicione prontuários ou exames anteriores do paciente.
          </p>
        </div>
      </div>

      <div className="space-y-6 max-w-xl">
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="upload-date">Data</Label>
            <Input
              id="upload-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="upload-time">Horário</Label>
            <Input
              id="upload-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="upload-file">Arquivo (PDF, Imagem)</Label>
          <Input
            id="upload-file"
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto">
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileUp className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}
