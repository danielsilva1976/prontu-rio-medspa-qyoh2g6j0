import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  FileText,
  Bell,
  Search,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { cn } from '@/lib/utils'
import logoMarca from '@/assets/marca-principal_page-0001-2e968.jpg'
import useUserStore from '@/stores/useUserStore'

export default function Layout() {
  const location = useLocation()
  const { currentUser, users, switchUser } = useUserStore()

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, show: currentUser.role === 'Médico' },
    { name: 'Agenda', href: '/', icon: Calendar, show: currentUser.role !== 'Médico' },
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

  const SidebarContent = () => (
    <>
      <div className="flex h-28 shrink-0 items-center justify-center px-6 mb-2 mt-4 border-b border-border/50 pb-6">
        <img
          src={logoMarca}
          alt="Clínica MEDSPA"
          className="h-[4.5rem] w-auto object-contain mix-blend-multiply transition-transform hover:scale-105 duration-300"
        />
      </div>
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
            <form className="relative flex flex-1" action="#" method="GET">
              <label htmlFor="search-field" className="sr-only">
                Buscar
              </label>
              <div className="relative w-full max-w-md items-center flex">
                <Search
                  className="absolute left-3 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="search-field"
                  className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-primary transition-colors"
                  placeholder="Buscar pacientes, prontuários..."
                  type="search"
                  name="search"
                />
              </div>
            </form>
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
                  <DropdownMenuItem className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10">
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
