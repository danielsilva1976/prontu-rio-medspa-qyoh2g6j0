import React, { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Trash2 } from 'lucide-react'

interface ImageUploadProps {
  value?: string
  onChange: (value: string) => void
  nameInitials?: string
}

export function ImageUpload({ value, onChange, nameInitials = '?' }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onChange(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 border border-border shadow-sm shrink-0">
        <AvatarImage src={value} className="object-cover" />
        <AvatarFallback className="bg-primary/5 text-primary text-xl font-medium">
          {nameInitials.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="shadow-sm"
          >
            <Camera className="w-4 h-4 mr-2" />
            Alterar Foto
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 w-9 shrink-0"
              onClick={() => onChange('')}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          JPG, JPEG ou PNG. Tamanho ideal: 256x256px.
        </p>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg, image/png, image/jpg"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
