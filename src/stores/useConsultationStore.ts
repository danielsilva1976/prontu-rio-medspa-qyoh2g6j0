import { create } from 'zustand'

interface ConsultationStore {
  activeConsultations: Record<string, boolean>
  startConsultation: (patientId: string) => void
  endConsultation: (patientId: string) => void
}

const useConsultationStore = create<ConsultationStore>((set) => ({
  activeConsultations: {},
  startConsultation: (patientId) =>
    set((state) => ({ activeConsultations: { ...state.activeConsultations, [patientId]: true } })),
  endConsultation: (patientId) =>
    set((state) => ({ activeConsultations: { ...state.activeConsultations, [patientId]: false } })),
}))

export default useConsultationStore
