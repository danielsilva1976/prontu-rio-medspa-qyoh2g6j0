import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ClipboardList } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import PlanningForm, { type SavedPlan } from './PlanningForm'
import PlanningList from './PlanningList'
import pb from '@/lib/pocketbase/client'

export default function PlanningTab({
  isSigned,
  patientId,
}: {
  isSigned: boolean
  patientId: string
}) {
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    pb.collection('patients')
      .getOne(patientId)
      .then((record) => {
        if (record.procedures && Array.isArray(record.procedures)) {
          setSavedPlans(record.procedures)
        }
      })
      .catch((err) => {
        console.error('Error fetching patient procedures:', err)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [patientId])

  const handleSavePlan = async (newPlan: SavedPlan) => {
    const updatedPlans = [newPlan, ...savedPlans]
    // Optimistic update
    setSavedPlans(updatedPlans)
    setIsCreating(false)

    try {
      await pb.collection('patients').update(patientId, { procedures: updatedPlans })
      toast({
        title: 'Planejamento Salvo',
        description: 'O plano estratégico foi salvo com sucesso.',
      })
    } catch (err) {
      console.error('Error saving plan:', err)
      // Revert optimistic update
      setSavedPlans(savedPlans)
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível sincronizar o planejamento.',
        variant: 'destructive',
      })
    }
  }

  const handleDeletePlan = async (planId: string) => {
    const previousPlans = [...savedPlans]
    const updatedPlans = savedPlans.filter((p: any) => {
      if (typeof p === 'object' && p !== null) {
        return p.id !== planId
      }
      return true
    })

    // Optimistic update
    setSavedPlans(updatedPlans)

    try {
      await pb.collection('patients').update(patientId, { procedures: updatedPlans })
      toast({
        title: 'Sucesso',
        description: 'Planejamento excluído com sucesso.',
      })
    } catch (err) {
      console.error('Error deleting plan:', err)
      // Revert optimistic update
      setSavedPlans(previousPlans)
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o planejamento.',
        variant: 'destructive',
      })
    }
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
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : isCreating ? (
          <PlanningForm
            isSigned={isSigned}
            patientId={patientId}
            onSave={handleSavePlan}
            onCancel={() => setIsCreating(false)}
          />
        ) : (
          <PlanningList
            plans={savedPlans}
            onCreate={() => setIsCreating(true)}
            onDelete={handleDeletePlan}
            isSigned={isSigned}
            patientId={patientId}
          />
        )}
      </CardContent>
    </Card>
  )
}
