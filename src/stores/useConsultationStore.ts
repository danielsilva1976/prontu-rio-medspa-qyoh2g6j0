import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ConsultationStore {
  activeConsultations: Record<string, boolean>
  startConsultation: (patientId: string) => void
  endConsultation: (patientId: string) => void
}

const useConsultationStore = create<ConsultationStore>()(
  persist(
    (set) => ({
      activeConsultations: {},
      startConsultation: (patientId) =>
        set((state) => ({
          activeConsultations: { ...state.activeConsultations, [patientId]: true },
        })),
      endConsultation: (patientId) =>
        set((state) => ({
          activeConsultations: { ...state.activeConsultations, [patientId]: false },
        })),
    }),
    {
      name: 'consultation-storage',
    },
  ),
)

export default useConsultationStore
