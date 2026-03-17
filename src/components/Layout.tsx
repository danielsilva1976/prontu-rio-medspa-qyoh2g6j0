import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { LayoutDashboard, Users, Stethoscope, FileText, Settings, Search, Bell } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const menuItems = [
  { title: 'Início', icon: LayoutDashboard, url: '/' },
  { title: 'Pacientes', icon: Users, url: '/pacientes' },
  { title: 'Prontuário Rápido', icon: Stethoscope, url: '/prontuario/p-001' },
  { title: 'Documentos', icon: FileText, url: '/documentos' },
]

function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-primary text-primary-foreground">
            <span className="font-serif font-bold text-lg leading-none tracking-tighter">M</span>
          </div>
          <span className="font-serif font-semibold text-xl tracking-tight text-primary">
            MEDSPA
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-2 mb-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Menu Principal
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive =
                  location.pathname === item.url ||
                  (item.url !== '/' && location.pathname.startsWith(item.url))
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        'transition-all duration-200',
                        isActive
                          ? 'bg-accent/10 text-accent hover:bg-accent/20 hover:text-accent font-medium'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Link to={item.url}>
                        <item.icon className={cn('w-4 h-4 mr-2', isActive && 'text-accent')} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Configurações"
              className="text-muted-foreground hover:text-foreground"
            >
              <Link to="#">
                <Settings className="w-4 h-4 mr-2" />
                <span>Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

function TopHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-foreground" />
        <div className="relative hidden md:block w-64 lg:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar paciente por nome ou CPF..."
            className="w-full pl-9 bg-muted/50 border-none rounded-full h-9 focus-visible:ring-1 focus-visible:ring-accent transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border-2 border-background"></span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l">
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium leading-none text-foreground">Dra. Sofia Alencar</p>
            <p className="text-xs text-muted-foreground mt-1">CRM 123456/SP</p>
          </div>
          <Avatar className="w-9 h-9 border border-border">
            <AvatarImage
              src="https://img.usecurling.com/ppl/thumbnail?gender=female&seed=2"
              alt="Dra. Sofia"
            />
            <AvatarFallback className="bg-accent/10 text-accent font-serif">SA</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background overflow-hidden selection:bg-accent/20">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <TopHeader />
          <div className="flex-1 overflow-auto p-4 md:p-8 animate-fade-in">
            <div className="mx-auto max-w-6xl">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
