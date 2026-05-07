import {
  Link,
  Outlet,
  useLocation,
  Navigate,
  matchPath,
  useSearchParams,
  useNavigate,
} from 'react-router-dom'
import {
  Users,
  Settings,
  FileText,
  Bell,
  Menu,
  ArrowLeft,
  History,
  Activity,
  ClipboardList,
  Syringe,
  Clock,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import logoMarca from '@/assets/marca-principal_page-0001-2e968.jpg'
import useUserStore from '@/stores/useUserStore'
import useConsultationStore from '@/stores/useConsultationStore'

export default function Layout() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { currentUser, isAuthenticated, logout } = useUserStore()
  const { activeConsultations } = useConsultationStore()

  const navigate = useNavigate()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const matchClinical = matchPath({ path: '/prontuario/:id' }, location.pathname)
  const isClinical = !!matchClinical
  const patientId = matchClinical?.params?.id || ''
  const activeTab = searchParams.get('tab') || 'historico'

  const isStarted = activeConsultations[patientId] || false

  const isSuperAdmin = currentUser.email === 'daniel.nefro@gmail.com'
  const isAdmin = currentUser.role === 'Médico' || isSuperAdmin
  const isSecretary = currentUser.role === 'Secretária'

  const showAnamneseExame = isAdmin || currentUser.role === 'Estético'
  const showDocs = isAdmin || currentUser.role === 'Secretária'
  const showAudit = isAdmin
  const showNovoAtendimento = isAdmin || currentUser.role === 'Estético'

  const navItems = [
    { name: 'Pacientes', href: '/pacientes', icon: Users, show: true },
    {
      name: 'Documentos',
      href: '/documentos',
      icon: FileText,
      show: isAdmin || currentUser.role === 'Médico',
    },
    {
      name: 'Configurações',
      href: '/configuracoes',
      icon: Settings,
      show: isAdmin || isSecretary,
    },
  ]

  const filteredNav = navItems.filter((item) => item.show)

  const LogoHeader = () => (
    <div className="flex h-28 shrink-0 items-center justify-center px-6 mb-2 mt-4 border-b border-border/50 pb-6">
      <img
        src={logoMarca}
        alt="Clínica MEDSPA"
        className="h-[4.5rem] w-auto object-contain mix-blend-multiply transition-transform hover:scale-105 duration-300"
      />
    </div>
  )

  const GlobalSidebarContent = () => (
    <>
      <LogoHeader />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-3 py-4">
          {filteredNav.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href)) ||
              (item.href === '/pacientes' && location.pathname.startsWith('/prontuario'))
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  isActive
                    ? 'bg-primary/10 text-primary border-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground border-transparent font-medium',
                  'group flex items-center px-4 py-3 text-sm rounded-lg border-l-4 transition-all duration-200',
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )

  const ClinicalTabLink = ({ id, label, icon: Icon, className, disabled }: any) => {
    const isActive = activeTab === id

    const handleClick = (e: React.MouseEvent) => {
      if (disabled) {
        e.preventDefault()
      }
    }

    return (
      <Link
        to={disabled ? '#' : `/prontuario/${patientId}?tab=${id}`}
        replace
        onClick={handleClick}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary/10 text-primary'
            : disabled
              ? 'text-muted-foreground/40 cursor-not-allowed'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          className,
        )}
      >
        <Icon className="w-4 h-4" />
        {label}
      </Link>
    )
  }

  const ClinicalSidebarContent = () => (
    <>
      <LogoHeader />
      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <Button
            variant="outline"
            disabled={isStarted}
            className={cn(
              'w-full justify-start shadow-sm bg-white transition-all text-muted-foreground hover:text-foreground',
              isStarted &&
                'opacity-50 cursor-not-allowed hover:text-muted-foreground pointer-events-none',
            )}
            onClick={() => navigate('/pacientes')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Pacientes
          </Button>
        </div>

        <div className="space-y-1">
          <ClinicalTabLink id="historico" label="Histórico" icon={History} />
          <ClinicalTabLink id="planejamento" label="Planejamento" icon={ClipboardList} />
        </div>

        {showNovoAtendimento && (
          <Accordion type="multiple" defaultValue={['novo-atendimento']} className="w-full">
            <AccordionItem value="novo-atendimento" className="border-none">
              <AccordionTrigger
                className={cn(
                  'px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider hover:no-underline hover:bg-muted/50 rounded-md transition-colors data-[state=open]:bg-transparent',
                  isStarted && 'animate-gold-pulse',
                )}
              >
                Novo Atendimento
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-0">
                <div className="space-y-1">
                  {showAnamneseExame && (
                    <>
                      <ClinicalTabLink
                        id="anamnese"
                        label="Anamnese"
                        icon={FileText}
                        disabled={!isStarted}
                      />
                      <ClinicalTabLink
                        id="exame"
                        label="Exame Físico"
                        icon={Activity}
                        disabled={!isStarted}
                      />
                    </>
                  )}
                  <ClinicalTabLink
                    id="procedimentos"
                    label="Procedimentos"
                    icon={Syringe}
                    disabled={!isStarted}
                  />
                  <ClinicalTabLink
                    id="evolucao"
                    label="Evolução"
                    icon={Clock}
                    disabled={!isStarted}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <div>
          <h4 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Documentos e Auditoria
          </h4>
          <div className="space-y-1">
            {showDocs && (
              <>
                <ClinicalTabLink id="receitas" label="Receitas" icon={FileText} />
                <ClinicalTabLink id="laudos" label="Laudos" icon={FileText} />
              </>
            )}
            {showAudit && <ClinicalTabLink id="auditoria" label="Auditoria" icon={ShieldCheck} />}
            {showDocs && (
              <ClinicalTabLink id="inclusao" label="Inclusão de Prontuário" icon={Upload} />
            )}
          </div>
        </div>
      </div>
    </>
  )

  const SidebarContent = isClinical ? ClinicalSidebarContent : GlobalSidebarContent

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden absolute top-3 left-4 z-40">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-56 p-0 bg-sidebar">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 bg-sidebar border-r border-border shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30">
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="md:pl-56 flex flex-col flex-1 min-w-0">
        <header className="sticky top-0 z-20 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-border bg-background/95 backdrop-blur px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="sr-only">Notificações</span>
                <Bell className="h-5 w-5" aria-hidden="true" />
              </Button>

              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all"
                  >
                    <Avatar className="h-9 w-9 border border-primary/20 shadow-sm">
                      <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {currentUser.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-3 bg-muted/30">
                    <div className="flex flex-col space-y-1.5">
                      <p className="text-sm font-semibold leading-none text-primary">
                        {currentUser.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {currentUser.role} {currentUser.role === 'Médico' ? '• CRM-SP 123456' : ''}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
                  >
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
