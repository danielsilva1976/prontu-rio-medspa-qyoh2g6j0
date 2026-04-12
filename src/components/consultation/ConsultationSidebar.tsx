import type React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  Activity,
  Stethoscope,
  Syringe,
  FileSignature,
  FileHeart,
  ShieldAlert,
  ClipboardList,
  FileText,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'

interface SidebarProps {
  activeTab: string
  isStarted: boolean
  showAnamneseExame: boolean
  showDocs: boolean
  showAudit: boolean
}

export default function ConsultationSidebar({
  activeTab,
  isStarted,
  showAnamneseExame,
  showDocs,
  showAudit,
}: SidebarProps) {
  const [, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [showLeaveAlert, setShowLeaveAlert] = useState(false)

  const setTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true })
  }

  const handleBack = () => {
    if (isStarted) {
      setShowLeaveAlert(true)
    } else {
      navigate('/pacientes')
    }
  }

  const confirmLeave = () => {
    setShowLeaveAlert(false)
    navigate('/pacientes')
  }

  return (
    <div className="w-64 bg-white border-r border-border flex flex-col h-full shrink-0 z-10 shadow-sm">
      <div className="p-4 border-b border-border">
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground hover:text-foreground shadow-sm"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Pacientes
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div>
          <div className="space-y-1">
            <SidebarButton
              active={activeTab === 'historico'}
              onClick={() => setTab('historico')}
              icon={Clock}
              label="Histórico"
            />
            <SidebarButton
              active={activeTab === 'planejamento'}
              onClick={() => setTab('planejamento')}
              icon={ClipboardList}
              label="Planejamento"
            />
          </div>
        </div>

        <div>
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Novo Atendimento
          </h3>
          <div className="space-y-1">
            {showAnamneseExame && (
              <SidebarButton
                active={activeTab === 'anamnese'}
                onClick={() => setTab('anamnese')}
                icon={FileText}
                label="Anamnese"
                disabled={!isStarted}
              />
            )}
            {showAnamneseExame && (
              <SidebarButton
                active={activeTab === 'exame'}
                onClick={() => setTab('exame')}
                icon={Activity}
                label="Exame Físico"
                disabled={!isStarted}
              />
            )}
            <SidebarButton
              active={activeTab === 'procedimentos'}
              onClick={() => setTab('procedimentos')}
              icon={Syringe}
              label="Procedimentos"
              disabled={!isStarted}
            />
            <SidebarButton
              active={activeTab === 'evolucao'}
              onClick={() => setTab('evolucao')}
              icon={Stethoscope}
              label="Evolução"
              disabled={!isStarted}
            />
          </div>
        </div>

        {showDocs && (
          <div>
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Documentos
            </h3>
            <div className="space-y-1">
              <SidebarButton
                active={activeTab === 'receitas'}
                onClick={() => setTab('receitas')}
                icon={FileSignature}
                label="Receitas"
              />
              <SidebarButton
                active={activeTab === 'laudos'}
                onClick={() => setTab('laudos')}
                icon={FileHeart}
                label="Laudos"
              />
            </div>
          </div>
        )}

        {showAudit && (
          <div>
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Administração
            </h3>
            <div className="space-y-1">
              <SidebarButton
                active={activeTab === 'auditoria'}
                onClick={() => setTab('auditoria')}
                icon={ShieldAlert}
                label="Auditoria"
              />
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showLeaveAlert} onOpenChange={setShowLeaveAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Consulta em andamento</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem uma consulta ativa para este paciente. Se você sair agora, a consulta
              continuará aberta em segundo plano. Tem certeza que deseja voltar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave}>Sim, voltar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SidebarButton({
  active,
  onClick,
  icon: Icon,
  label,
  disabled,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        disabled &&
          'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground',
      )}
    >
      <div className="flex items-center">
        <Icon className={cn('w-4 h-4 mr-3', active ? 'text-primary' : 'text-muted-foreground')} />
        {label}
      </div>
      {disabled && <Lock className="w-3 h-3 text-muted-foreground/50" />}
    </button>
  )
}
