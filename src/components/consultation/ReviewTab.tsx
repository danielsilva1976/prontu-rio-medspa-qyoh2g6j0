import { FileText, Edit, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ApplicationMarker from './ApplicationMarker'
import { sortSectionEntries, sortSections } from '@/lib/consultation-utils'

export default function ReviewTab({
  content,
  onEdit,
  onFinalize,
}: {
  content: Record<string, any>
  onEdit: () => void
  onFinalize: () => void
}) {
  if (!content || Object.keys(content).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-border/50 shadow-sm max-w-5xl mx-auto animate-fade-in-up">
        <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-foreground">Nenhum dado registrado</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Preencha as seções do atendimento para visualizar o resumo.
        </p>
        <Button onClick={onEdit} variant="outline">
          <Edit className="w-4 h-4 mr-2" /> Preencher Prontuário
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-white border border-gray-200 shadow-sm mx-auto overflow-hidden relative w-full max-w-5xl">
        {/* Top decorative edge to look like paper */}
        <div className="h-2 w-full bg-primary/10 border-b border-gray-100"></div>

        <div className="p-8 sm:p-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-200 pb-6 mb-8 gap-4">
            <div>
              <h3 className="text-2xl font-serif text-gray-900 mb-2">Resumo do Atendimento</h3>
              <p className="text-sm text-gray-500 font-medium">Revisão antes da finalização</p>
            </div>
          </div>

          <div className="space-y-8 text-gray-800 leading-relaxed">
            {Object.entries(content)
              .sort(sortSections)
              .map(([sectionName, sectionData]) => (
                <section key={sectionName} className="mb-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">
                    {sectionName}
                  </h4>
                  <div className="grid grid-cols-1 gap-y-3">
                    {Object.entries(sectionData as Record<string, any>)
                      .sort(sortSectionEntries)
                      .map(([key, value]) => {
                        if (key.startsWith('_markers_')) {
                          return (
                            <div
                              key={key}
                              className="mt-4 mb-6 border border-border/50 rounded-xl overflow-hidden bg-muted/10 p-4 shadow-sm"
                            >
                              <span className="font-semibold text-gray-700 block mb-4">
                                Mapeamento Visual - {value.area}:
                              </span>
                              <ApplicationMarker
                                area={value.area}
                                points={value.points || []}
                                vectors={value.vectors || []}
                                lines={value.lines || []}
                                isSigned={true}
                                onChange={() => {}}
                              />
                            </div>
                          )
                        }
                        return (
                          <div key={key} className="text-sm">
                            <span className="font-semibold text-gray-700 block mb-0.5">{key}:</span>
                            <span className="text-gray-600 whitespace-pre-wrap">
                              {String(value)}
                            </span>
                          </div>
                        )
                      })}
                  </div>
                </section>
              ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button variant="outline" onClick={onEdit} className="w-full sm:w-auto h-12 px-6">
              <Edit className="w-4 h-4 mr-2" /> Editar Atendimento
            </Button>
            <Button
              onClick={onFinalize}
              className="w-full sm:w-auto h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-semibold"
            >
              <CheckCircle className="w-5 h-5 mr-2" /> Finalizar e Assinar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
