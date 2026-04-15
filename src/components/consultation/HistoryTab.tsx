import { useEffect, useState } from 'react'
import { FileText, Calendar, Clock, ShieldCheck, User } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { useRealtime } from '@/hooks/use-realtime'
import ApplicationMarker from './ApplicationMarker'
import { sortSections, sortSectionEntries } from '@/lib/consultation-utils'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

export default function HistoryTab({ patientId }: { patientId: string }) {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecords = async () => {
    try {
      const medicalRecords = await pb.collection('medical_records').getFullList({
        filter: `patient = "${patientId}" && professional_registration != 'Sem Assinatura'`,
        sort: '-created',
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
        <Skeleton className="h-[400px] w-full max-w-5xl mx-auto rounded-md" />
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-border/50 shadow-sm max-w-5xl mx-auto">
        <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-foreground">Nenhum registro encontrado</h3>
        <p className="text-sm text-muted-foreground">
          Este paciente ainda não possui prontuários finalizados.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in-up max-w-4xl mx-auto">
      <div className="relative border-l-2 border-primary/20 ml-4 md:ml-6 space-y-8 pb-8">
        <Accordion type="multiple" className="w-full">
          {records.map((record) => (
            <div key={record.id} className="relative pl-8 md:pl-10 mb-6">
              {/* Timeline Dot */}
              <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full border-2 border-white bg-amber-500 shadow-sm z-10" />

              <AccordionItem
                value={record.id}
                className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-2 text-left pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-amber-600" />
                          {new Date(record.created).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(record.created).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
                      <User className="h-4 w-4 text-amber-600" />
                      <span className="font-medium truncate max-w-[150px] md:max-w-[200px]">
                        {record.professional_name}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-6 py-6 border-t border-gray-100 bg-gray-50/30">
                  <div className="space-y-8 text-gray-800 leading-relaxed">
                    {record.content && Object.keys(record.content).length > 0 ? (
                      Object.entries(record.content)
                        .sort(sortSections)
                        .map(([sectionName, sectionData]) => {
                          const entries = Object.entries(sectionData as Record<string, any>).sort(
                            sortSectionEntries,
                          )

                          const renderEntry = (key: string, value: any) => {
                            if (key.startsWith('_markers_')) {
                              return (
                                <div
                                  key={key}
                                  className="mt-4 mb-6 border border-border/50 rounded-xl overflow-hidden bg-white p-5 shadow-sm"
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
                          }

                          let sectionContent

                          if (sectionName === 'Exame Físico') {
                            const groups: Record<string, typeof entries> = {
                              Facial: [],
                              Cabelo: [],
                              'Tipo de Pele': [],
                              Outros: [],
                            }

                            const hairTerms = [
                              'cabelo',
                              'haste',
                              'couro',
                              'alopécia',
                              'eflúvio',
                              'tricoscopia',
                              'capilar',
                              'queda',
                              'fio',
                              'calvície',
                              'densidade',
                            ]
                            const skinTerms = [
                              'pele',
                              'fototipo',
                              'hidratação',
                              'oleosidade',
                              'espessura',
                              'textura',
                              'acne',
                              'melasma',
                              'mancha',
                              'poro',
                              'rosácea',
                              'fotoenvelhecimento',
                              'sensibilidade',
                              'cicatriz',
                              'estria',
                              'celulite',
                              'lesão',
                              'flacidez tissular',
                              'turgor',
                              'elasticidade',
                              'pigmentação',
                            ]
                            const otherTerms = [
                              'anotação',
                              'anotações',
                              'observação',
                              'observações',
                              'outros',
                              'geral',
                              'adicional',
                              'adicionais',
                            ]

                            entries.forEach(([key, value]) => {
                              if (key.startsWith('_markers_')) {
                                groups['Outros'].push([key, value])
                                return
                              }

                              const k = key.toLowerCase()
                              if (hairTerms.some((term) => k.includes(term))) {
                                groups['Cabelo'].push([key, value])
                              } else if (skinTerms.some((term) => k.includes(term))) {
                                groups['Tipo de Pele'].push([key, value])
                              } else if (otherTerms.some((term) => k.includes(term))) {
                                groups['Outros'].push([key, value])
                              } else {
                                groups['Facial'].push([key, value])
                              }
                            })

                            sectionContent = (
                              <>
                                {['Facial', 'Cabelo', 'Tipo de Pele', 'Outros'].map((groupName) => {
                                  const groupEntries = groups[groupName]
                                  if (groupEntries.length === 0) return null

                                  return (
                                    <div
                                      key={groupName}
                                      className="mb-5 bg-white p-4 rounded-lg border border-gray-100 shadow-sm"
                                    >
                                      {groupName !== 'Outros' && (
                                        <h5 className="text-sm font-semibold text-amber-600 mb-3 border-b border-amber-100 pb-2">
                                          {groupName}
                                        </h5>
                                      )}
                                      <div className="grid grid-cols-1 gap-y-4">
                                        {groupEntries.map(([key, value]) =>
                                          renderEntry(key, value),
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </>
                            )
                          } else {
                            sectionContent = (
                              <div className="grid grid-cols-1 gap-y-4 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                {entries.map(([key, value]) => renderEntry(key, value))}
                              </div>
                            )
                          }

                          return (
                            <section key={sectionName} className="mb-6">
                              <h4 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                {sectionName}
                              </h4>
                              {sectionContent}
                            </section>
                          )
                        })
                    ) : (
                      <p className="text-sm italic text-gray-400 p-4 bg-white rounded-lg border border-gray-100">
                        Prontuário encerrado sem anotações clínicas.
                      </p>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-green-700 font-medium uppercase tracking-wider bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                      <ShieldCheck className="h-4 w-4" />
                      Assinado Digitalmente
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {record.professional_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {record.professional_registration}
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </div>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
