onRecordAfterCreateSuccess((e) => {
  const record = e.record
  if (record.get('status') !== 'pending' && record.get('status') !== 'processing') {
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

        if (now - updatedAt > 10 * 60 * 1000) {
          ex.set('status', 'error')
          ex.set(
            'error_log',
            (ex.get('error_log') || '') +
              '\nSincronização interrompida devido a tempo limite na resposta do servidor.',
          )
          $app.save(ex)
        } else {
          activeExists = true
        }
      }

      if (activeExists) {
        record.set('status', 'error')
        record.set(
          'error_log',
          'Já existe uma sincronização ativa para este estabelecimento. Aguarde a conclusão.',
        )
        $app.save(record)
        e.next()
        return
      }
    }
  } catch (err) {
    // ignore
  }

  record.set('status', 'processing')
  $app.save(record)

  // Detach the heavy lifting
  setTimeout(() => {
    try {
      let token =
        $secrets.get('BELLE_TOKEN') || $os.getenv('BELLE_TOKEN') || $os.getenv('VITE_BELLE_TOKEN')
      if (!token) {
        throw new Error(
          'A credencial técnica (BELLE_TOKEN) não foi encontrada nas variáveis de ambiente ou secrets.',
        )
      }

      let cleanToken = token.replace(/['"]/g, '').replace(/\s+/g, '')

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

      const currentJob = $app.findRecordById('sync_jobs', jobId)
      let page = currentJob.get('last_processed_page') || 0
      let totalProcessed = currentJob.get('records_processed') || 0

      let totalExpected = currentJob.get('total_records_expected') || 0
      if (page === 0 && totalExpected === 0) {
        try {
          const countRes = $http.send({
            url: `https://app.bellesoftware.com.br/api/release/controller/IntegracaoExterna/v1.0/clientes?codEstab=${estab}&pagina=1${dateFilter}`,
            method: 'GET',
            headers: {
              Authorization: cleanToken,
              'x-sync-token': cleanToken,
              Accept: 'application/json',
            },
            timeout: 30,
          })
          const cData = countRes.json

          if (cData && !Array.isArray(cData)) {
            totalExpected = Number(
              cData.total ||
                cData.totalRegistros ||
                cData.totalCount ||
                cData.total_registros ||
                cData.quantidade ||
                0,
            )
          }

          if (!totalExpected || isNaN(totalExpected)) {
            const specificCount = $http.send({
              url: `https://app.bellesoftware.com.br/api/release/controller/IntegracaoExterna/v1.0/clientes/count?codEstab=${estab}${dateFilter}`,
              method: 'GET',
              headers: {
                Authorization: cleanToken,
                'x-sync-token': cleanToken,
                Accept: 'application/json',
              },
              timeout: 30,
            })
            const scData = specificCount.json
            if (scData) {
              totalExpected = Number(
                scData.total ||
                  scData.count ||
                  scData.total_registros ||
                  (typeof scData === 'number' ? scData : 0),
              )
            }
          }

          if (totalExpected > 0) {
            const job = $app.findRecordById('sync_jobs', jobId)
            job.set('total_records_expected', totalExpected)
            $app.save(job)
          }
        } catch (err) {
          console.log('Initial count request error:', err)
        }
      }

      const patientsCol = $app.findCollectionByNameOrId('patients')

      const processPage = () => {
        try {
          try {
            const jobCheck = $app.findRecordById('sync_jobs', jobId)
            if (jobCheck.get('status') !== 'processing') {
              console.log('Job no longer processing, aborting batch loop.')
              return
            }
          } catch (e) {
            return
          }

          if (page >= 1000) {
            const job = $app.findRecordById('sync_jobs', jobId)
            job.set('status', 'completed')
            $app.save(job)
            saveLastSync()
            return
          }

          const resCl = $http.send({
            url: `https://app.bellesoftware.com.br/api/release/controller/IntegracaoExterna/v1.0/clientes?codEstab=${estab}&pagina=${page}${dateFilter}`,
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
                `Acesso Negado (HTTP 401): O token configurado é inválido. Verifique suas credenciais.`,
              )
            }
            throw new Error(
              `Erro na API Belle (HTTP ${resCl.statusCode}): ${resCl.string || 'Erro desconhecido'}`,
            )
          }

          const data = resCl.json
          let clientes = []
          if (Array.isArray(data)) {
            clientes = data
          } else if (data && typeof data === 'object') {
            clientes = data.pacientes || data.clientes || data.dados || []
          }

          if (!Array.isArray(clientes) || clientes.length === 0) {
            const job = $app.findRecordById('sync_jobs', jobId)
            job.set('status', 'completed')
            $app.save(job)
            saveLastSync()
            return
          }

          for (let i = 0; i < clientes.length; i++) {
            try {
              const c = clientes[i]
              const belleIdStr = String(c.codigo || c.id || '')
              if (!belleIdStr) continue

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

              const patientName = c.nome ? String(c.nome).trim() : ''
              const payload = {
                external_id: belleIdStr,
                name: patientName || 'Paciente sem nome',
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

              let existing = null
              try {
                existing = $app.findFirstRecordByData('patients', 'external_id', belleIdStr)
              } catch (_) {}

              try {
                if (existing) {
                  for (let key in payload) {
                    if (payload[key] !== undefined) existing.set(key, payload[key])
                  }
                  $app.save(existing)
                } else {
                  const newRecord = new Record(patientsCol)
                  for (let key in payload) {
                    if (payload[key] !== undefined) newRecord.set(key, payload[key])
                  }
                  $app.save(newRecord)
                }
              } catch (saveErr) {
                throw new Error(
                  `Failed to create/update patient ${belleIdStr}: ${saveErr.message || saveErr}`,
                )
              }
            } catch (itemErr) {
              try {
                const jobToUpdate = $app.findRecordById('sync_jobs', jobId)
                let currentLog = jobToUpdate.get('error_log') || ''
                currentLog += `\nErro cliente ${clientes[i]?.codigo || '?'}: ${itemErr.message || itemErr}`
                if (currentLog.length > 2000) currentLog = currentLog.slice(-2000)
                jobToUpdate.set('error_log', currentLog.trim())
                $app.save(jobToUpdate)
              } catch (e) {}
            }
          }

          totalProcessed += clientes.length

          try {
            const jobToUpdate = $app.findRecordById('sync_jobs', jobId)
            jobToUpdate.set('records_processed', totalProcessed)
            jobToUpdate.set('last_processed_page', page)
            if (!jobToUpdate.get('total_records_expected') && totalExpected > 0) {
              jobToUpdate.set('total_records_expected', totalExpected)
            }
            $app.save(jobToUpdate)
          } catch (e) {}

          if (clientes.length < 50) {
            const job = $app.findRecordById('sync_jobs', jobId)
            job.set('status', 'completed')
            $app.save(job)
            saveLastSync()
          } else {
            page++
            setTimeout(processPage, 300)
          }
        } catch (err) {
          console.log('Background Sync Batch Error:', err)
          try {
            const job = $app.findRecordById('sync_jobs', jobId)
            job.set('status', 'error')
            let currentLog = job.get('error_log') || ''
            currentLog += '\nErro no lote de clientes: ' + String(err.message || err)
            if (currentLog.length > 2000) currentLog = currentLog.slice(-2000)
            job.set('error_log', currentLog.trim())
            $app.save(job)
          } catch (e) {}
        }
      }

      function saveLastSync() {
        try {
          let setting
          try {
            setting = $app.findFirstRecordByData('app_settings', 'key', 'last_successful_sync')
          } catch (e) {
            const col = $app.findCollectionByNameOrId('app_settings')
            setting = new Record(col)
            setting.set('key', 'last_successful_sync')
          }
          setting.set('value', new Date().toISOString())
          $app.save(setting)
        } catch (e) {}
      }

      processPage()
    } catch (err) {
      console.log('Background Sync Init Error:', err)
      try {
        const job = $app.findRecordById('sync_jobs', jobId)
        job.set('status', 'error')
        job.set('error_log', String(err.message || err))
        $app.save(job)
      } catch (e) {}
    }
  }, 100)

  e.next()
}, 'sync_jobs')
