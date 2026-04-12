import { Link } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin, Briefcase, CreditCard, Edit2, Phone, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import usePatientStore from '@/stores/usePatientStore'
import { PatientDialog } from '@/components/patients/PatientDialog'

type Props = {
  patient: any
  id: string
  isFinalized: boolean
  onFinalize: () => void
}

export default function PatientHeader({ patient, id, isFinalized, onFinalize }: Props) {
  const { patients } = usePatientStore()

  const storePatient = patients.find((p) => p.id === id)
  const displayPatient = storePatient || patient

  return (
    <div className="px-6 py-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <Link to="/pacientes">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Avatar className="h-16 w-16 border border-border mt-0.5 shadow-sm shrink-0">
          <AvatarImage src={displayPatient.avatar} className="object-cover" />
          <AvatarFallback className="bg-primary/5 text-primary text-xl font-medium">
            {displayPatient.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2 truncate">
              {displayPatient.name}
            </h1>

            {isFinalized && (
              <Badge
                variant="outline"
                className="text-destructive border-destructive bg-destructive/5 hidden sm:flex items-center gap-1.5 px-3 py-0.5 shrink-0"
              >
                <Lock className="w-3.5 h-3.5" />
                Consulta Finalizada - Edição Desabilitada
              </Badge>
            )}

            {!isFinalized && (
              <PatientDialog
                patient={displayPatient}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-muted shrink-0"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                }
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground/80">
              <Clock className="h-3.5 w-3.5 text-primary/70" /> {displayPatient.age} anos
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary/70" /> {displayPatient.cpf}
            </span>
            <span className="flex items-center gap-1.5 hidden sm:flex">
              <Briefcase className="h-3.5 w-3.5 text-primary/70" /> {displayPatient.profissao}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary/70" /> {displayPatient.phone}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground hidden sm:flex">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span className="truncate">{displayPatient.endereco}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto mt-4 md:mt-0">
        {!isFinalized && (
          <Button
            onClick={onFinalize}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm w-full sm:w-auto"
          >
            Finalizar Atendimento
          </Button>
        )}
      </div>
    </div>
  )
}
