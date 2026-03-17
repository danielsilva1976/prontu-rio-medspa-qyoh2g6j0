import { Card, CardContent } from '@/components/ui/card'
import { CalendarClock, CheckCircle2, Clock } from 'lucide-react'
import { mockDashboardStats, patients } from '@/lib/mock-data'
import useUserStore from '@/stores/useUserStore'

export default function Index() {
  const { currentUser } = useUserStore()
  const isMedico = currentUser.role === 'Médico'

  // Dynamic calculation for today's appointments
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const todayStr = `${y}-${m}-${d}`

  const todaysAppointments = patients.filter(
    (p) => p.nextAppointment && p.nextAppointment.startsWith(todayStr),
  ).length

  // Keeping other metrics cumulative/total as previously defined
  const totalAppointments = mockDashboardStats.scheduledToday
  const finalizedRecords = mockDashboardStats.completedRecords
  const pendingRecords = totalAppointments - finalizedRecords

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

        <Card className="border-none shadow-subtle bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Prontuários Pendentes</p>
              <h3 className="text-2xl font-bold font-serif">{pendingRecords}</h3>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
