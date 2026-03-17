import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ClipboardList } from 'lucide-react'
import PlanningForm, { type SavedPlan } from './PlanningForm'
import PlanningList from './PlanningList'

export default function PlanningTab({ isSigned }: { isSigned: boolean }) {
  const [isCreating, setIsCreating] = useState(false)

  // Starting with mock data to showcase the end-to-end functionality
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([
    {
      id: 'mock-1',
      date: '15/10/2023 14:30',
      planName: 'Protocolo Rejuvenescimento Global 360',
      objective: 'Melhorar textura e flacidez da pele com bioestimuladores e laser.',
      totalInvestment: 4500,
      entries: [
        {
          id: 'e1',
          timing: 'Sessão 01',
          procedure: 'Bioestimulador de Colágeno',
          quantity: '1',
          standardValue: '2500',
          discountValue: '0',
          finalValue: '2500',
        },
        {
          id: 'e2',
          timing: 'Sessão 02',
          procedure: 'Laser Lavieen',
          quantity: '2',
          standardValue: '2000',
          discountValue: '0',
          finalValue: '2000',
        },
      ],
      downPayment: 1500,
      downPaymentMethod: 'pix',
      installments: 3,
      installmentValue: 1000,
      paymentMethod: 'credit',
    },
  ])

  const handleSavePlan = (newPlan: SavedPlan) => {
    setSavedPlans((prev) => [newPlan, ...prev])
    setIsCreating(false)
  }

  return (
    <Card className="border-none shadow-subtle overflow-hidden animate-slide-up">
      <div className="h-1 w-full bg-gradient-to-r from-primary/20 to-primary" />
      <CardHeader>
        <CardTitle className="font-serif text-xl text-primary flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" /> Planejamento Terapêutico
        </CardTitle>
        <CardDescription>
          Estratégia clínica estruturada, histórico de planos e previsões de investimento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {isCreating ? (
          <PlanningForm
            isSigned={isSigned}
            onSave={handleSavePlan}
            onCancel={() => setIsCreating(false)}
          />
        ) : (
          <PlanningList
            plans={savedPlans}
            onCreate={() => setIsCreating(true)}
            isSigned={isSigned}
          />
        )}
      </CardContent>
    </Card>
  )
}
