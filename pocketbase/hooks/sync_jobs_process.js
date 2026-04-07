onRecordAfterCreateSuccess((e) => {
  const record = e.record
  if (record.get('status') !== 'pending') {
    e.next()
    return
  }

  const jobId = record.id
  const estab = record.get('estabelecimento') || '1'

  try {
    const existing = $app.findRecordsByFilter(
      'sync_jobs',
      `(status="processing" || status="pending") && estabelecimento="${estab}" && id!="${jobId}"`,
      '',
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

        if (now - updatedAt > 5 * 60 * 1000) {
          ex.set('status', 'failed')
          ex.set(
            'error_log',
            'Sincronização interrompida devido a tempo limite na resposta do servidor. (Stuck process)',
          )
          $app.saveNoValidate(ex)
        } else {
          activeExists = true
        }
      }

      if (activeExists) {
        record.set('status', 'failed')
        record.set('error_log', 'A sync job is already processing for this establishment.')
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

  // Detach the heavy lifting
  setTimeout(() => {
    try {
      let token =
        $secrets.get('BELLE_TOKEN') || $os.getenv('BELLE_TOKEN') || $os.getenv('VITE_BELLE_TOKEN')
      if (!token) {
        throw new Error(
          'Valid technical credential required: BELLE_TOKEN is missing in secrets or environment variables.',
        )
      }

      let cleanToken = token.replace(/^["']|["']$/g, '').trim()
      if (cleanToken.toLowerCase().startsWith('bearer ')) {
        cleanToken = cleanToken.substring(7).trim()
      }

      // 1. Fetch all appointments to compute lastVisit / nextAppointment locally
      let agendamentos = []
      try {
        const resAg = $http.send({
          url: `https://app.bellesoftware.com.br/api/release/controller/IntegracaoExterna/v1.0/agendamentos?codEstab=${estab}`,
          method: 'GET',
          headers: {
            Authorization: cleanToken,
            'x-sync-token': cleanToken,
            Accept: 'application/json',
          },
          timeout: 120,
        })
        if (resAg.statusCode === 401) {
          throw new Error(
            `Valid technical credential required (HTTP 401): ${resAg.string || 'Unauthorized'}`,
          )
        }
        if (resAg.statusCode === 200 && resAg.json) {
          agendamentos = Array.isArray(resAg.json)
            ? resAg.json
            : resAg.json.agendamentos || resAg.json.dados || []
        }
      } catch (err) {
        if (err.message && err.message.includes('Token inválido')) {
          throw err
        }
        console.log('Warning: Error fetching agendamentos in hook: ', err)
      }

      let page = 0
      let totalProcessed = 0
      const patientsCol = $app.findCollectionByNameOrId('patients')
      const apptsCol = $app.findCollectionByNameOrId('appointments')

      const processPage = () => {
        try {
          // Verify job is still active, to prevent detached ghost processes
          try {
            const currentJob = $app.findRecordById('sync_jobs', jobId)
            if (currentJob.get('status') !== 'processing') {
              console.log('Job no longer processing, aborting batch loop.')
              return
            }
          } catch (e) {
            return
          }

          if (page >= 150) {
            const job = $app.findRecordById('sync_jobs', jobId)
            job.set('status', 'completed')
            $app.saveNoValidate(job)
            return
          }

          const resCl = $http.send({
            url: `https://app.bellesoftware.com.br/api/release/controller/IntegracaoExterna/v1.0/clientes?codEstab=${estab}&pagina=${page}`,
            method: 'GET',
            headers: {
              Authorization: cleanToken,
              'x-sync-token': cleanToken,
              Accept: 'application/json',
            },
            timeout: 60,
          })

          if (resCl.statusCode !== 200) {
            if (resCl.statusCode === 401) {
              throw new Error(
                `Valid technical credential required (HTTP 401): ${resCl.string || 'Unauthorized'}`,
              )
            }
            throw new Error(
              `Belle API Error ${resCl.statusCode}: ${resCl.string || 'Unknown error'}`,
            )
          }

          const data = resCl.json
          const clientes = Array.isArray(data)
            ? data
            : data?.pacientes || data?.clientes || data?.dados || []

          if (!clientes || clientes.length === 0) {
            const job = $app.findRecordById('sync_jobs', jobId)
            job.set('status', 'completed')
            $app.saveNoValidate(job)
            return
          }

          const now = new Date()

          for (let i = 0; i < clientes.length; i++) {
            const c = clientes[i]
            const belleIdStr = String(c.codigo || c.id || '')
            if (!belleIdStr) continue

            const clientAppts = agendamentos.filter(
              (a) =>
                (a.cpf_cliente && c.cpf && a.cpf_cliente === c.cpf) ||
                (a.cliente_id && String(a.cliente_id) === belleIdStr),
            )

            let lastVisit = ''
            let nextAppointment = ''
            const proceduresSet = {}

            clientAppts.forEach((a) => {
              if (a.servico) proceduresSet[a.servico] = true
              if (a.data) {
                const apptDate = new Date(`${a.data}T${a.hora_inicio || '00:00'}:00`)
                if (!isNaN(apptDate.getTime())) {
                  if (apptDate < now) {
                    if (
                      !lastVisit ||
                      isNaN(new Date(lastVisit).getTime()) ||
                      apptDate > new Date(lastVisit)
                    ) {
                      lastVisit = a.data
                    }
                  } else {
                    if (!nextAppointment || apptDate < new Date(nextAppointment)) {
                      nextAppointment = `${a.data}T${a.hora_inicio || '00:00'}:00`
                    }
                  }
                }
              }
            })

            const procedures = Object.keys(proceduresSet).filter(Boolean).map(String)
            let formattedAddress = c.rua || c.endereco || ''
            if (c.numeroRua || c.numEndereco)
              formattedAddress += `, ${c.numeroRua || c.numEndereco}`
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
              name: (c.nome || '').trim() || 'Paciente sem nome',
              cpf: (c.cpf || '').trim(),
              email: (c.email || '').trim(),
              phone: (c.celular || c.telefone || '').trim(),
              dob: c.data_nascimento || c.dtNascimento || '',
              lastVisit: lastVisit,
              nextAppointment: nextAppointment,
              procedures: procedures, // Array directly, PocketBase manages JSON encoding
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
              tags: tagsArr.join(', '), // Ensure tags are stored as readable text instead of stringified array
            }

            let patientId = null
            try {
              const existing = $app.findFirstRecordByData('patients', 'external_id', belleIdStr)

              // Database sanitization happens automatically as explicit string fields overwrite any corrupted state
              for (let key in payload) {
                existing.set(key, payload[key])
              }
              $app.saveNoValidate(existing)
              patientId = existing.id
            } catch (err) {
              const newRecord = new Record(patientsCol)
              for (let key in payload) newRecord.set(key, payload[key])
              $app.saveNoValidate(newRecord)
              patientId = newRecord.id
            }

            if (patientId) {
              for (let j = 0; j < clientAppts.length; j++) {
                const a = clientAppts[j]
                const apptExtId = String(a.id || a.codigo || `${belleIdStr}-${j}`)
                const apptPayload = {
                  external_id: apptExtId,
                  patient: patientId,
                  appointment_date: a.data ? `${a.data} 00:00:00.000Z` : '',
                  status: a.status || '',
                  service_name: a.servico || '',
                  professional: a.profissional || '',
                }
                try {
                  const exAppt = $app.findFirstRecordByData(
                    'appointments',
                    'external_id',
                    apptExtId,
                  )
                  for (let key in apptPayload) exAppt.set(key, apptPayload[key])
                  $app.saveNoValidate(exAppt)
                } catch (e) {
                  const newAppt = new Record(apptsCol)
                  for (let key in apptPayload) newAppt.set(key, apptPayload[key])
                  $app.saveNoValidate(newAppt)
                }
              }
            }
          }

          totalProcessed += clientes.length

          try {
            const jobToUpdate = $app.findRecordById('sync_jobs', jobId)
            jobToUpdate.set('records_processed', totalProcessed)
            jobToUpdate.set('last_processed_page', page)
            if (!jobToUpdate.get('total_records_expected')) {
              jobToUpdate.set('total_records_expected', 6950)
            }
            $app.saveNoValidate(jobToUpdate)
          } catch (e) {}

          if (clientes.length < 50) {
            const job = $app.findRecordById('sync_jobs', jobId)
            job.set('status', 'completed')
            $app.saveNoValidate(job)
          } else {
            page++
            setTimeout(processPage, 500) // Yield to VM and prevent timeouts
          }
        } catch (err) {
          console.log('Background Sync Batch Error:', err)
          try {
            const job = $app.findRecordById('sync_jobs', jobId)
            job.set('status', 'failed')
            job.set('error_log', 'Batch Error: ' + String(err.message || err))
            $app.saveNoValidate(job)
          } catch (e) {}
        }
      }

      // Start processing batches
      processPage()
    } catch (err) {
      console.log('Background Sync Init Error:', err)
      try {
        const job = $app.findRecordById('sync_jobs', jobId)
        job.set('status', 'failed')
        job.set('error_log', 'Init Error: ' + String(err.message || err))
        $app.saveNoValidate(job)
      } catch (e) {}
    }
  }, 100)

  e.next()
}, 'sync_jobs')
