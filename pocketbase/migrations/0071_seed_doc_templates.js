migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('doc_templates')

    try {
      app.findFirstRecordByData('doc_templates', 'name', 'Rotina Skincare Diária')
    } catch (_) {
      const t1 = new Record(col)
      t1.set('name', 'Rotina Skincare Diária')
      t1.set('type', 'receita')
      t1.set(
        'content',
        'Uso Tópico:\n\n1. Vitamina C 10% - Aplicar 3 a 4 gotas na face pela manhã, antes do protetor solar.\n\n2. Protetor Solar FPS 50+ - Reaplicar a cada 3 horas.\n\n3. Ácido Retinoico 0.025% (Creme) - Aplicar pequena quantidade à noite. Iniciar uso em dias alternados para evitar sensibilização.',
      )
      app.save(t1)
    }

    try {
      app.findFirstRecordByData('doc_templates', 'name', 'Laudo de Toxina Botulínica')
    } catch (_) {
      const t2 = new Record(col)
      t2.set('name', 'Laudo de Toxina Botulínica')
      t2.set('type', 'laudo')
      t2.set(
        'content',
        'Atesto para os devidos fins que a paciente submeteu-se, nesta data, a procedimento dermatológico estético minimamente invasivo (Aplicação de Toxina Botulínica tipo A) nas regiões frontal, glabelar e periorbicular.\n\nProcedimento transcorreu sem intercorrências.\n\nRecomendações pós-procedimento fornecidas por escrito à paciente.',
      )
      app.save(t2)
    }
  },
  (app) => {
    try {
      const t1 = app.findFirstRecordByData('doc_templates', 'name', 'Rotina Skincare Diária')
      app.delete(t1)
    } catch (_) {}
    try {
      const t2 = app.findFirstRecordByData('doc_templates', 'name', 'Laudo de Toxina Botulínica')
      app.delete(t2)
    } catch (_) {}
  },
)
