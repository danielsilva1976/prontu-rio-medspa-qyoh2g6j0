import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  History,
  Calendar,
  Plus,
  ClipboardList,
  Target,
  Calculator,
  FileText,
  Printer,
  Trash2,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { SavedPlan } from './PlanningForm'
import { getPaymentMethodLabel } from './PlanningForm'
import { StrategicPlanA4 } from '@/components/documents/StrategicPlanA4'
import useDocumentStore from '@/stores/useDocumentStore'
import usePatientStore from '@/stores/usePatientStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

type Props = {
  plans: SavedPlan[]
  onCreate: () => void
  isSigned: boolean
  patientId: string
}

export default function PlanningList({ plans, onCreate, isSigned, patientId }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<SavedPlan | null>(null)
  const [printOpen, setPrintOpen] = useState(false)

  const { layout } = useDocumentStore()
  const { patients, updatePatient } = usePatientStore()
  const { toast } = useToast()
  const patient = patients.find((p) => p.id === patientId)
  const patientName = patient?.name || 'Paciente'

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const handleDeletePlan = async (e: React.MouseEvent, planId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!patientId || !patient) return

    try {
      const updatedProcedures = patient.procedures.filter((p: any) => {
        if (typeof p === 'object' && p !== null) {
          return p.id !== planId
        }
        return true
      })

      await updatePatient(patientId, { procedures: updatedProcedures })

      toast({
        title: 'Sucesso',
        description: 'Planejamento excluído com sucesso.',
      })

      if (selectedPlan?.id === planId) {
        setSelectedPlan(null)
      }
    } catch (error) {
      console.error('Failed to delete plan:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o planejamento.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {plans.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <History className="w-4 h-4 text-primary" /> Histórico de Planejamentos
          </h3>
          <div className="grid gap-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border/50 bg-muted/5 hover:bg-muted/10 transition-colors shadow-none rounded-xl cursor-pointer group"
              >
                <div>
                  <p className="font-semibold text-foreground text-base group-hover:text-primary transition-colors">
                    {plan.planName}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5 font-medium">
                    <Calendar className="w-3 h-3" /> Data de criação: {plan.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left sm:text-right bg-white p-3 rounded-lg border border-border/50 group-hover:border-primary/20 transition-colors">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Investimento Previsto
                    </p>
                    <p className="text-lg font-bold text-primary tracking-tight mt-0.5">
                      {formatCurrency(plan.totalInvestment)}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir planejamento</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este planejamento? Esta ação não pode ser
                          desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => handleDeletePlan(e, plan.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/10 rounded-xl border border-dashed border-border/50 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <ClipboardList className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <p className="text-base font-medium text-foreground">Nenhum planejamento salvo</p>
          <p className="text-sm text-muted-foreground mt-1">
            Crie um novo planejamento para estruturar o tratamento.
          </p>
        </div>
      )}

      {!isSigned && (
        <Button
          onClick={onCreate}
          className="w-full h-14 text-base rounded-xl mt-2 border border-primary/10 shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" /> Incluir novo planejamento
        </Button>
      )}

      <Sheet open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto sm:p-8">
          {selectedPlan && (
            <div className="space-y-6 mt-6 pb-8">
              <SheetHeader className="text-left">
                <SheetTitle className="text-2xl font-serif text-primary leading-tight">
                  {selectedPlan.planName}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-1.5 font-medium mt-1">
                  <Calendar className="w-4 h-4" /> Criado em {selectedPlan.date}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-3 bg-muted/10 p-5 rounded-xl border border-border/50">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" /> Objetivo Principal
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedPlan.objective || 'Nenhum objetivo especificado.'}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" /> Procedimentos
                </h4>
                <div className="rounded-xl border border-border/50 overflow-hidden bg-white">
                  <Table>
                    <TableHeader className="bg-muted/5">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-10 text-xs">Procedimento / Etapa</TableHead>
                        <TableHead className="h-10 text-right text-xs">V. Unitário</TableHead>
                        <TableHead className="h-10 text-right text-xs">Subtotal</TableHead>
                        <TableHead className="h-10 text-right text-xs">Desconto</TableHead>
                        <TableHead className="h-10 text-right text-xs font-semibold">
                          V. Final
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPlan.entries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            Nenhum procedimento adicionado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedPlan.entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="py-3">
                              <div className="font-medium text-foreground text-sm">
                                {entry.procedure || 'Não informado'}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {entry.timing} • Qtd: {entry.quantity}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-right text-muted-foreground text-sm">
                              {formatCurrency(parseFloat(entry.standardValue) || 0)}
                            </TableCell>
                            <TableCell className="py-3 text-right text-muted-foreground text-sm">
                              {formatCurrency(
                                (parseFloat(entry.standardValue) || 0) *
                                  (parseInt(entry.quantity) || 1),
                              )}
                            </TableCell>
                            <TableCell className="py-3 text-right text-muted-foreground text-sm">
                              {entry.discountType === 'percentage'
                                ? `${entry.discountValue || '0'}%`
                                : formatCurrency(parseFloat(entry.discountValue) || 0)}
                            </TableCell>
                            <TableCell className="py-3 text-right font-medium text-primary text-sm">
                              {formatCurrency(parseFloat(entry.finalValue) || 0)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-4 bg-primary/5 p-6 rounded-xl border border-primary/20 mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-primary/10 pb-4 gap-2">
                  <h4 className="font-semibold text-base flex items-center gap-2 text-primary">
                    <Calculator className="w-4 h-4" /> Investimento Total
                  </h4>
                  <div className="text-2xl font-bold text-primary tracking-tight">
                    {formatCurrency(selectedPlan.totalInvestment)}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                      Entrada
                    </p>
                    <p className="text-base font-semibold text-foreground">
                      {formatCurrency(selectedPlan.downPayment)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Via {getPaymentMethodLabel(selectedPlan.downPaymentMethod)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                      Saldo Restante
                    </p>
                    <p className="text-base font-semibold text-foreground">
                      {selectedPlan.installments}x de{' '}
                      {formatCurrency(selectedPlan.installmentValue)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Via {getPaymentMethodLabel(selectedPlan.paymentMethod)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border/50 flex justify-end">
                <Button
                  onClick={() => setPrintOpen(true)}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 gap-2 shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  Gerar Plano Estratégico
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden bg-gray-100/95 flex flex-col border-none shadow-elevation backdrop-blur-sm sm:rounded-xl">
          <DialogHeader className="p-4 px-6 bg-white border-b border-border/50 flex flex-row items-center justify-between shadow-sm sticky top-0 z-10 shrink-0">
            <DialogTitle className="text-primary font-serif text-xl flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Plano Terapêutico Estratégico
            </DialogTitle>
            <div className="flex gap-3">
              <Button size="sm" onClick={() => setTimeout(() => window.print(), 500)}>
                <Printer className="h-4 w-4 mr-2" /> Imprimir Plano
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 p-8 flex justify-center w-full">
            {selectedPlan && (
              <StrategicPlanA4
                plan={selectedPlan}
                patientName={patientName}
                config={layout}
                className="border border-gray-200"
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
