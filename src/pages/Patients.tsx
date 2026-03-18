import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, RefreshCw, Calendar, Clock, FileText, Plus, Edit2 } from 'lucide-react'
import usePatientStore from '@/stores/usePatientStore'
import { PatientDialog } from '@/components/patients/PatientDialog'

export default function Patients() {
  const { patients } = usePatientStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSync = () => {
    setIsSyncing(true)
    setTimeout(() => setIsSyncing(false), 1500)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-primary">Pacientes</h1>
          <p className="text-muted-foreground mt-1">Gestão de pacientes e prontuários</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="px-3 py-1.5 bg-success/10 text-success border-success/20 shadow-none hidden sm:flex"
          >
            <span className="relative flex h-2 w-2 mr-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            Sincronizado
          </Badge>
          <Button variant="outline" size="icon" onClick={handleSync} disabled={isSyncing}>
            <RefreshCw
              className={`w-4 h-4 text-muted-foreground ${isSyncing ? 'animate-spin' : ''}`}
            />
          </Button>
          <PatientDialog />
        </div>
      </div>

      <Card className="border-none shadow-subtle">
        <CardContent className="p-4 sm:p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou ID..."
              className="pl-10 h-12 bg-muted/30 border-muted rounded-xl text-base focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid gap-4">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum paciente encontrado.
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex flex-col xl:flex-row items-start xl:items-center justify-between p-4 border rounded-xl hover:border-primary/40 hover:shadow-subtle transition-all bg-white group gap-4"
                >
                  <div className="flex items-center gap-4 w-full xl:w-auto">
                    <Avatar className="h-14 w-14 border border-border shrink-0">
                      <AvatarImage src={patient.avatar} className="object-cover" />
                      <AvatarFallback className="bg-primary/5 text-primary font-serif text-lg">
                        {patient.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-lg text-foreground group-hover:text-primary transition-colors">
                          {patient.name}
                        </h3>
                        <PatientDialog
                          patient={patient}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Editar Paciente"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                          }
                        />
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
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
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
