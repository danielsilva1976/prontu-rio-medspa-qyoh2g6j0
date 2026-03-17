import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ShieldCheck, CalendarClock } from 'lucide-react'
import useAuditStore from '@/stores/useAuditStore'
import { format } from 'date-fns'

export default function AuditLogTab({ patientId }: { patientId: string }) {
  const { logs } = useAuditStore()
  const patientLogs = logs.filter((log) => log.patientId === patientId)

  return (
    <Card className="border-none shadow-subtle overflow-hidden animate-slide-up">
      <div className="h-1 w-full bg-gradient-to-r from-amber-500/50 to-amber-500"></div>
      <CardHeader>
        <CardTitle className="font-serif text-xl text-amber-700 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" /> Trilha de Auditoria
        </CardTitle>
        <CardDescription>
          Registro imutável de acessos e modificações realizadas no prontuário do paciente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-border/50 overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[200px]">Data e Hora</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Ação Realizada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patientLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Nenhum registro de auditoria encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                patientLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/20">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 text-amber-600/70" />
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
                      <span className="text-sm font-medium text-foreground bg-muted/40 px-2.5 py-1 rounded-md border border-border/50">
                        {log.action}
                      </span>
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
