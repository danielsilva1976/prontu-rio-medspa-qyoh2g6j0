import logoMarca from '@/assets/marca-principal_page-0001-2e968.jpg'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LayoutConfig } from '@/stores/useDocumentStore'
import { SavedPlan, getPaymentMethodLabel } from '@/components/consultation/PlanningForm'

interface Props {
  plan: SavedPlan
  patientName: string
  config: LayoutConfig
  className?: string
}

export function StrategicPlanA4({ plan, patientName, config, className }: Props) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const totalStandard = plan.entries.reduce((acc, e) => {
    const unitPrice = parseFloat(e.standardValue) || 0
    const qty = parseInt(e.quantity, 10) || 1
    return acc + unitPrice * qty
  }, 0)

  const totalDiscount = Math.max(0, totalStandard - plan.totalInvestment)

  return (
    <div
      className={cn(
        'bg-white flex flex-col relative w-[21cm] min-h-[29.7cm] shadow-[0_8px_30px_rgb(0,0,0,0.08)] mx-auto print:shadow-none print:m-0 print:max-w-full',
        className,
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-12 pt-12 pb-8 shrink-0 relative">
        <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-primary to-primary/80"></div>
        <div className="flex flex-col items-start gap-1">
          <img
            src={logoMarca}
            alt={config.clinicName}
            className="h-20 w-auto object-contain mix-blend-multiply drop-shadow-sm"
          />
        </div>
        <div className="text-right text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-primary text-sm tracking-wide">{config.proName}</p>
          <p className="font-medium text-foreground/70">
            {config.proSpecialty} • {config.proRegistry}
          </p>
          <p className="pt-2">{config.addressLine1}</p>
          <p>{config.addressLine2}</p>
          <p>{config.contact}</p>
        </div>
      </div>
      <div className="mx-12 h-[2px] bg-primary/20 shrink-0"></div>

      {/* Body */}
      <div className="flex-1 px-16 pt-10 pb-16 flex flex-col">
        <h3 className="text-center font-serif text-2xl tracking-[0.2em] text-primary uppercase mb-10">
          Plano Terapêutico Estratégico
        </h3>

        <div className="space-y-8">
          {/* Patient & Date */}
          <div className="flex justify-between items-end border-b border-border/50 pb-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                Paciente
              </p>
              <p className="font-serif text-xl text-foreground font-medium">{patientName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                Data do Planejamento
              </p>
              <p className="font-medium text-foreground">{plan.date}</p>
            </div>
          </div>

          {/* Objective */}
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-primary font-bold mb-3 flex items-center gap-2">
              Objetivo Clínico do Tratamento
            </h4>
            <div className="bg-muted/5 border border-border/50 rounded-lg p-5">
              <p className="text-[15px] leading-relaxed text-gray-700 font-serif italic">
                "{plan.objective || 'Nenhum objetivo específico registrado.'}"
              </p>
            </div>
          </div>

          {/* Procedures */}
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-primary font-bold mb-3">
              Cronograma de Intervenções
            </h4>
            <div className="w-full border border-border/50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/10 border-b border-border/50">
                  <tr>
                    <th className="text-left py-3 px-5 font-semibold text-gray-700">
                      Procedimento
                    </th>
                    <th className="text-left py-3 px-5 font-semibold text-gray-700">
                      Etapa / Momento
                    </th>
                    <th className="text-right py-3 px-5 font-semibold text-gray-700">V. Unit.</th>
                    <th className="text-right py-3 px-5 font-semibold text-gray-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {plan.entries.length > 0 ? (
                    plan.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="py-3 px-5 text-gray-800 font-medium">
                          {entry.procedure || 'Não especificado'}{' '}
                          <span className="text-xs text-muted-foreground ml-1 font-normal">
                            (x{entry.quantity})
                          </span>
                        </td>
                        <td className="py-3 px-5 text-gray-600">{entry.timing}</td>
                        <td className="py-3 px-5 text-right text-gray-600">
                          {formatCurrency(parseFloat(entry.standardValue) || 0)}
                        </td>
                        <td className="py-3 px-5 text-right text-gray-800 font-medium">
                          {formatCurrency(
                            (parseFloat(entry.standardValue) || 0) *
                              (parseInt(entry.quantity, 10) || 1),
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground italic">
                        Nenhum procedimento registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Investment */}
          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
              <h4 className="text-[11px] uppercase tracking-widest text-primary font-bold mb-4">
                Estrutura de Investimento
              </h4>
              <div className="space-y-3 text-[13px]">
                <div className="flex justify-between text-gray-600">
                  <span>Valor de Referência:</span>
                  <span className="font-medium">{formatCurrency(totalStandard)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-success font-medium">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Benefício Especial:
                    </span>
                    <span>- {formatCurrency(totalDiscount)}</span>
                  </div>
                )}
                <div className="w-full h-px bg-primary/20 my-2"></div>
                <div className="flex justify-between font-bold text-[17px] text-primary">
                  <span>Investimento Total:</span>
                  <span>{formatCurrency(plan.totalInvestment)}</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/10 p-6 rounded-xl border border-border/50">
              <h4 className="text-[11px] uppercase tracking-widest text-gray-500 font-bold mb-4">
                Condições de Pagamento
              </h4>
              <div className="space-y-5 text-sm">
                <div>
                  <p className="text-[11px] uppercase font-semibold text-muted-foreground mb-1">
                    Entrada
                  </p>
                  <p className="font-semibold text-gray-800 text-[15px]">
                    {formatCurrency(plan.downPayment)}{' '}
                    <span className="text-gray-500 font-normal text-[13px] ml-1">
                      via {getPaymentMethodLabel(plan.downPaymentMethod)}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase font-semibold text-muted-foreground mb-1">
                    Saldo Restante
                  </p>
                  <p className="font-semibold text-gray-800 text-[15px]">
                    {plan.installments}x de {formatCurrency(plan.installmentValue)}
                  </p>
                  <p className="text-gray-500 text-[13px] mt-0.5">
                    via {getPaymentMethodLabel(plan.paymentMethod)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="mt-24 pt-8 flex flex-col items-center justify-end shrink-0 mb-4">
          <div className="w-72 border-t-[1.5px] border-primary/40 mb-4 relative flex justify-center"></div>
          <p className="font-serif font-bold text-gray-900 tracking-wide text-lg text-primary">
            {config.proName}
          </p>
          <p className="text-[13px] text-gray-500 font-medium mt-1">
            {config.proSpecialty} • {config.proRegistry}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-primary/5 border-t border-primary/20 text-primary/70 text-[10px] py-4 px-12 text-center shrink-0 uppercase tracking-[0.15em] leading-relaxed">
        Este documento apresenta uma estimativa terapêutica e financeira, válida por 30 dias a
        partir da data de emissão.
      </div>
    </div>
  )
}
