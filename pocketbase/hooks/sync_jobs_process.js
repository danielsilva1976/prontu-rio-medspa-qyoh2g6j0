onRecordAfterCreateSuccess((e) => {
  const record = e.record
  if (record.get('status') !== 'pending') {
    e.next()
    return
  }

  let token =
    $secrets.get('BELLE_TOKEN') || $os.getenv('BELLE_TOKEN') || $os.getenv('VITE_BELLE_TOKEN') || ''
  let cleanToken = String(token)
    .replace(/^["']|["']$/g, '')
    .trim()
  if (cleanToken.toLowerCase().startsWith('bearer ')) {
    cleanToken = cleanToken.substring(7).trim()
  }
  cleanToken = cleanToken.replace(/\s+/g, '')

  if (!cleanToken) {
    record.set('status', 'failed')
    record.set(
      'error_log',
      'Erro crítico: Credencial BELLE_TOKEN não encontrada no ambiente de execução.',
    )
    $app.saveNoValidate(record)
    e.next()
    return
  }

  const jobId = record.id
  const estab = record.get('estabelecimento') || '1'

  try {
    const existing = $app.findRecordsByFilter(
      'sync_jobs',
      `(status="processing" || status="pending") && estabelecimento="${estab}" && id!="${jobId}"`,
      '-created',
      10,
      0,
    )
    if (existing && existing.length > 0) {
      let activeExists = false
      const now = new Date().getTime()
      for (let i = 0; i < existing.length; i++) {
        const ex = existing[i]
        const updatedAtStr = ex.get('updated')
        const updatedAt = updatedAtStr ? new Date(updatedAtStr.replace(' ', 'T')).getTime() : now

        if (now - updatedAt > 15 * 60 * 1000) {
          ex.set('status', 'failed')
          ex.set(
            'error_log',
            (ex.get('error_log') || '') + '\nSincronização interrompida devido a tempo limite.',
          )
          $app.saveNoValidate(ex)
        } else {
          activeExists = true
        }
      }

      if (activeExists) {
        record.set('status', 'failed')
        record.set('error_log', 'Já existe uma sincronização ativa para este estabelecimento.')
        $app.saveNoValidate(record)
        e.next()
        return
      }
    }
  } catch (err) {
    // ignore
  }

  record.set('status', 'processing')
  $app.saveNoValidate(record)

  try {
    let lastSync = null
    try {
      const setting = $app.findFirstRecordByData('app_settings', 'key', 'last_successful_sync')
      lastSync = setting.get('value')
    } catch (e) {}

    let dateFilter = ''
    if (lastSync) {
      const d = new Date(lastSync)
      d.setDate(d.getDate() - 1)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      dateFilter = `&dataAtualizacao=${yyyy}-${mm}-${dd}`
    }

    let currentJob
    try {
      currentJob = $app.findRecordById('sync_jobs', jobId)
    } catch (e) {
      e.next()
      return
    }

    let page = currentJob.get('last_processed_page') || 0
    if (page <= 0) page = 1

    let totalProcessed = currentJob.get('records_processed') || 0
    let totalExpected = currentJob.get('total_records_expected') || 0

    const patientsCol = $app.findCollectionByNameOrId('patients')
    let currentLog = currentJob.get('error_log') || ''

    let hasMore = true
    while (hasMore && page <= 1000) {
      let jobCheck
      try {
        jobCheck = $app.findRecordById('sync_jobs', jobId)
        if (jobCheck.get('status') !== 'processing') {
          break
        }
      } catch (e) {
        break
      }

      let url = `https://app.bellesoftware.com.br/api/release/controller/IntegracaoExterna/v1.0/clientes?codEstab=${estab}&pagina=${page}${dateFilter}`

      let resCl
      try {
        resCl = $http.send({
          url: url,
          method: 'GET',
          headers: {
            Authorization: cleanToken,
            'x-sync-token': cleanToken,
            Accept: 'application/json',
          },
          timeout: 60,
        })
      } catch (reqErr) {
        throw new Error(`Belle API Timeout ou erro de rede: ${reqErr.message}`)
      }

      if (resCl.statusCode !== 200) {
        if (resCl.statusCode === 401 || resCl.statusCode === 403) {
          throw new Error(`Acesso Negado (HTTP ${resCl.statusCode}): Token inválido.`)
        }
        throw new Error(
          `Erro na API Belle (HTTP ${resCl.statusCode}): ${resCl.string || 'Erro desconhecido'}`,
        )
      }

      let data = null
      try {
        data = resCl.json
      } catch (e) {
        throw new Error(`Erro ao processar JSON: ${resCl.string}`)
      }

      let clientes = []
      if (Array.isArray(data)) {
        clientes = data
      } else if (data && typeof data === 'object') {
        clientes = data.pacientes || data.clientes || data.dados || []
      }

      if (!Array.isArray(clientes) || clientes.length === 0) {
        hasMore = false
        break
      }

      let pageErrors = 0

      for (let i = 0; i < clientes.length; i++) {
        const c = clientes[i]
        const belleIdStr = String(c.codigo || c.id || '')
        if (!belleIdStr) continue

        const patientName = c.nome ? String(c.nome).trim() : 'Paciente sem nome'

        try {
          let formattedAddress = c.rua || c.endereco || ''
          if (c.numeroRua || c.numEndereco) formattedAddress += `, ${c.numeroRua || c.numEndereco}`
          if (c.bairro) formattedAddress += ` - ${c.bairro}`
          if (c.cidade) formattedAddress += ` - ${c.cidade}`
          if (c.uf || c.UF) formattedAddress += `/${c.uf || c.UF}`

          let tagsArr = []
          if (Array.isArray(c.tags)) {
            tagsArr = c.tags.filter(Boolean).map(String)
          } else if (typeof c.tags === 'string' && c.tags) {
            tagsArr = c.tags
              .split(',')
              .map((t) => String(t).trim())
              .filter(Boolean)
          }

          const payload = {
            external_id: belleIdStr,
            name: patientName,
            cpf: c.cpf ? String(c.cpf).trim() : '',
            email: c.email ? String(c.email).trim() : '',
            phone: c.celular || c.telefone ? String(c.celular || c.telefone).trim() : '',
            dob: c.data_nascimento || c.dtNascimento || '',
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
            tags: tagsArr.join(', '),
          }

          let existingRec = null
          try {
            existingRec = $app.findFirstRecordByData('patients', 'external_id', belleIdStr)
          } catch (_) {}

          if (existingRec) {
            let changed = false
            for (let key in payload) {
              if (payload[key] !== undefined) {
                const oldVal = existingRec.get(key)
                const newVal = payload[key]
                if (String(oldVal || '') !== String(newVal || '')) {
                  existingRec.set(key, newVal)
                  changed = true
                }
              }
            }
            if (changed) {
              $app.saveNoValidate(existingRec)
            }
          } else {
            const newRecord = new Record(patientsCol)
            for (let key in payload) {
              if (payload[key] !== undefined) newRecord.set(key, payload[key])
            }
            $app.saveNoValidate(newRecord)
          }
        } catch (itemErr) {
          pageErrors++
          currentLog += `\n[Erro] ID ${belleIdStr}: ${itemErr.message || String(itemErr)}`
        }
      }

      totalProcessed += clientes.length

      try {
        const jobToUpdate = $app.findRecordById('sync_jobs', jobId)
        jobToUpdate.set('records_processed', totalProcessed)
        jobToUpdate.set('last_processed_page', page)

        if (pageErrors > 0) {
          if (currentLog.length > 10000) currentLog = currentLog.slice(-10000)
          jobToUpdate.set('error_log', currentLog.trim())
        }

        if (!totalExpected || totalExpected === 0) {
          if (
            data &&
            typeof data === 'object' &&
            (data.total || data.totalRegistros || data.totalCount || data.quantidade)
          ) {
            totalExpected = Number(
              data.total || data.totalRegistros || data.totalCount || data.quantidade || 0,
            )
            if (totalExpected > 0) jobToUpdate.set('total_records_expected', totalExpected)
          }
        }

        $app.saveNoValidate(jobToUpdate)
      } catch (e) {}

      if (clientes.length < 50) {
        hasMore = false
      } else {
        page++
      }
    }

    try {
      const finalJob = $app.findRecordById('sync_jobs', jobId)
      if (finalJob.get('status') === 'processing') {
        finalJob.set('status', 'completed')
        $app.saveNoValidate(finalJob)
      }

      let setting
      try {
        setting = $app.findFirstRecordByData('app_settings', 'key', 'last_successful_sync')
      } catch (e) {
        const col = $app.findCollectionByNameOrId('app_settings')
        setting = new Record(col)
        setting.set('key', 'last_successful_sync')
      }
      setting.set('value', new Date().toISOString())
      $app.saveNoValidate(setting)
    } catch (e) {}
  } catch (err) {
    try {
      const job = $app.findRecordById('sync_jobs', jobId)
      job.set('status', 'failed')
      let log = job.get('error_log') || ''
      log += '\nFalha crítica: ' + String(err.message || err)
      if (log.length > 10000) log = log.slice(-10000)
      job.set('error_log', log.trim())
      $app.saveNoValidate(job)
    } catch (e) {}
  }

  e.next()
}, 'sync_jobs')
