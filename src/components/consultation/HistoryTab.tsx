import { useEffect, useState } from 'react'
import { Calendar, Clock, User, CheckCircle2, XCircle } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function HistoryTab({ patientId }: { patientId: string }) {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const records = await pb.collection('appointments').getFullList({
          filter: `patient = "${patientId}"`,
          sort: '-appointment_date',
        })
        setAppointments(records)
      } catch (error) {
        console.error('Error fetching appointments', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
  }, [patientId])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-border/50 shadow-sm">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-foreground">Nenhum histórico encontrado</h3>
        <p className="text-sm text-muted-foreground">
          Este paciente não possui agendamentos anteriores.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif text-primary">Histórico de Consultas</h2>
        <span className="text-sm text-muted-foreground bg-white px-3 py-1 rounded-full border shadow-sm">
          {appointments.length} {appointments.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      <div className="space-y-3">
        {appointments.map((apt) => (
          <Card
            key={apt.id}
            className="overflow-hidden transition-all hover:shadow-md border-border/50"
          >
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0 mt-1 sm:mt-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-base text-foreground">
                    {apt.service_name || 'Consulta'}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                    {apt.appointment_date && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 opacity-70" />
                        {new Date(apt.appointment_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                    {apt.professional && (
                      <span className="flex items-center gap-1.5">
                        <User className="h-4 w-4 opacity-70" />
                        {apt.professional}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="pl-14 sm:pl-0">
                {apt.status === 'Cancelado' ? (
                  <span className="inline-flex items-center gap-1.5 text-red-700 text-xs font-medium bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
                    <XCircle className="h-3.5 w-3.5" /> Cancelado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-green-700 text-xs font-medium bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Realizado
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
