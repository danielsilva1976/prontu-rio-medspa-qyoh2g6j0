import { BelleCliente } from './belleTypes'

export const mapBelleDataToPatients = (rawClientes: any) => {
  const validClientes: BelleCliente[] = Array.isArray(rawClientes) ? rawClientes : []

  const result: any[] = []

  validClientes.forEach((c) => {
    try {
      // Explicit mapping to application model as per API spec
      const belleIdStr = String(c.codigo || c.id || '')

      const rawDob = c.data_nascimento || c.dtNascimento || ''

      let formattedAddress = c.rua || c.endereco || ''
      if (c.numeroRua || c.numEndereco) formattedAddress += `, ${c.numeroRua || c.numEndereco}`
      if (c.bairro) formattedAddress += ` - ${c.bairro}`
      if (c.cidade) formattedAddress += ` - ${c.cidade}`
      if (c.uf || c.UF) formattedAddress += `/${c.uf || c.UF}`

      result.push({
        belleId: belleIdStr,
        name: (c.nome || '').trim() || 'Paciente sem nome',
        cpf: (c.cpf || '').trim(),
        email: (c.email || '').trim(),
        phone: (c.celular || c.telefone || '').trim(),
        dob: rawDob,
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
        status: 'active',
        sexo: c.sexo || '',
        rating: c.rating || '',
        tags: Array.isArray(c.tags)
          ? c.tags
          : typeof c.tags === 'string' && c.tags
            ? c.tags.split(',').map((t: string) => t.trim())
            : [],
      })
    } catch (err) {
      console.error('mapRecordToPatient error: Malformed record skipped', err)
    }
  })

  return result
}
