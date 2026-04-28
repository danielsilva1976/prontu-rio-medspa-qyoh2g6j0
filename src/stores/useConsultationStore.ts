import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ConsultationStore {
  activeConsultations: Record<string, boolean>
  drafts: Record<string, any>
  startConsultation: (patientId: string) => void
  endConsultation: (patientId: string) => void
  updateDraft: (patientId: string, section: string, data: any) => void
  clearDraft: (patientId: string) => void
}

const useConsultationStore = create<ConsultationStore>()(
  persist(
    (set) => ({
      activeConsultations: {},
      drafts: {},
      startConsultation: (patientId) =>
        set((state) => ({
          activeConsultations: { ...state.activeConsultations, [patientId]: true },
          drafts: { ...state.drafts, [patientId]: state.drafts[patientId] || {} },
        })),
      endConsultation: (patientId) =>
        set((state) => ({
          activeConsultations: { ...state.activeConsultations, [patientId]: false },
        })),
      updateDraft: (patientId, section, data) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [patientId]: {
              ...(state.drafts[patientId] || {}),
              [section]: data,
            },
          },
        })),
      clearDraft: (patientId) =>
        set((state) => {
          const newDrafts = { ...state.drafts }
          delete newDrafts[patientId]
          return { drafts: newDrafts }
        }),
    }),
    {
      name: 'consultation-storage',
      partialize: (state) => {
        const cleanDrafts = { ...state.drafts }
        // Remove base64 photos to prevent QuotaExceededError in localStorage
        Object.keys(cleanDrafts).forEach((patientId) => {
          if (cleanDrafts[patientId]?.procedimentos?.entries) {
            cleanDrafts[patientId].procedimentos.entries = cleanDrafts[
              patientId
            ].procedimentos.entries.map((entry: any) => {
              const { photo, ...rest } = entry
              return rest
            })
          }
        })
        return {
          activeConsultations: state.activeConsultations,
          drafts: cleanDrafts,
        }
      },
    },
  ),
)

export default useConsultationStore
