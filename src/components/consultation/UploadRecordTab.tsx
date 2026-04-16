import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, Upload, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import useUserStore from '@/stores/useUserStore'
import useAuditStore from '@/stores/useAuditStore'

export default function UploadRecordTab({ patientId }: { patientId: string }) {
  const [date, setDate] = useState<Date>()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [, setSearchParams] = useSearchParams()
  const { toast } = useToast()
  const { currentUser } = useUserStore()
  const { addLog } = useAuditStore()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0]
      if (selected.type !== 'application/pdf') {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, selecione um arquivo PDF.',
          variant: 'destructive',
        })
        return
      }
      if (selected.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O tamanho máximo permitido é 5MB.',
          variant: 'destructive',
        })
        return
      }
      setFile(selected)
    }
  }

  const handleSave = async () => {
    if (!date || !file) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha a data e selecione o arquivo PDF.',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('patient', patientId)
      formData.append('appointment_date', date.toISOString())
      formData.append('attachment', file)
      formData.append('professional_name', currentUser.name)
      formData.append('professional_registration', 'Histórico Importado')
      formData.append(
        'content',
        JSON.stringify({ Observação: 'Prontuário importado via upload de PDF.' }),
      )

      await pb.collection('medical_records').create(formData)
      addLog('Prontuário histórico importado (PDF)', patientId)

      toast({
        title: 'Sucesso',
        description: 'Prontuário histórico importado com sucesso.',
      })
      setSearchParams({ tab: 'historico' }, { replace: true })
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível salvar o prontuário. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white p-8 rounded-xl border border-border shadow-sm animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-primary flex items-center gap-2">
          <Upload className="h-6 w-6" />
          Inclusão de Prontuário
        </h2>
        <p className="text-muted-foreground mt-2">
          Faça o upload de cópias em PDF de consultas anteriores para manter o histórico cronológico
          completo do paciente.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Data do Atendimento</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full justify-start text-left font-normal border-gray-300',
                  !date && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? (
                  format(date, 'PPP', { locale: ptBR })
                ) : (
                  <span>Selecione a data original da consulta</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Arquivo do Prontuário (PDF)</Label>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="w-full relative border-dashed border-2 border-gray-300 hover:border-primary hover:bg-primary/5 transition-all h-32"
              asChild
            >
              <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium text-gray-600">
                  {file ? file.name : 'Clique para selecionar o PDF (Máx. 5MB)'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={handleFileChange}
                />
              </label>
            </Button>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
          <Button
            variant="ghost"
            onClick={() => setSearchParams({ tab: 'historico' }, { replace: true })}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isUploading || !date || !file}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Atendimento'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
