import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, RefreshCw, Calendar, Clock, FileText } from 'lucide-react'
import { patients } from '@/lib/mock-data'

export default function Patients() {
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
          <p className="text-muted-foreground mt-1">Integração base Belle Software</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="px-3 py-1.5 bg-success/10 text-success border-success/20 shadow-none"
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
        </div>
      </div>

      <Card className="border-none shadow-subtle">
        <CardContent className="p-4 sm:p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou ID do Belle Software..."
              className="pl-10 h-12 bg-muted/30 border-muted rounded-xl text-base focus-visible:ring-accent"
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
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl hover:border-accent/40 hover:shadow-subtle transition-all bg-white group"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarFallback className="bg-primary text-primary-foreground font-serif text-lg">
                        {patient.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-lg text-foreground group-hover:text-accent transition-colors">
                        {patient.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>ID: {patient.id.toUpperCase()}</span>
                        <span>•</span>
                        <span>{patient.age} anos</span>
                        <span>•</span>
                        <span>{patient.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center w-full sm:w-auto justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0">
                    <div className="text-sm text-muted-foreground">
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Última:{' '}
                        {new Date(patient.lastVisit).toLocaleDateString('pt-BR')}
                      </p>
                      {patient.nextAppointment && (
                        <p className="flex items-center gap-1 mt-1 text-primary font-medium">
                          <Clock className="w-3.5 h-3.5 text-accent" /> Próxima:{' '}
                          {new Date(patient.nextAppointment).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>

                    <Button
                      asChild
                      className="rounded-full shrink-0 group-hover:bg-accent group-hover:text-white transition-colors"
                    >
                      <Link to={`/prontuario/${patient.id}`}>
                        <FileText className="w-4 h-4 mr-2" />
                        Prontuário
                      </Link>
                    </Button>
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
