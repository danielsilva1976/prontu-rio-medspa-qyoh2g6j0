import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  History,
  FileText,
  Stethoscope,
  Syringe,
  Activity,
  ClipboardList,
  FileSignature,
  FileSearch,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SidebarProps = {
  activeTab: string
  isStarted: boolean
  showAnamneseExame: boolean
  showDocs: boolean
  showAudit: boolean
  onTabChange: (tab: string) => void
}

export default function ConsultationSidebar({
  activeTab,
  isStarted,
  showAnamneseExame,
  showDocs,
  showAudit,
  onTabChange,
}: SidebarProps) {
  const NavItem = ({
    tab,
    label,
    disabled,
    icon: Icon,
    isWarning,
  }: {
    tab: string
    label: string
    disabled?: boolean
    icon: any
    isWarning?: boolean
  }) => {
    const isActive = activeTab === tab
    return (
      <button
        onClick={() => !disabled && onTabChange(tab)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors w-full text-left',
          isActive
            ? isWarning
              ? 'bg-amber-100 text-amber-900'
              : 'bg-primary/10 text-primary font-semibold'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          disabled &&
            'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground',
        )}
      >
        <Icon
          className={cn(
            'w-4 h-4 shrink-0',
            isActive ? (isWarning ? 'text-amber-700' : 'text-primary') : 'text-muted-foreground',
          )}
        />
        <span className="truncate">{label}</span>
      </button>
    )
  }

  return (
    <div className="hidden md:flex w-64 flex-col border-r bg-white p-4 gap-4 overflow-y-auto shrink-0 shadow-sm z-0">
      <Button
        variant="outline"
        className={cn(
          'w-full justify-start gap-2 text-muted-foreground hover:text-foreground',
          isStarted && 'opacity-50 cursor-not-allowed hover:text-muted-foreground',
        )}
        disabled={isStarted}
        asChild={!isStarted}
      >
        {isStarted ? (
          <div className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Pacientes
          </div>
        ) : (
          <Link to="/pacientes">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Pacientes
          </Link>
        )}
      </Button>

      <nav className="flex flex-col gap-1 mt-2">
        <NavItem tab="historico" label="Histórico" icon={History} />

        <div className="mt-4 mb-1 px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Novo Atendimento
        </div>
        {showAnamneseExame && (
          <NavItem tab="anamnese" label="Anamnese" disabled={!isStarted} icon={FileText} />
        )}
        {showAnamneseExame && (
          <NavItem tab="exame" label="Exame Físico" disabled={!isStarted} icon={Stethoscope} />
        )}
        <NavItem tab="procedimentos" label="Procedimentos" disabled={!isStarted} icon={Syringe} />
        <NavItem tab="evolucao" label="Evolução" disabled={!isStarted} icon={Activity} />

        <div className="mt-4 mb-1 px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Tratamento
        </div>
        <NavItem tab="planejamento" label="Planejamento" icon={ClipboardList} />

        {showDocs && (
          <>
            <div className="mt-4 mb-1 px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Documentos
            </div>
            <NavItem tab="receitas" label="Receitas" icon={FileSignature} />
            <NavItem tab="laudos" label="Laudos" icon={FileSearch} />
          </>
        )}

        {showAudit && (
          <>
            <div className="mt-4 mb-1 px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Administração
            </div>
            <NavItem tab="auditoria" label="Auditoria" icon={ShieldAlert} isWarning />
          </>
        )}
      </nav>
    </div>
  )
}
