import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import useAuditStore from '@/stores/useAuditStore'
import { format } from 'date-fns'
import { ShieldCheck, CalendarClock, User, Settings } from 'lucide-react'

export function SystemAuditLog({ title, description }: { title: string; description: string }) {
  const { logs } = useAuditStore()

  return (
    <Card className="border-none shadow-subtle animate-fade-in-up overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl text-primary font-serif flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-border/50 overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[180px]">Data e Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação Realizada</TableHead>
                <TableHead>Contexto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum registro de auditoria encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/20">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 opacity-70" />
                        {format(new Date(log.timestamp), "dd/MM/yyyy 'às' HH:mm:ss")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">{log.userName}</span>
                        <span className="text-xs text-muted-foreground">{log.userRole}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-foreground">{log.action}</span>
                    </TableCell>
                    <TableCell>
                      {log.patientId === 'SYSTEM' ? (
                        <Badge variant="outline" className="bg-muted/50 text-muted-foreground">
                          <Settings className="w-3 h-3 mr-1" /> Sistema
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-primary/5 text-primary">
                          <User className="w-3 h-3 mr-1" /> Paciente ({log.patientId})
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
