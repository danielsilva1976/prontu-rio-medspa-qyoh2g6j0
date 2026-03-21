import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Clock, FileText, Plus, Edit2 } from 'lucide-react'
import { PatientDialog } from './PatientDialog'
import { Patient } from '@/stores/usePatientStore'
import { Badge } from '@/components/ui/badge'

export function PatientCard({ patient }: { patient: Patient }) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const hasApptToday =
    (patient.nextAppointment && patient.nextAppointment.startsWith(todayStr)) ||
    (patient.lastVisit && patient.lastVisit.startsWith(todayStr))

  return (
    <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between p-4 border rounded-xl hover:border-primary/40 hover:shadow-subtle transition-all bg-white group gap-4">
      <div className="flex items-center gap-4 w-full xl:w-auto">
        <Avatar className="h-14 w-14 border border-border shrink-0">
          <AvatarImage src={patient.avatar} className="object-cover" />
          <AvatarFallback className="bg-primary/5 text-primary font-serif text-lg">
            {patient.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center flex-wrap gap-2">
            <h3 className="font-medium text-lg text-foreground group-hover:text-primary transition-colors">
              {patient.name}
            </h3>
            {hasApptToday && (
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2 py-0 h-5"
              >
                Hoje
              </Badge>
            )}
            {patient.status === 'scheduled' && (
              <Badge
                variant="secondary"
                className="bg-blue-500/10 text-blue-600 border-none text-[10px] px-2 py-0 h-5"
              >
                Agendado
              </Badge>
            )}
            {patient.status === 'active' && (
              <Badge
                variant="secondary"
                className="bg-green-500/10 text-green-600 border-none text-[10px] px-2 py-0 h-5"
              >
                Ativo
              </Badge>
            )}
            {patient.status === 'inactive' && (
              <Badge
                variant="secondary"
                className="bg-gray-500/10 text-gray-600 border-none text-[10px] px-2 py-0 h-5"
              >
                Inativo
              </Badge>
            )}
            <PatientDialog
              patient={patient}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  title="Editar Paciente"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              }
            />
          </div>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground mt-0.5">
            {patient.cpf && <span>CPF: {patient.cpf}</span>}
            {patient.cpf && <span>•</span>}
            <span>ID: {patient.id.toUpperCase()}</span>
            <span>•</span>
            <span>{patient.age} anos</span>
            <span>•</span>
            <span>{patient.phone}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center w-full xl:w-auto justify-between gap-4 xl:gap-8 border-t xl:border-t-0 pt-4 xl:pt-0">
        <div className="flex justify-between sm:flex-col w-full sm:w-auto text-sm text-muted-foreground gap-1">
          <p className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 shrink-0" />{' '}
            <span className="hidden sm:inline">Última:</span>{' '}
            {new Date(patient.lastVisit).toLocaleDateString('pt-BR')}
          </p>
          {patient.nextAppointment ? (
            <p className="flex items-center gap-1 text-primary font-medium">
              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />{' '}
              <span className="hidden sm:inline">Próxima:</span>{' '}
              {new Date(patient.nextAppointment).toLocaleDateString('pt-BR')}
            </p>
          ) : (
            <p className="flex items-center gap-1 text-muted-foreground/60 italic">
              Sem agendamento
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto rounded-full shrink-0 group-hover:border-primary/40 bg-white transition-colors"
          >
            <Link to={`/prontuario/${patient.id}`}>
              <FileText className="w-4 h-4 mr-2" />
              Prontuário
            </Link>
          </Button>
          <Button
            asChild
            className="w-full sm:w-auto rounded-full shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all sm:hover:scale-[1.02]"
          >
            <Link to={`/prontuario/${patient.id}?tab=evolucao`}>
              <Plus className="w-4 h-4 mr-1.5" />
              Novo Atendimento
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
