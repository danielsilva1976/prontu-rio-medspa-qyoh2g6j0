import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CalendarClock,
  CheckCircle2,
  UserPlus,
  ArrowRight,
  Syringe,
  FileSignature,
} from 'lucide-react'
import { patients, mockDashboardStats } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'

export default function Index() {
  const todayPatients = patients.filter((p) => p.status === 'scheduled')

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl text-primary">
          Bom dia, <span className="font-serif italic text-primary/80">Dra. Sofia</span>
        </h1>
        <p className="text-muted-foreground">Aqui está o resumo da sua agenda para hoje.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-subtle bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <CalendarClock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Agendamentos Hoje</p>
              <h3 className="text-2xl font-bold font-serif">{mockDashboardStats.scheduledToday}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-subtle bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-success rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Prontuários Finalizados</p>
              <h3 className="text-2xl font-bold font-serif">
                {mockDashboardStats.completedRecords}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-subtle bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Novos Pacientes</p>
              <h3 className="text-2xl font-bold font-serif">{mockDashboardStats.newPatients}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        {/* Agenda list */}
        <Card className="border-none shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <div className="space-y-1">
              <CardTitle className="text-xl">Agenda do Dia</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                Sincronizado com Belle Software
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden sm:flex text-primary border-primary/30 hover:bg-primary/5"
            >
              <Link to="/pacientes">
                Ver todos <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {todayPatients.map((patient) => {
                const time = new Date(patient.nextAppointment!).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                return (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-4 md:p-6 transition-colors hover:bg-muted/30 group"
                  >
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="text-center w-16 shrink-0">
                        <span className="text-sm font-bold text-primary block">{time}</span>
                        <span className="text-xs text-muted-foreground block mt-1">30 min</span>
                      </div>
                      <div className="w-px h-10 bg-border hidden sm:block"></div>
                      <div>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {patient.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">{patient.age} anos</span>
                          <span className="text-muted-foreground text-xs">•</span>
                          {patient.procedures.map((proc, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="font-normal text-xs bg-primary/5 text-primary border-none"
                            >
                              {proc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button
                      asChild
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-full px-6 shrink-0"
                    >
                      <Link to={`/prontuario/${patient.id}`}>Iniciar</Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="font-serif text-xl mb-4 text-primary">Ações Rápidas</h3>

          <Link to="/documentos?tab=receita" className="block">
            <Card className="border border-transparent bg-white shadow-subtle hover:border-primary/30 hover:shadow-elevation transition-all duration-300 group overflow-hidden relative">
              <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="p-3 bg-muted rounded-full w-fit group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <FileSignature className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-medium text-lg text-foreground group-hover:text-primary transition-colors">
                    Prescrição Médica
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gerar nova receita com assinatura digital.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/documentos?tab=laudo" className="block">
            <Card className="border border-transparent bg-white shadow-subtle hover:border-primary/30 hover:shadow-elevation transition-all duration-300 group overflow-hidden relative">
              <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="p-3 bg-muted rounded-full w-fit group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Syringe className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-medium text-lg text-foreground group-hover:text-primary transition-colors">
                    Laudo de Procedimento
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Documentar orientações pós-procedimento.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
