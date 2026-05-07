import { useState, useContext, createContext, ReactNode, createElement } from 'react'

export type DocTemplate = {
  id: string
  type: 'receita' | 'laudo'
  title: string
  content: string
}

export type LayoutConfig = {
  clinicName: string
  proName: string
  proSpecialty: string
  proRegistry: string
  addressLine1: string
  addressLine2: string
  contact: string
  disclaimer: string
}

export type IssuedDocument = {
  id: string
  patientId: string
  type: 'receita' | 'laudo'
  title: string
  date: string
  content: string
  status: 'Assinado' | 'Rascunho'
}

type DocumentState = {
  templates: DocTemplate[]
  layout: LayoutConfig
  issuedDocs: IssuedDocument[]
  addTemplate: (t: Omit<DocTemplate, 'id'>) => void
  updateTemplate: (id: string, t: Partial<DocTemplate>) => void
  removeTemplate: (id: string) => void
  updateLayout: (l: Partial<LayoutConfig>) => void
  issueDocument: (doc: Omit<IssuedDocument, 'id' | 'date'>) => IssuedDocument
  removeIssuedDocument: (id: string) => void
}

const defaultLayout: LayoutConfig = {
  clinicName: 'Clínica MEDSPA',
  proName: 'Dra. Fabíola Kleinert',
  proSpecialty: 'Médica Dermatologista',
  proRegistry: 'CRM-SP 123456',
  addressLine1: 'Av. Paulista, 1000 - Conjunto 101 - Bela Vista',
  addressLine2: 'São Paulo, SP - 01310-100',
  contact: '(11) 99999-9999 • contato@medspa.com.br',
  disclaimer:
    'Documento assinado digitalmente conforme MP nº 2.200-2/2001, que institui a Infraestrutura de Chaves Públicas Brasileira - ICP-Brasil.',
}

const defaultTemplates: DocTemplate[] = [
  {
    id: 't-1',
    type: 'receita',
    title: 'Rotina Skincare Diária',
    content:
      'Uso Tópico:\n\n1. Vitamina C 10% - Aplicar 3 a 4 gotas na face pela manhã, antes do protetor solar.\n\n2. Protetor Solar FPS 50+ - Reaplicar a cada 3 horas.\n\n3. Ácido Retinoico 0.025% (Creme) - Aplicar pequena quantidade à noite. Iniciar uso em dias alternados para evitar sensibilização.',
  },
  {
    id: 't-2',
    type: 'laudo',
    title: 'Laudo de Toxina Botulínica',
    content:
      'Atesto para os devidos fins que a paciente submeteu-se, nesta data, a procedimento dermatológico estético minimamente invasivo (Aplicação de Toxina Botulínica tipo A) nas regiões frontal, glabelar e periorbicular.\n\nProcedimento transcorreu sem intercorrências.\n\nRecomendações pós-procedimento fornecidas por escrito à paciente.',
  },
]

const defaultIssuedDocs: IssuedDocument[] = [
  {
    id: 'doc-1',
    patientId: 'p-001',
    type: 'receita',
    title: 'Receituário Skincare Routine',
    date: '17/03/2026',
    status: 'Assinado',
    content:
      'Uso Tópico:\n\n1. Ácido Retinóico 0.025% creme - 30g\n   Aplicar uma fina camada no rosto à noite, 3x na semana.\n\n2. Vitamina C 15% sérum - 30ml\n   Aplicar no rosto pela manhã, antes do protetor solar.\n\n3. Protetor Solar FPS 50+ toque seco\n   Aplicar generosamente pela manhã e reaplicar a cada 3 horas.',
  },
]

const DocumentContext = createContext<DocumentState>({} as DocumentState)

export const DocumentProvider = ({ children }: { children: ReactNode }) => {
  const [templates, setTemplates] = useState<DocTemplate[]>(defaultTemplates)
  const [layout, setLayout] = useState<LayoutConfig>(defaultLayout)
  const [issuedDocs, setIssuedDocs] = useState<IssuedDocument[]>(defaultIssuedDocs)

  const addTemplate = (t: Omit<DocTemplate, 'id'>) => {
    setTemplates((prev) => [...prev, { ...t, id: `t-${Date.now()}` }])
  }

  const updateTemplate = (id: string, t: Partial<DocTemplate>) => {
    setTemplates((prev) => prev.map((item) => (item.id === id ? { ...item, ...t } : item)))
  }

  const removeTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((item) => item.id !== id))
  }

  const updateLayout = (l: Partial<LayoutConfig>) => {
    setLayout((prev) => ({ ...prev, ...l }))
  }

  const issueDocument = (doc: Omit<IssuedDocument, 'id' | 'date'>) => {
    const newDoc: IssuedDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      date: new Date().toLocaleDateString('pt-BR'),
    }
    setIssuedDocs((prev) => [newDoc, ...prev])
    return newDoc
  }

  const removeIssuedDocument = (id: string) => {
    setIssuedDocs((prev) => prev.filter((d) => d.id !== id))
  }

  return createElement(
    DocumentContext.Provider,
    {
      value: {
        templates,
        layout,
        issuedDocs,
        addTemplate,
        updateTemplate,
        removeTemplate,
        updateLayout,
        issueDocument,
        removeIssuedDocument,
      },
    },
    children,
  )
}

export default function useDocumentStore() {
  return useContext(DocumentContext)
}
