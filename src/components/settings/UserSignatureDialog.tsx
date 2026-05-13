import { useState, useRef } from 'react'
import { FileSignature, UploadCloud, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import useUserStore, { User } from '@/stores/useUserStore'

export function UserSignatureDialog({ user }: { user: User }) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(user.signature || null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { updateUser } = useUserStore()
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione uma imagem JPG ou PNG.',
        variant: 'destructive',
      })
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive',
      })
      return
    }

    setFile(selectedFile)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(selectedFile)
  }

  const handleSave = async () => {
    if (!file && !preview) return

    try {
      setLoading(true)
      await updateUser(user.id, { signature: file })
      toast({
        title: 'Assinatura salva',
        description: 'A assinatura digital foi atualizada com sucesso.',
      })
      setOpen(false)
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao enviar a assinatura.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val)
        if (!val) {
          setPreview(user.signature || null)
          setFile(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
          title="Gerenciar Assinatura"
        >
          <FileSignature className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-primary">Assinatura Digital</DialogTitle>
          <DialogDescription>
            Faça upload da assinatura de {user.name} (JPG ou PNG, máx 5MB).
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          {preview ? (
            <div className="relative w-full max-w-[300px] border rounded-lg p-2 bg-muted/10 flex justify-center items-center">
              <img
                src={preview}
                alt="Preview da assinatura"
                className="max-h-[150px] object-contain"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={() => {
                  setPreview(null)
                  setFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-[300px] h-[150px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors text-muted-foreground hover:text-primary"
            >
              <UploadCloud className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Clique para fazer upload</span>
              <span className="text-xs text-muted-foreground mt-1">JPG ou PNG</span>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg, image/png"
            onChange={handleFileChange}
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || (!file && !preview)}>
            Salvar Assinatura
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
