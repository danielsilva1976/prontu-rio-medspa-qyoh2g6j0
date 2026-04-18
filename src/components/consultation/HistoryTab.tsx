import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileText, Clock, ShieldCheck, User, Download } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import ApplicationMarker from './ApplicationMarker'
import { sortSectionEntries } from '@/lib/consultation-utils'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'

export default function HistoryTab({ patientId }: { patientId: string }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecords = async () => {
    try {
      const medicalRecords = await pb.collection('medical_records').getFullList({
        filter: `patient = "${patientId}" && professional_registration != 'Sem Assinatura'`,
        sort: '+appointment_date,+horario,+created',
      })

      const sortedRecords = medicalRecords.sort((a, b) => {
        const dateA = a.appointment_date ? new Date(a.appointment_date) : new Date(a.created)
        const dateB = b.appointment_date ? new Date(b.appointment_date) : new Date(b.created)

        const dayA = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate()).getTime()
        const dayB = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate()).getTime()

        if (dayA === dayB) {
          const timeA = a.horario || ''
          const timeB = b.horario || ''

          if (timeA !== timeB) {
            return timeA.localeCompare(timeB)
          }
          return new Date(a.created).getTime() - new Date(b.created).getTime()
        }

        return dayA - dayB
      })

      setRecords(sortedRecords)
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

  const scrollToRecord = (id: string) => {
    const element = document.getElementById(`record-${id}`)
    const container = document.getElementById('consultation-scroll-area')

    if (element) {
      if (container) {
        const containerRect = container.getBoundingClientRect()
        const elementRect = element.getBoundingClientRect()
        container.scrollTo({
          top: container.scrollTop + elementRect.top - containerRect.top - 24,
          behavior: 'smooth',
        })
      } else {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }

      element.classList.add('bg-amber-50')
      setTimeout(() => element.classList.remove('bg-amber-50'), 2500)
    }
  }

  useEffect(() => {
    const highlightId = searchParams.get('highlight')
    if (highlightId && !loading && records.some((r) => r.id === highlightId)) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToRecord(highlightId)
          setSearchParams(
            (prev) => {
              prev.delete('highlight')
              return prev
            },
            { replace: true },
          )
        }, 150)
      })
    }
  }, [loading, records, searchParams, setSearchParams])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse w-full max-w-[1600px] mx-auto">
        <Skeleton className="h-[400px] w-full rounded-md" />
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-border/50 shadow-sm w-full max-w-[1600px] mx-auto">
        <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-foreground">Nenhum registro encontrado</h3>
        <p className="text-sm text-muted-foreground">
          Este paciente ainda não possui prontuários finalizados.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row gap-8 xl:gap-12 animate-fade-in-up items-start">
        {/* Sidebar Timeline */}
        <div className="w-full md:w-48 lg:w-56 shrink-0 md:sticky md:top-6 flex flex-col h-[calc(100dvh-16rem)] max-h-[calc(100dvh-16rem)] pr-2 pb-4">
          <h3 className="text-xs font-bold text-gray-900 pl-2 flex shrink-0 items-center gap-2 uppercase tracking-widest border-b border-gray-200 pb-2 pt-2 sticky top-0 bg-slate-50/95 backdrop-blur-sm z-[100]">
            <Clock className="h-4 w-4 text-amber-600" /> Linha do Tempo
          </h3>
          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 pb-8 pr-2 scroll-smooth">
            <div className="relative border-l-2 border-primary/20 ml-4 space-y-6 pt-2">
              {records.map((record) => (
                <div
                  key={`timeline-${record.id}`}
                  className="relative pl-6 cursor-pointer group"
                  onClick={() => scrollToRecord(record.id)}
                >
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white bg-amber-500 shadow-sm group-hover:scale-125 transition-transform" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-amber-600 transition-colors flex items-center gap-2">
                      {(record.appointment_date
                        ? new Date(record.appointment_date)
                        : new Date(record.created)
                      ).toLocaleDateString('pt-BR')}
                      {record.horario && (
                        <span className="text-xs font-normal text-gray-500">{record.horario}</span>
                      )}
                    </span>
                    {record.professional_name && (
                      <span className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 truncate">
                        <User className="h-3 w-3" />
                        {record.professional_name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full min-w-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-12">
          {records.map((record, index) => (
            <div
              key={record.id}
              id={`record-${record.id}`}
              className={cn(
                'relative w-full scroll-mt-6 transition-all duration-300',
                index > 0 && 'border-t border-gray-200',
              )}
            >
              <div className="p-8 sm:p-12">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-200 pb-6 mb-8 gap-4">
                  <div>
                    <h3 className="text-2xl font-serif text-gray-900 mb-2">Prontuário Médico</h3>
                    <p className="text-sm text-gray-500 font-medium">
                      Realizado em{' '}
                      {(record.appointment_date
                        ? new Date(record.appointment_date)
                        : new Date(record.created)
                      ).toLocaleDateString('pt-BR')}{' '}
                      às{' '}
                      {record.horario ||
                        (record.appointment_date
                          ? new Date(record.appointment_date)
                          : new Date(record.created)
                        ).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    {record.professional_name && record.professional_registration ? (
                      <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs px-2.5 py-1.5 rounded font-bold uppercase tracking-wider shadow-sm">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Assinado Digitalmente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2.5 py-1.5 rounded font-bold uppercase tracking-wider shadow-sm">
                        <FileText className="h-3.5 w-3.5" />
                        Documento Externo
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-8 text-gray-800 leading-relaxed">
                  {record.attachment && (
                    <div className="mb-10 w-full flex flex-col gap-2">
                      <div className="w-full relative min-h-[100px] flex items-center justify-center bg-white">
                        {record.attachment.toLowerCase().endsWith('.pdf') ? (
                          <>
                            <iframe
                              src={`${pb.files.getUrl(record, record.attachment, { token: pb.authStore.token })}#toolbar=0&navpanes=0&view=FitH`}
                              title="Visualizador de PDF"
                              className="w-full min-h-[800px] border-none bg-white block"
                              onError={(e) => {
                                const target = e.target as HTMLIFrameElement
                                target.style.display = 'none'
                                const fallback = target.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                            <div
                              style={{ display: 'none' }}
                              className="flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-4 w-full"
                            >
                              <p>Não foi possível carregar o visualizador de PDF.</p>
                              <Button
                                variant="link"
                                className="text-primary"
                                onClick={() =>
                                  window.open(
                                    pb.files.getUrl(record, record.attachment, {
                                      token: pb.authStore.token,
                                    }),
                                    '_blank',
                                  )
                                }
                              >
                                Tentar abrir documento em nova aba
                              </Button>
                            </div>
                          </>
                        ) : record.attachment
                            .toLowerCase()
                            .match(/\.(jpeg|jpg|gif|png|webp|bmp)$/) ? (
                          <>
                            <img
                              src={pb.files.getUrl(record, record.attachment, {
                                token: pb.authStore.token,
                              })}
                              alt="Documento Anexado"
                              className="w-full h-auto object-contain border-none bg-white opacity-0 transition-opacity duration-500 block"
                              onLoad={(e) => {
                                const target = e.target as HTMLImageElement
                                target.classList.remove('opacity-0')
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const fallback = target.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                            <div
                              style={{ display: 'none' }}
                              className="flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-4 w-full"
                            >
                              <p>Não foi possível carregar a imagem.</p>
                              <Button
                                variant="link"
                                className="text-primary"
                                onClick={() =>
                                  window.open(
                                    pb.files.getUrl(record, record.attachment, {
                                      token: pb.authStore.token,
                                    }),
                                    '_blank',
                                  )
                                }
                              >
                                Tentar abrir imagem em nova aba
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-4 w-full">
                            <p>Formato de arquivo não suportado para visualização em linha.</p>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="link"
                          size="sm"
                          className="text-muted-foreground hover:text-primary px-0 h-auto py-1"
                          onClick={() =>
                            window.open(
                              pb.files.getUrl(record, record.attachment, {
                                token: pb.authStore.token,
                              }),
                              '_blank',
                            )
                          }
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Baixar anexo
                        </Button>
                      </div>
                    </div>
                  )}

                  {record.content &&
                  typeof record.content === 'object' &&
                  !Array.isArray(record.content) &&
                  Object.entries(record.content).filter(
                    ([_, data]) =>
                      typeof data === 'object' && data !== null && !Array.isArray(data),
                  ).length > 0 ? (
                    Object.entries(record.content)
                      .filter(
                        ([_, sectionData]) =>
                          typeof sectionData === 'object' &&
                          sectionData !== null &&
                          !Array.isArray(sectionData),
                      )
                      .sort((a, b) => {
                        const order = [
                          'Anamnese',
                          'Exame Físico',
                          'Procedimentos Realizados',
                          'Evolução',
                        ]
                        const idxA = order.indexOf(a[0])
                        const idxB = order.indexOf(b[0])
                        if (idxA !== -1 && idxB !== -1) return idxA - idxB
                        if (idxA !== -1) return -1
                        if (idxB !== -1) return 1
                        return a[0].localeCompare(b[0])
                      })
                      .map(([sectionName, sectionData]) => {
                        const entries = Object.entries(sectionData as Record<string, any>).sort(
                          sortSectionEntries,
                        )

                        const renderEntry = (key: string, value: any) => {
                          if (key.startsWith('_markers_')) {
                            return (
                              <div key={key} className="mt-4 mb-6">
                                <span className="font-semibold text-gray-700 block mb-4">
                                  Mapeamento Visual - {value.area}:
                                </span>
                                <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
                                  <ApplicationMarker
                                    area={value.area}
                                    points={value.points || []}
                                    vectors={value.vectors || []}
                                    lines={value.lines || []}
                                    isSigned={true}
                                    onChange={() => {}}
                                  />
                                </div>
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
                                  <div key={groupName} className="mb-5">
                                    {groupName !== 'Outros' && (
                                      <h5 className="text-sm font-semibold text-amber-600 mb-3 border-b border-amber-100 pb-1">
                                        {groupName}
                                      </h5>
                                    )}
                                    <div className="grid grid-cols-1 gap-y-3">
                                      {groupEntries.map(([key, value]) => renderEntry(key, value))}
                                    </div>
                                  </div>
                                )
                              })}
                            </>
                          )
                        } else {
                          sectionContent = (
                            <div className="grid grid-cols-1 gap-y-3">
                              {entries.map(([key, value]) => renderEntry(key, value))}
                            </div>
                          )
                        }

                        return (
                          <section key={sectionName} className="mb-4">
                            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3 border-b border-amber-600/20 pb-2">
                              {sectionName}
                            </h4>
                            {sectionContent}
                          </section>
                        )
                      })
                  ) : !record.attachment ? (
                    <p className="text-sm italic text-gray-400 p-4 bg-muted/10 rounded-lg border border-gray-100">
                      Prontuário encerrado sem anotações clínicas.
                    </p>
                  ) : null}
                </div>

                {record.professional_name && record.professional_registration && (
                  <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col items-center justify-center gap-2">
                    <div className="w-64 h-px bg-gray-400 mb-2"></div>
                    <div className="text-center">
                      <p className="text-base font-semibold text-gray-900">
                        {record.professional_name}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {record.professional_registration}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
