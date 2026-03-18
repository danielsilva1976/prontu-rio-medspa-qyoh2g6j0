import logoMarca from '@/assets/marca-principal_page-0001-2e968.jpg'
import { FileSignature } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LayoutConfig } from '@/stores/useDocumentStore'

interface DocumentA4Props {
  type: string
  patientName: string
  date: string
  content: string
  config: LayoutConfig
  className?: string
  isSigned?: boolean
}

export function DocumentA4({
  type,
  patientName,
  date,
  content,
  config,
  className,
  isSigned = true,
}: DocumentA4Props) {
  return (
    <div
      className={cn(
        'bg-white flex flex-col relative w-[21cm] min-h-[29.7cm] shadow-[0_8px_30px_rgb(0,0,0,0.08)] mx-auto print:shadow-none print:m-0 print:max-w-full',
        className,
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-12 pt-12 pb-8 shrink-0 relative">
        <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-primary to-primary/80"></div>
        <div className="flex flex-col items-start gap-1">
          <img
            src={logoMarca}
            alt={config.clinicName}
            className="h-20 w-auto object-contain mix-blend-multiply drop-shadow-sm"
          />
        </div>
        <div className="text-right text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-primary text-sm tracking-wide">{config.proName}</p>
          <p className="font-medium text-foreground/70">
            {config.proSpecialty} • {config.proRegistry}
          </p>
          <p className="pt-2">{config.addressLine1}</p>
          <p>{config.addressLine2}</p>
          <p>{config.contact}</p>
        </div>
      </div>
      <div className="mx-12 h-[2px] bg-primary/20 shrink-0"></div>

      {/* Body */}
      <div className="flex-1 px-16 pt-10 pb-16 flex flex-col">
        <h3 className="text-center font-serif text-2xl tracking-[0.2em] text-primary uppercase mb-12">
          {type}
        </h3>
        <div className="mb-10 p-4 bg-muted/5 border border-border/50 rounded-lg text-sm text-gray-700">
          <p className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-primary uppercase tracking-wider text-xs w-20">
              Paciente:
            </span>
            <span className="font-medium text-foreground">{patientName}</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="font-semibold text-primary uppercase tracking-wider text-xs w-20">
              Data:
            </span>
            <span className="text-foreground">{date}</span>
          </p>
        </div>
        <div className="flex-1 text-[16px] text-gray-800 whitespace-pre-wrap leading-loose font-serif px-2">
          {content || 'Nenhum conteúdo adicionado.'}
        </div>

        {/* Signature */}
        <div className="mt-24 pt-8 flex flex-col items-center justify-end shrink-0 mb-8">
          <div className="w-80 border-t-[1.5px] border-primary/40 mb-4 relative flex justify-center">
            {isSigned && (
              <div className="absolute -top-14 flex flex-col items-center opacity-70">
                <FileSignature className="w-12 h-12 text-primary" />
              </div>
            )}
          </div>
          <p className="font-serif font-bold text-gray-900 tracking-wide text-xl text-primary">
            {config.proName}
          </p>
          <p className="text-[15px] text-gray-500 font-medium mt-1">
            {config.proSpecialty} • {config.proRegistry}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-primary/5 border-t border-primary/20 text-primary/70 text-[11px] py-4 px-12 text-center shrink-0 uppercase tracking-[0.15em] leading-relaxed">
        {config.disclaimer}
      </div>
    </div>
  )
}
