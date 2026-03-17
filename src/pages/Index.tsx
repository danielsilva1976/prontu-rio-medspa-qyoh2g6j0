import { Card, CardContent } from '@/components/ui/card'
import { CalendarClock, CheckCircle2, Clock, ChevronRight } from 'lucide-react'
import { mockDashboardStats, patients } from '@/lib/mock-data'
import useUserStore from '@/stores/useUserStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function Index() {
  const { currentUser } = useUserStore()
  const isMedico = currentUser.role === 'Médico'

  // Dynamic calculation for today's appointments
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const todayStr = `${y}-${m}-${d}`

  const todaysAppointmentsList = patients.filter(
    (p) => p.nextAppointment && p.nextAppointment.startsWith(todayStr),
  )
  const todaysAppointments = todaysAppointmentsList.length

  // Keeping other metrics cumulative/total as previously defined
  const totalAppointments = mockDashboardStats.scheduledToday
  const finalizedRecords = mockDashboardStats.completedRecords
  const pendingRecords = totalAppointments - finalizedRecords

  // Assuming 'scheduled' implies not started or in-progress for pending records
  const pendingPatients = patients.filter((p) => p.status === 'scheduled')

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Data não definida'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="space-y-8 animate-slide-up px-4 sm:px-6 lg:px-8 pt-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl text-primary">
          {isMedico ? 'Bom dia,' : 'Olá,'}{' '}
          <span className="font-serif italic text-primary/80">
            {currentUser.name.split(' ')[0]}
          </span>
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
              <p className="text-sm font-medium text-muted-foreground">Agendamentos do Dia</p>
              <h3 className="text-2xl font-bold font-serif">{todaysAppointments}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-subtle bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Prontuários Finalizados</p>
              <h3 className="text-2xl font-bold font-serif">{finalizedRecords}</h3>
            </div>
          </CardContent>
        </Card>

        <Dialog>
          <DialogTrigger asChild>
            <Card className="border-none shadow-subtle bg-white cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-muted-foreground">Prontuários Pendentes</p>
                  <h3 className="text-2xl font-bold font-serif">{pendingRecords}</h3>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md md:max-w-2xl rounded-xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-primary">
                Prontuários Pendentes
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto pr-2">
              {pendingPatients.length > 0 ? (
                pendingPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border/50 rounded-xl bg-card hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Agendado para: {formatDateTime(patient.nextAppointment)}
                      </p>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="shrink-0 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <Link to={`/prontuario/${patient.id}`}>
                        Abrir Prontuário
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum prontuário pendente.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
