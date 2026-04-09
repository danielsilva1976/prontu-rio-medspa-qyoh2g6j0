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

        if (now - updatedAt > 15 * 60 * 1000) {
          ex.set('status', 'failed')
          ex.set(
            'error_log',
            (ex.get('error_log') || '') +
              '\nSincronização interrompida devido a tempo limite na resposta do servidor (mais de 15 minutos).',
          )
          $app.save(ex)
        } else {
          activeExists = true
        }
      }

      if (activeExists) {
        record.set('status', 'failed')
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

  // Detach the heavy lifting to prevent execution timeouts
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

      // Recalculate total for incremental sync if needed
      if (dateFilter && page <= 1) {
        try {
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

          if (specificCount.statusCode === 200) {
            const scData = specificCount.json
            if (scData) {
              const incrementalTotal = Number(
                scData.total ||
                  scData.count ||
                  scData.total_registros ||
                  (typeof scData === 'number' ? scData : 0),
              )
              if (incrementalTotal >= 0 && incrementalTotal !== totalExpected) {
                totalExpected = incrementalTotal
                currentJob.set('total_records_expected', totalExpected)
                $app.save(currentJob)
              }
            }
          }
        } catch (e) {}
      }

      // Conectivity Validation & Init Count Feature
      if (page <= 1 && (!totalExpected || isNaN(totalExpected) || totalExpected === 0)) {
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

          if (countRes.statusCode !== 200) {
            const job = $app.findRecordById('sync_jobs', jobId)
            job.set('status', 'error')
            job.set(
              'error_log',
              `Falha na conexão com a API Belle: ${countRes.statusCode} - ${countRes.string || 'Erro desconhecido'}`,
            )
            $app.save(job)
            return
          }

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

            if (specificCount.statusCode === 200) {
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
          }

          if (totalExpected > 0) {
            const job = $app.findRecordById('sync_jobs', jobId)
            job.set('total_records_expected', totalExpected)
            $app.save(job)
          }
        } catch (err) {
          const job = $app.findRecordById('sync_jobs', jobId)
          job.set('status', 'error')
          job.set(
            'error_log',
            `Falha na conexão com a API Belle: Erro de rede ou timeout. ${err.message}`,
          )
          $app.save(job)
          return
        }
      }

      const patientsCol = $app.findCollectionByNameOrId('patients')

      if (page <= 0) page = 1

      const processPage = () => {
        try {
          let jobCheck
          try {
            jobCheck = $app.findRecordById('sync_jobs', jobId)
            if (jobCheck.get('status') !== 'processing') {
              console.log('Job no longer processing, aborting batch loop.')
              return
            }
          } catch (e) {
            return
          }

          if (page >= 1000) {
            jobCheck.set('status', 'completed')
            $app.save(jobCheck)
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

          // ALPHABETICAL PROCESSING: Sorting array to maintain alphabetical consistency
          if (Array.isArray(clientes)) {
            clientes.sort((a, b) => {
              const nameA = String(a.nome || '')
                .trim()
                .toLowerCase()
              const nameB = String(b.nome || '')
                .trim()
                .toLowerCase()
              return nameA.localeCompare(nameB)
            })
          }

          if (!Array.isArray(clientes) || clientes.length === 0) {
            const job = $app.findRecordById('sync_jobs', jobId)
            job.set('status', 'completed')
            $app.save(job)
            saveLastSync()
            return
          }

          let currentLog = jobCheck.get('error_log') || ''
          let pageErrors = 0

          for (let i = 0; i < clientes.length; i++) {
            const c = clientes[i]
            const belleIdStr = String(c.codigo || c.id || '')
            if (!belleIdStr) continue

            const patientName = c.nome ? String(c.nome).trim() : ''

            try {
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

              if (!patientName) {
                throw new Error(`Campo 'name' não pode ser vazio`)
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

              let existing = null
              try {
                // Upsert Integrity: ensures we match by external_id
                existing = $app.findFirstRecordByData('patients', 'external_id', belleIdStr)
              } catch (_) {}

              if (existing) {
                let changed = false
                for (let key in payload) {
                  if (payload[key] !== undefined) {
                    const oldVal = existing.get(key)
                    const newVal = payload[key]
                    // Safe string comparison to avoid triggering saves on identical values
                    if (String(oldVal || '') !== String(newVal || '')) {
                      existing.set(key, newVal)
                      changed = true
                    }
                  }
                }
                if (changed) {
                  $app.save(existing)
                }
              } else {
                const newRecord = new Record(patientsCol)
                for (let key in payload) {
                  if (payload[key] !== undefined) newRecord.set(key, payload[key])
                }
                $app.save(newRecord)
              }
            } catch (itemErr) {
              // Diagnostic Transparency: Grabbing field-level validation errors
              pageErrors++
              let detailStr = itemErr.message || String(itemErr)
              try {
                const errData = itemErr.data || (itemErr.response && itemErr.response.data)
                if (errData && typeof errData === 'object') {
                  const parts = []
                  for (let k in errData) {
                    if (errData[k] && errData[k].message) {
                      parts.push(`${k}: ${errData[k].message}`)
                    } else {
                      parts.push(`${k}: ${JSON.stringify(errData[k])}`)
                    }
                  }
                  if (parts.length > 0) {
                    detailStr = `Falha de validação - ${parts.join(', ')}`
                  }
                }
              } catch (e) {}
              currentLog += `\n[Erro] Cliente ID ${belleIdStr} (${patientName}): ${detailStr}`
            }
          }

          totalProcessed += clientes.length

          // Heartbeat & Sync State Update
          try {
            const jobToUpdate = $app.findRecordById('sync_jobs', jobId)
            jobToUpdate.set('records_processed', totalProcessed)
            jobToUpdate.set('last_processed_page', page)

            if (pageErrors > 0) {
              if (currentLog.length > 10000) currentLog = currentLog.slice(-10000)
              jobToUpdate.set('error_log', currentLog.trim())
            }

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
            // Resilient Sync Hook Optimization: yielding to avoid timeouts
            setTimeout(processPage, 300)
          }
        } catch (err) {
          console.log('Background Sync Batch Error:', err)
          try {
            const job = $app.findRecordById('sync_jobs', jobId)
            job.set('status', 'failed')
            let currentLog = job.get('error_log') || ''
            currentLog += '\nErro no lote de clientes: ' + String(err.message || err)
            if (currentLog.length > 10000) currentLog = currentLog.slice(-10000)
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
        job.set('status', 'failed')
        job.set('error_log', String(err.message || err))
        $app.save(job)
      } catch (e) {}
    }
  }, 100)

  e.next()
}, 'sync_jobs')
