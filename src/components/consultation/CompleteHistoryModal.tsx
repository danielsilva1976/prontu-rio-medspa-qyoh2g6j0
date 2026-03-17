import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Printer, FileSignature } from 'lucide-react'

const mockHistory = [
  {
    id: 'h2',
    dateStr: '2023-09-15T14:30:00',
    formattedDate: '15 de Setembro, 2023 - 14:30',
    professional: 'Dra. Sofia Mendes',
    role: 'Especialista em Estética Avançada',
    type: 'Procedimento Injetável',
    status: 'finished',
    content: [
      {
        section: 'Evolução',
        text: 'Paciente retorna para realização do procedimento planejado. Sem queixas ou alterações no quadro clínico desde a última consulta.',
      },
      {
        section: 'Procedimento: Toxina Botulínica (Terço Superior)',
        text: 'Tecnologia/Produto: Dysport\nÁrea: Fronte, Glabela, Região Periorbicular\nDose: 45U totais\nLote: AB12345\nTécnica: Aplicação intramuscular padrão. Sem intercorrências imediatas.',
      },
      {
        section: 'Orientações Pós',
        text: 'Orientada a não deitar ou abaixar a cabeça por 4 horas, evitar esforço físico intenso nas próximas 24h e não massagear a região tratada.',
      },
    ],
  },
  {
    id: 'h1',
    dateStr: '2023-03-10T10:00:00',
    formattedDate: '10 de Março, 2023 - 10:00',
    professional: 'Dra. Fabíola Kleinert',
    role: 'Médica Dermatologista • CRM-SP 123456',
    type: 'Primeira Consulta - Avaliação Global',
    status: 'finished',
    content: [
      {
        section: 'Anamnese',
        text: 'Paciente relata incômodo com linhas de expressão na região frontal e flacidez leve. Nega alergias a cosméticos ou medicamentos. Histórico de hipotireoidismo (controlado com Puran T4 50mcg). Dieta balanceada, consumo adequado de água (2L/dia).',
      },
      {
        section: 'Exame Físico',
        text: 'Pele mista, fototipo III (Fitzpatrick). Grau II de Glogau (rugas em movimento). Presença de rítides dinâmicas em região frontal e glabelar. Flacidez leve no terço inferior. Tricoscopia sem alterações.',
      },
      {
        section: 'Planejamento Terapêutico',
        text: 'Indicado plano de tratamento anual focando em prevenção de rugas dinâmicas e melhora de textura da pele. Proposto Toxina Botulínica no terço superior e bioestimulador de colágeno no terço médio/inferior. Prescrito rotina de skincare com Vitamina C 10% e protetor solar FPS 50.',
      },
    ],
  },
  {
    id: 'h3',
    dateStr: '2023-11-20T11:00:00',
    formattedDate: '20 de Novembro, 2023 - 11:00',
    professional: 'Dra. Fabíola Kleinert',
    role: 'Médica Dermatologista • CRM-SP 123456',
    type: 'Retorno e Avaliação',
    status: 'scheduled',
    content: [
      {
        section: 'Observação',
        text: 'Sessão ainda não realizada, agendada.',
      },
    ],
  },
]

type Props = {
  isOpen: boolean
  onClose: (open: boolean) => void
  patient: any
}

export default function CompleteHistoryModal({ isOpen, onClose, patient }: Props) {
  const handlePrint = () => {
    setTimeout(() => window.print(), 500)
  }

  // Filter for finished appointments and sort chronologically (oldest first)
  const filteredAndSortedHistory = mockHistory
    .filter((entry) => entry.status === 'finished')
    .sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime())

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden flex flex-col bg-muted/30 sm:rounded-xl border-none shadow-elevation">
        <DialogHeader className="p-4 pr-12 pl-6 bg-white border-b border-border/50 shadow-sm flex flex-row items-center justify-between sticky top-0 z-10 shrink-0">
          <DialogTitle className="text-primary font-serif text-xl flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Histórico Clínico Completo
          </DialogTitle>
          <div className="flex items-center gap-3">
            <Button
              className="bg-primary hover:bg-primary/90 shadow-sm text-white"
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-2" /> Imprimir Histórico
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea
          className="flex-1 p-4 sm:p-8 flex justify-center w-full print:p-0 print:h-auto print:overflow-visible"
          id="print-area"
        >
          <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] mx-auto rounded-sm min-h-[1056px] w-full max-w-[816px] flex flex-col shrink-0 mb-8 border border-gray-200 print:border-none print:shadow-none print:w-full print:max-w-full print:m-0">
            <div className="h-2 w-full bg-gradient-to-r from-primary to-primary/80 shrink-0 print:hidden"></div>

            <div className="px-6 sm:px-10 py-12 print:px-0 print:py-0 flex-1">
              <div className="border-b-2 border-primary/20 pb-6 mb-10 text-center">
                <h2 className="text-2xl font-serif text-primary uppercase tracking-[0.2em]">
                  Prontuário Médico
                </h2>
                <h3 className="text-lg font-serif text-primary/80 uppercase tracking-widest mt-1">
                  Histórico Contínuo
                </h3>
                <div className="mt-4 inline-block bg-muted/10 border border-border px-6 py-2 rounded">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                    Paciente:{' '}
                    <span className="text-foreground ml-1">{patient?.name || 'Paciente'}</span>
                  </p>
                </div>
              </div>

              <div className="relative">
                {/* Continuous Vertical Line */}
                <div className="absolute left-[5px] top-2 bottom-0 w-[2px] bg-muted print:hidden"></div>

                {filteredAndSortedHistory.map((entry) => (
                  <div key={entry.id} className="relative mb-14 last:mb-0">
                    {/* Timeline dot */}
                    <div className="absolute left-[-1px] top-2 w-3.5 h-3.5 bg-white border-2 border-primary rounded-full z-10 print:hidden shadow-sm"></div>

                    <div className="ml-8 print:ml-0">
                      {/* Date / Entry Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                        <div className="bg-muted/30 text-foreground font-semibold px-3 py-1.5 rounded-md text-sm shrink-0 border border-border/50">
                          {entry.formattedDate}
                        </div>
                        <div className="hidden sm:block h-px bg-border/50 flex-1"></div>
                        <div className="text-xs font-bold text-primary shrink-0 uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-md border border-primary/10">
                          {entry.type}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-6">
                        {entry.content.map((sec, i) => (
                          <div
                            key={i}
                            className="bg-muted/5 p-4 rounded-lg border border-border/30"
                          >
                            <h4 className="text-xs font-bold text-foreground mb-2 uppercase tracking-widest text-primary/80 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-primary/40 rounded-full"></div>
                              {sec.section}
                            </h4>
                            <div className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap font-serif">
                              {sec.text}
                            </div>
                          </div>
                        ))}

                        {/* Signature */}
                        <div className="mt-8 pt-6 flex flex-col items-end w-72 ml-auto">
                          <div className="w-full border-t border-primary/30 relative flex justify-center mb-3">
                            <div className="absolute -top-10 flex flex-col items-center opacity-60">
                              <FileSignature className="w-8 h-8 text-primary/80" />
                            </div>
                          </div>
                          <p className="font-serif font-bold text-primary text-lg">
                            {entry.professional}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5 text-right">
                            {entry.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredAndSortedHistory.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    Nenhum registro finalizado encontrado para este paciente.
                  </div>
                )}
              </div>

              <div className="mt-16 pt-8 border-t-2 border-primary/10 text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                Fim do Histórico Registrado • Documento Confidencial
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
