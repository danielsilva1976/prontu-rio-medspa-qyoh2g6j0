import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Syringe, MapPin, Package, Tag, Cpu, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsCategory } from '@/stores/useSettingsStore'
import useUserStore from '@/stores/useUserStore'
import SettingsList from '@/components/settings/SettingsList'
import { UserManagement } from '@/components/settings/UserManagement'
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
]

export default function Settings() {
  const { currentUser } = useUserStore()
  const [activeTab, setActiveTab] = useState<string>(allTabs[0]?.id || 'procedures')

  // Strict RBAC: Only Médico has access to settings
  if (currentUser.role !== 'Médico') {
    return <Navigate to="/" replace />
  }

  const activeData = allTabs.find((t) => t.id === activeTab)!

  return (
    <div className="space-y-6 animate-slide-up p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-serif text-primary tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as listas dinâmicas, acessos e os parâmetros padrões da clínica.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[240px_1fr] max-w-6xl items-start">
        <nav className="flex flex-col gap-2 sticky top-24">
          {allTabs.map((tab) => (
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
          {activeTab === 'users' ? (
            <UserManagement title={activeData.label} description={activeData.desc} />
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
