import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import useUserStore from '@/stores/useUserStore'
import useAuditStore from '@/stores/useAuditStore'

export default function UploadRecordTab({ patientId }: { patientId: string }) {
  const [dateStr, setDateStr] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [, setSearchParams] = useSearchParams()
  const { toast } = useToast()
  const { currentUser } = useUserStore()
  const { addLog } = useAuditStore()

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 8) val = val.slice(0, 8)
    if (val.length > 4) {
      val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4)
    } else if (val.length > 2) {
      val = val.slice(0, 2) + '/' + val.slice(2)
    }
    setDateStr(val)
  }

  const parseDate = (str: string) => {
    if (str.length !== 10) return null
    const [d, m, y] = str.split('/')
    const day = parseInt(d, 10)
    const month = parseInt(m, 10)
    const year = parseInt(y, 10)

    if (month < 1 || month > 12) return null
    if (day < 1 || day > 31) return null

    const date = new Date(year, month - 1, day)
    if (isNaN(date.getTime())) return null
    return date
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0]
      if (selected.type !== 'image/jpeg' && selected.type !== 'image/jpg') {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, selecione um arquivo JPEG.',
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
    const parsedDate = parseDate(dateStr)
    if (!parsedDate || !file) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha uma data válida e selecione o arquivo JPEG.',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    try {
      const registration =
        currentUser?.role === 'Médico'
          ? 'CRM-SP 123456'
          : currentUser?.role === 'Estético'
            ? 'CRBM 1234'
            : 'N/A'

      await pb.collection('medical_records').create({
        patient: patientId,
        appointment_date: parsedDate.toISOString(),
        attachment: file,
        professional_name: currentUser?.name || 'Profissional',
        professional_registration: registration,
        content: { Observação: 'Prontuário histórico importado via upload de JPEG.' },
      })

      addLog('Prontuário histórico importado (JPEG)', patientId)

      toast({
        title: 'Sucesso',
        description: 'Prontuário histórico importado com sucesso.',
      })
      setSearchParams({ tab: 'historico' }, { replace: true })
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      const errorMsg = error?.response?.message || error?.message || 'Erro desconhecido'
      toast({
        title: 'Erro no upload',
        description: `Não foi possível salvar o prontuário: ${errorMsg}. Tente novamente.`,
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
          Faça o upload de cópias em JPEG de consultas anteriores para manter o histórico
          cronológico completo do paciente.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Data do Atendimento</Label>
          <Input
            placeholder="DD/MM/AAAA"
            value={dateStr}
            onChange={handleDateChange}
            className="w-full"
            maxLength={10}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Arquivo do Prontuário (JPEG)
          </Label>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="w-full relative border-dashed border-2 border-gray-300 hover:border-primary hover:bg-primary/5 transition-all h-32"
              asChild
            >
              <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium text-gray-600">
                  {file ? file.name : 'Clique para selecionar o JPEG (Máx. 5MB)'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg, image/jpg"
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
          <Button onClick={handleSave} disabled={isUploading || dateStr.length !== 10 || !file}>
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
