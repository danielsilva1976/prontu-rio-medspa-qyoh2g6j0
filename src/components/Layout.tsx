import { Link, Outlet, useLocation, Navigate, matchPath, useSearchParams } from 'react-router-dom'
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
  const { currentUser, users, switchUser, isAuthenticated, logout } = useUserStore()
  const { activeConsultations } = useConsultationStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const matchClinical = matchPath({ path: '/prontuario/:id' }, location.pathname)
  const isClinical = !!matchClinical
  const patientId = matchClinical?.params?.id || ''
  const activeTab = searchParams.get('tab') || 'historico'

  const isStarted = activeConsultations[patientId] || false

  const showAnamneseExame = currentUser.role === 'Médico' || currentUser.role === 'Estético'
  const showDocs = currentUser.role === 'Médico'
  const showAudit = currentUser.id === 'usr-admin'

  const navItems = [
    { name: 'Pacientes', href: '/pacientes', icon: Users, show: true },
    {
      name: 'Documentos',
      href: '/documentos',
      icon: FileText,
      show: currentUser.role === 'Médico',
    },
    {
      name: 'Configurações',
      href: '/configuracoes',
      icon: Settings,
      show: currentUser.role === 'Médico',
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
    return (
      <Link
        to={disabled ? '#' : `/prontuario/${patientId}?tab=${id}`}
        replace
        onClick={(e) => {
          if (disabled) e.preventDefault()
        }}
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
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 space-y-6">
        <div>
          <Link
            to="/pacientes"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border shadow-sm bg-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Pacientes
          </Link>
        </div>

        <div className="space-y-1">
          <ClinicalTabLink id="historico" label="Histórico" icon={History} />
        </div>

        <Accordion type="multiple" defaultValue={['novo-atendimento']} className="w-full">
          <AccordionItem value="novo-atendimento" className="border-none">
            <AccordionTrigger className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider hover:no-underline hover:bg-muted/50 rounded-md transition-colors data-[state=open]:bg-transparent">
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
                  id="planejamento"
                  label="Planejamento"
                  icon={ClipboardList}
                  disabled={!isStarted}
                />
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

        {(showDocs || showAudit) && (
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
              {showAudit && (
                <ClinicalTabLink
                  id="auditoria"
                  label="Auditoria"
                  icon={ShieldCheck}
                  className="mt-4 text-amber-600 hover:text-amber-700 hover:bg-amber-50/50"
                />
              )}
            </div>
          </div>
        )}
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
        <SheetContent side="left" className="w-72 p-0 bg-sidebar">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 bg-sidebar border-r border-border shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30">
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="md:pl-72 flex flex-col flex-1 min-w-0">
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
                      <AvatarImage
                        src={`https://img.usecurling.com/ppl/thumbnail?gender=female&seed=${
                          currentUser.id === 'usr-1' ? 1 : 2
                        }`}
                        alt={currentUser.name}
                      />
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
                  <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                    Alternar Usuário (Demo)
                  </DropdownMenuLabel>
                  {users.map((u) => (
                    <DropdownMenuItem
                      key={u.id}
                      className="cursor-pointer py-2"
                      onClick={() => switchUser(u.id)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] bg-primary/5 text-primary">
                            {u.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span
                            className={cn(
                              'text-sm',
                              currentUser.id === u.id && 'font-bold text-primary',
                            )}
                          >
                            {u.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{u.role}</span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
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
