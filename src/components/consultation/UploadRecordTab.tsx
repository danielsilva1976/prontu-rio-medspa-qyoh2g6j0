import { useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import useAuditStore from '@/stores/useAuditStore'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Upload, Save, Image as ImageIcon } from 'lucide-react'

export default function UploadRecordTab({ patientId }: { patientId: string }) {
  const [, setSearchParams] = useSearchParams()
  const { toast } = useToast()
  const { addLog } = useAuditStore()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!date || !time) {
      toast({
        title: 'Atenção',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('patient', patientId)
      formData.append('appointment_date', new Date(`${date}T12:00:00Z`).toISOString())
      formData.append('horario', time)
      formData.append('content', JSON.stringify({}))

      if (file) {
        formData.append('attachment', file)
      }

      await pb.collection('medical_records').create(formData)

      addLog('Prontuário externo incluído', patientId)

      toast({
        title: 'Sucesso',
        description: 'Prontuário incluído com sucesso.',
      })

      // Reset form fields
      setDate('')
      setTime('')
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Redirection destination: automatically switch to History (Histórico) tab
      setSearchParams(
        (prev) => {
          prev.set('tab', 'historico')
          return prev
        },
        { replace: true },
      )
    } catch (error) {
      console.error('Erro ao incluir prontuário:', error)
      const fieldErrors = extractFieldErrors(error)
      setErrors(fieldErrors)
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o prontuário. Verifique os campos.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-none shadow-subtle overflow-hidden animate-slide-up">
      <div className="h-1 w-full bg-gradient-to-r from-primary/20 to-primary"></div>
      <CardHeader>
        <CardTitle className="font-serif text-xl text-primary flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" /> Inclusão de Prontuário
        </CardTitle>
        <CardDescription>
          Faça o upload de prontuários anteriores ou documentos externos do paciente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date">
                Data do Atendimento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={errors.appointment_date ? 'border-destructive' : ''}
              />
              {errors.appointment_date && (
                <p className="text-xs text-destructive">{errors.appointment_date}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">
                Horário <span className="text-destructive">*</span>
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className={errors.horario ? 'border-destructive' : ''}
              />
              {errors.horario && <p className="text-xs text-destructive">{errors.horario}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">anexar foto do prontuário (jpg ou jpeg)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="flex-1 cursor-pointer"
                accept=".jpg,.jpeg"
              />
              {file && <ImageIcon className="w-6 h-6 text-muted-foreground shrink-0" />}
            </div>
            {errors.attachment && <p className="text-xs text-destructive">{errors.attachment}</p>}
          </div>

          <div className="flex justify-end pt-4 mt-6 border-t border-border/50">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
