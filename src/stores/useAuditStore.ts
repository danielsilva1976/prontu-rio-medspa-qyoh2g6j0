import { useState, useContext, createContext, ReactNode, createElement, useCallback } from 'react'
import useUserStore from './useUserStore'

export type AuditAction =
  | 'Prontuário visualizado'
  | 'Anamnese atualizada'
  | 'Exame Físico atualizado'
  | 'Procedimentos atualizados'
  | 'Evolução adicionada'
  | 'Planejamento salvo'
  | 'Documento gerado e assinado'
  | 'Status alterado: Consulta Finalizada'
  | 'Dados do paciente editados'
  | string

export type AuditLog = {
  id: string
  timestamp: string
  action: AuditAction
  patientId: string
  userId: string
  userName: string
  userRole: string
}

type AuditState = {
  logs: AuditLog[]
  addLog: (action: AuditAction, patientId: string) => void
}

const defaultLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    action: 'Agendamento confirmado',
    patientId: 'p-001',
    userId: 'usr-3',
    userName: 'Mariana Costa',
    userRole: 'Secretária',
  },
]

const AuditContext = createContext<AuditState>({} as AuditState)

export const AuditProvider = ({ children }: { children: ReactNode }) => {
  const [logs, setLogs] = useState<AuditLog[]>(defaultLogs)
  const { currentUser } = useUserStore()

  const addLog = useCallback(
    (action: AuditAction, patientId: string) => {
      setLogs((prev) => [
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          timestamp: new Date().toISOString(),
          action,
          patientId,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
        },
        ...prev,
      ])
    },
    [currentUser],
  )

  return createElement(
    AuditContext.Provider,
    {
      value: { logs, addLog },
    },
    children,
  )
}

export default function useAuditStore() {
  return useContext(AuditContext)
}
