import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FileText, Edit2 } from 'lucide-react'
import { PatientDialog } from './PatientDialog'
import { Patient } from '@/stores/usePatientStore'
import { Badge } from '@/components/ui/badge'

export function PatientCard({ patient }: { patient: Patient }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl hover:border-primary/40 hover:shadow-subtle transition-all bg-white group gap-4">
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
            {patient.age > 0 && (
              <>
                <span>•</span>
                <span>{patient.age} anos</span>
              </>
            )}
            {patient.phone && (
              <>
                <span>•</span>
                <span>{patient.phone}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto justify-end gap-2 border-t sm:border-t-0 pt-4 sm:pt-0">
        <Button
          asChild
          className="w-full sm:w-auto rounded-full shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all sm:hover:scale-[1.02]"
        >
          <Link to={`/prontuario/${patient.id}`}>
            <FileText className="w-4 h-4 mr-2" />
            Prontuário
          </Link>
        </Button>
      </div>
    </div>
  )
}
