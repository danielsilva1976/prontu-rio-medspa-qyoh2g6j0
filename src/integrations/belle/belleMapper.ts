import { BelleCliente, BelleAgendamento } from './belleTypes'

export const mapBelleDataToPatients = (rawClientes: any, rawAgendamentos: any) => {
  const now = new Date()
  const validClientes: BelleCliente[] = Array.isArray(rawClientes) ? rawClientes : []
  const validAgendamentos: BelleAgendamento[] = Array.isArray(rawAgendamentos)
    ? rawAgendamentos
    : []

  return validClientes.map((c) => {
    const belleIdStr = String(c.codigo || c.id || '')
    const clientAppts = validAgendamentos.filter(
      (a) =>
        (a.cpf_cliente && c.cpf && a.cpf_cliente === c.cpf) ||
        (a.cliente_id && String(a.cliente_id) === belleIdStr),
    )

    const rawDob = c.dtNascimento || c.data_nascimento
    let lastVisit = rawDob ? new Date(rawDob).toISOString().split('T')[0] : '2023-01-01'
    let nextAppointment: string | null = null
    const procedures = new Set<string>()

    clientAppts.forEach((a) => {
      if (a.servico) procedures.add(a.servico)
      if (a.data) {
        const apptDate = new Date(`${a.data}T${a.hora_inicio || '00:00'}:00`)
        if (!isNaN(apptDate.getTime())) {
          if (apptDate < now) {
            if (
              !lastVisit ||
              isNaN(new Date(lastVisit).getTime()) ||
              apptDate > new Date(lastVisit)
            )
              lastVisit = a.data
          } else {
            if (!nextAppointment || apptDate < new Date(nextAppointment))
              nextAppointment = `${a.data}T${a.hora_inicio || '00:00'}:00`
          }
        }
      }
    })

    let formattedAddress = c.rua || c.endereco || ''
    if (c.numeroRua || c.numEndereco) formattedAddress += `, ${c.numeroRua || c.numEndereco}`
    if (c.bairro) formattedAddress += ` - ${c.bairro}`
    if (c.cidade) formattedAddress += ` - ${c.cidade}`
    if (c.uf || c.UF) formattedAddress += `/${c.uf || c.UF}`

    return {
      belleId: belleIdStr,
      name: (c.nome || '').trim() || 'Paciente sem nome',
      cpf: (c.cpf || '').trim(),
      email: (c.email || '').trim(),
      phone: (c.celular || c.telefone || '').trim(),
      dob: rawDob,
      lastVisit,
      nextAppointment,
      procedures: Array.from(procedures),
      history: c.observacao || c.historico_clinico || '',
      rg: c.rg || '',
      profissao: c.profissao || '',
      estado_civil: c.estado_civil || '',
      endereco: formattedAddress.trim(),
      rua: c.rua || '',
      numeroRua: c.numeroRua || '',
      bairro: c.bairro || '',
      cidade: c.cidade || '',
      uf: c.uf || c.UF || '',
      cep: c.cep || '',
      temperatura: c.temperatura || '',
      classificacao: c.classificacao || '',
      status: nextAppointment ? 'scheduled' : 'active',
      sexo: c.sexo || '',
      rating: c.rating || '',
      tags: Array.isArray(c.tags)
        ? c.tags
        : typeof c.tags === 'string' && c.tags
          ? c.tags.split(',').map((t: string) => t.trim())
          : [],
    }
  })
}
