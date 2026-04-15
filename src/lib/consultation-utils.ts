export const FIELD_ORDER = [
  'queixa',
  'Queixa Principal',
  'ciclo',
  'Ciclo menstrual',
  'contraceptivos',
  'Uso de contraceptivos',
  'hormonais',
  'Alterações hormonais (reposição)',
  'menarca',
  'Menarca, pré-menopausa e menopausa',
  'cirurgias_gineco',
  'Cirurgias',
  'atopias',
  'Atopias (rinite, bronquite e outras)',
  'alergias_meds',
  'Alergias medicamentosas',
  'alergias_cosmeticos',
  'Alergias a cosméticos, perfumes, tinturas...',
  'tipo_cirurgia',
  'Tipo de cirurgia e datas',
  'cirurgias_plasticas',
  'Cirurgias plásticas - tipos e datas',
  'marcapasso',
  'Marcapasso',
  'proteses',
  'Uso de próteses',
  'laser',
  'Laser',
  'peeling',
  'Peeling',
  'preenchimentos',
  'Preenchimentos',
  'toxina',
  'Toxina botulínica',
  'tratamentos_derm',
  'Tratamentos dermatológicos',
  'farmacos_ant',
  'Fármacos de uso anterior',
  'farmacos_atual',
  'Fármacos de uso atual',
  'herpes',
  'Herpes labial e genital',
  'tratamentos_esteticos',
  'Tratamentos estéticos anteriores',
  'cosmeticos',
  'Cosméticos em uso',
  'habitos',
  'Hábitos alimentares',
  'atividade',
  'Atividade física',
  'sol',
  'Exposição solar',
  'tabagismo',
  'Tabagismo',
  'patologias',
  'Patologias',
  'medicacoes',
  'Medicações em uso',
]

export const sortSectionEntries = (a: [string, any], b: [string, any]) => {
  if (a[0].startsWith('_markers_') && !b[0].startsWith('_markers_')) return 1
  if (!a[0].startsWith('_markers_') && b[0].startsWith('_markers_')) return -1

  const idxA = FIELD_ORDER.indexOf(a[0])
  const idxB = FIELD_ORDER.indexOf(b[0])

  if (idxA !== -1 && idxB !== -1) return idxA - idxB
  if (idxA !== -1) return -1
  if (idxB !== -1) return 1
  return 0
}

export const SECTION_ORDER = ['Anamnese', 'Exame Físico', 'Procedimentos Realizados', 'Evolução']

export const sortSections = (a: [string, any], b: [string, any]) => {
  const idxA = SECTION_ORDER.indexOf(a[0])
  const idxB = SECTION_ORDER.indexOf(b[0])

  if (idxA !== -1 && idxB !== -1) return idxA - idxB
  if (idxA !== -1) return -1
  if (idxB !== -1) return 1
  return 0
}
