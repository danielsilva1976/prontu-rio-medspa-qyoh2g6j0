import { Navigate } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import useUserStore from '@/stores/useUserStore'
import DocumentGenerator from '@/components/documents/DocumentGenerator'
import TemplatesManager from '@/components/documents/TemplatesManager'
import LayoutConfigForm from '@/components/documents/LayoutConfigForm'

export default function Documents() {
  const { currentUser } = useUserStore()

  // Strict RBAC: Only Médico has access to documents module
  if (currentUser.role !== 'Médico') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-6 animate-slide-up h-[calc(100vh-8rem)] flex flex-col p-6 lg:p-8 print:p-0 print:h-auto print:block">
      <div className="flex items-center justify-between shrink-0 print:hidden">
        <div>
          <h1 className="text-3xl font-serif text-primary tracking-tight">Documentos Legais</h1>
          <p className="text-muted-foreground mt-1">
            Gere documentos e configure os padrões visuais da clínica
          </p>
        </div>
      </div>

      <Tabs defaultValue="gerador" className="flex-1 flex flex-col min-h-0 print:block w-full">
        <TabsList className="w-fit mb-4 print:hidden bg-muted/50">
          <TabsTrigger value="gerador" className="data-[state=active]:bg-white">
            Emissão Rápida
          </TabsTrigger>
          <TabsTrigger value="modelos" className="data-[state=active]:bg-white">
            Modelos Salvos
          </TabsTrigger>
          <TabsTrigger value="config" className="data-[state=active]:bg-white">
            Layout e Impressão
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="gerador"
          className="flex-1 min-h-0 print:block m-0 h-full focus-visible:outline-none"
        >
          <DocumentGenerator />
        </TabsContent>
        <TabsContent
          value="modelos"
          className="flex-1 m-0 overflow-y-auto focus-visible:outline-none"
        >
          <div className="max-w-5xl">
            <TemplatesManager />
          </div>
        </TabsContent>
        <TabsContent
          value="config"
          className="flex-1 m-0 overflow-y-auto focus-visible:outline-none"
        >
          <LayoutConfigForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
