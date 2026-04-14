import { useEffect, useState } from 'react'
import { FileText, Calendar, Clock, ShieldCheck } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { useRealtime } from '@/hooks/use-realtime'
import ApplicationMarker from './ApplicationMarker'

export default function HistoryTab({ patientId }: { patientId: string }) {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecords = async () => {
    try {
      const medicalRecords = await pb.collection('medical_records').getFullList({
        filter: `patient = "${patientId}"`,
        sort: '+created',
      })
      setRecords(medicalRecords)
    } catch (error) {
      console.error('Error fetching medical records', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [patientId])

  useRealtime('medical_records', () => {
    fetchRecords()
  })

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-[400px] w-full max-w-[800px] mx-auto rounded-md" />
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-border/50 shadow-sm max-w-[800px] mx-auto">
        <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-foreground">Nenhum registro encontrado</h3>
        <p className="text-sm text-muted-foreground">
          Este paciente ainda não possui prontuários finalizados.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="space-y-8">
        {records.map((record) => (
          <div
            key={record.id}
            className="bg-white border border-gray-200 shadow-sm mx-auto overflow-hidden relative"
            style={{ maxWidth: '800px' }}
          >
            {/* Top decorative edge to look like paper */}
            <div className="h-2 w-full bg-primary/10 border-b border-gray-100"></div>

            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-200 pb-6 mb-8 gap-4">
                <div>
                  <h3 className="text-2xl font-serif text-gray-900 mb-2">Prontuário Médico</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {new Date(record.created).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {new Date(record.created).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs px-2.5 py-1 rounded font-medium uppercase tracking-wider">
                    <ShieldCheck className="h-3 w-3" />
                    Documento Original
                  </span>
                </div>
              </div>

              <div className="space-y-8 text-gray-800 leading-relaxed">
                {record.content && Object.keys(record.content).length > 0 ? (
                  Object.entries(record.content).map(([sectionName, sectionData]) => (
                    <section key={sectionName} className="mb-6">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">
                        {sectionName}
                      </h4>
                      <div className="grid grid-cols-1 gap-y-3">
                        {Object.entries(sectionData as Record<string, any>).map(([key, value]) => {
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
                              <span className="font-semibold text-gray-700 block mb-0.5">
                                {key}:
                              </span>
                              <span className="text-gray-600 whitespace-pre-wrap">
                                {String(value)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  ))
                ) : (
                  <p className="text-sm italic text-gray-400">
                    Prontuário encerrado sem anotações clínicas.
                  </p>
                )}
              </div>

              <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col items-center sm:items-end text-center sm:text-right">
                <div className="w-64 border-b border-gray-800 mb-3"></div>
                <p className="text-sm font-semibold text-gray-900">
                  Assinado por: {record.professional_name}
                </p>
                <p className="text-xs text-gray-500 mt-1">{record.professional_registration}</p>
                <div className="flex items-center gap-1 mt-3 text-[10px] text-green-700 font-medium uppercase tracking-wider bg-green-50 px-2 py-1 rounded">
                  <ShieldCheck className="h-3 w-3" />
                  Assinatura Digital Validada
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
