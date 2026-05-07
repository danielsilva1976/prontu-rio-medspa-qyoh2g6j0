import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Syringe,
  MapPin,
  Package,
  Tag,
  Cpu,
  Users,
  Link as LinkIcon,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsCategory } from '@/stores/useSettingsStore'
import useUserStore from '@/stores/useUserStore'
import SettingsList from '@/components/settings/SettingsList'
import { UserManagement } from '@/components/settings/UserManagement'
import { IntegrationSettings } from '@/components/settings/IntegrationSettings'
import { SystemAuditLog } from '@/components/settings/SystemAuditLog'
import { cn } from '@/lib/utils'

type TabItem = {
  id: string
  label: string
  icon: any
  desc: string
  adminOnly?: boolean
}

const allTabs: TabItem[] = [
  {
    id: 'users',
    label: 'Equipe',
    icon: Users,
    desc: 'Gerencie os membros da equipe, níveis de acesso e permissões do sistema.',
    adminOnly: true,
  },
  {
    id: 'integrations',
    label: 'Integrações',
    icon: LinkIcon,
    desc: 'Configure a integração e sincronização com o Belle Software.',
    adminOnly: true,
  },
  {
    id: 'procedures',
    label: 'Procedimentos',
    icon: Syringe,
    desc: 'Gerencie os tipos de procedimentos realizados na clínica para usar nos prontuários.',
  },
  {
    id: 'areas',
    label: 'Áreas Tratadas',
    icon: MapPin,
    desc: 'Gerencie as regiões faciais e corporais que podem ser selecionadas durante o atendimento.',
  },
  {
    id: 'technologies',
    label: 'Tecnologias',
    icon: Cpu,
    desc: 'Cadastre os equipamentos e tecnologias disponíveis na clínica.',
  },
  {
    id: 'products',
    label: 'Produtos',
    icon: Package,
    desc: 'Mantenha atualizado o catálogo de produtos e ativos utilizados nos procedimentos.',
  },
  {
    id: 'brands',
    label: 'Marcas',
    icon: Tag,
    desc: 'Lista de fabricantes e marcas parceiras homologadas pela clínica.',
  },
  {
    id: 'audit',
    label: 'Auditoria',
    icon: ShieldCheck,
    desc: 'Registro completo de atividades do sistema e sincronizações.',
    adminOnly: true,
  },
]

export default function Settings() {
  const { currentUser } = useUserStore()

  const isSuperAdmin = currentUser.email === 'daniel.nefro@gmail.com'
  const isAdmin = currentUser.role === 'Médico' || isSuperAdmin
  const isSecretary = currentUser.role === 'Secretária'

  const visibleTabs = allTabs.filter((t) => isAdmin || !t.adminOnly)

  const [activeTab, setActiveTab] = useState<string>(
    visibleTabs.find((t) => t.id === 'procedures')?.id || visibleTabs[0]?.id || 'procedures',
  )

  if (!isAdmin && !isSecretary) {
    return <Navigate to="/" replace />
  }

  const activeData = visibleTabs.find((t) => t.id === activeTab) || visibleTabs[0]

  return (
    <div className="space-y-6 animate-slide-up p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-serif text-primary tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as listas dinâmicas, acessos e integrações da clínica.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[240px_1fr] max-w-6xl items-start">
        <nav className="flex flex-col gap-2 sticky top-24">
          {visibleTabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'justify-start font-medium transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary border-l-2 border-primary rounded-l-none'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground border-l-2 border-transparent rounded-l-none',
              )}
            >
              <tab.icon
                className={cn('w-4 h-4 mr-3', activeTab === tab.id ? 'text-primary' : 'opacity-70')}
              />
              {tab.label}
            </Button>
          ))}
        </nav>

        <div className="min-w-0">
          {activeTab === 'users' && isAdmin ? (
            <UserManagement title={activeData.label} description={activeData.desc} />
          ) : activeTab === 'integrations' && isAdmin ? (
            <IntegrationSettings title={activeData.label} description={activeData.desc} />
          ) : activeTab === 'audit' && isAdmin ? (
            <SystemAuditLog title={activeData.label} description={activeData.desc} />
          ) : (
            <SettingsList
              key={activeTab}
              category={activeTab as SettingsCategory}
              title={activeData.label}
              description={activeData.desc}
            />
          )}
        </div>
      </div>
    </div>
  )
}
