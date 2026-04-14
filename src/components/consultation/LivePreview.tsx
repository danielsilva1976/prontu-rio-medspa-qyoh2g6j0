import { ShieldAlert } from 'lucide-react'
import ApplicationMarker from './ApplicationMarker'
import { sortSectionEntries, sortSections } from '@/lib/consultation-utils'

export default function LivePreview({ content }: { content: Record<string, any> }) {
  if (!content || Object.keys(content).length === 0) return null

  return (
    <div className="bg-white border border-primary/30 shadow-elevation mx-auto overflow-hidden relative w-full max-w-5xl mb-8 animate-fade-in-down rounded-xl">
      <div className="h-2 w-full bg-primary border-b border-primary/20"></div>
      <div className="p-8 sm:p-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-200 pb-6 mb-8 gap-4">
          <div>
            <h3 className="text-2xl font-serif text-gray-900 mb-2">
              Pré-visualização do Prontuário
            </h3>
            <p className="text-sm text-gray-500 font-medium">Sessão em andamento</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-2.5 py-1.5 rounded font-bold uppercase tracking-wider animate-pulse shadow-sm">
              <ShieldAlert className="h-3.5 w-3.5" />
              Rascunho
            </span>
          </div>
        </div>

        <div className="space-y-8 text-gray-800 leading-relaxed">
          {Object.entries(content)
            .sort(sortSections)
            .map(([sectionName, sectionData]) => (
              <section key={sectionName} className="mb-4">
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 border-b border-primary/10 pb-2">
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
                            className="mt-4 mb-6 border border-border/50 rounded-xl overflow-hidden bg-muted/10 p-5 shadow-sm"
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
                          <span className="text-gray-600 whitespace-pre-wrap">{String(value)}</span>
                        </div>
                      )
                    })}
                </div>
              </section>
            ))}
        </div>
      </div>
    </div>
  )
}
