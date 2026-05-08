import { useState, useContext, createContext, ReactNode, createElement, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'

export type DocTemplate = {
  id: string
  type: 'receita' | 'laudo'
  name: string
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
  isLoading: boolean
  addTemplate: (t: Omit<DocTemplate, 'id'>) => Promise<void>
  updateTemplate: (id: string, t: Partial<DocTemplate>) => Promise<void>
  removeTemplate: (id: string) => Promise<void>
  updateLayout: (l: Partial<LayoutConfig>) => Promise<void>
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
  const [templates, setTemplates] = useState<DocTemplate[]>([])
  const [layout, setLayout] = useState<LayoutConfig>(defaultLayout)
  const [issuedDocs, setIssuedDocs] = useState<IssuedDocument[]>(defaultIssuedDocs)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    const loadData = async () => {
      try {
        if (!pb.authStore.isValid) return
        setIsLoading(true)

        const [templatesRecords, layoutRecord] = await Promise.allSettled([
          pb.collection('doc_templates').getFullList({ sort: '-created' }),
          pb
            .collection('app_settings')
            .getFirstListItem('key="document_layout_config"')
            .catch(() => null),
        ])

        if (!active) return

        if (templatesRecords.status === 'fulfilled') {
          setTemplates(
            templatesRecords.value.map((r) => ({
              id: r.id,
              type: r.type as 'receita' | 'laudo',
              name: r.name,
              content: r.content,
            })),
          )
        }

        if (layoutRecord.status === 'fulfilled' && layoutRecord.value && layoutRecord.value.value) {
          setLayout(JSON.parse(layoutRecord.value.value))
        }
      } catch (err) {
        console.error('Failed to load documents data', err)
      } finally {
        if (active) setIsLoading(false)
      }
    }
    loadData()
    return () => {
      active = false
    }
  }, [])

  const addTemplate = async (t: Omit<DocTemplate, 'id'>) => {
    const record = await pb.collection('doc_templates').create(t)
    setTemplates((prev) => [
      { id: record.id, type: record.type as any, name: record.name, content: record.content },
      ...prev,
    ])
  }

  const updateTemplate = async (id: string, t: Partial<DocTemplate>) => {
    const record = await pb.collection('doc_templates').update(id, t)
    setTemplates((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, type: record.type as any, name: record.name, content: record.content }
          : item,
      ),
    )
  }

  const removeTemplate = async (id: string) => {
    await pb.collection('doc_templates').delete(id)
    setTemplates((prev) => prev.filter((item) => item.id !== id))
  }

  const updateLayout = async (l: Partial<LayoutConfig>) => {
    const newLayout = { ...layout, ...l }
    setLayout(newLayout)

    try {
      const record = await pb
        .collection('app_settings')
        .getFirstListItem('key="document_layout_config"')
      await pb.collection('app_settings').update(record.id, { value: JSON.stringify(newLayout) })
    } catch (err) {
      await pb.collection('app_settings').create({
        key: 'document_layout_config',
        value: JSON.stringify(newLayout),
      })
    }
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
        isLoading,
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
