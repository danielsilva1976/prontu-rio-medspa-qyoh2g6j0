import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import usePatientStore, { Patient } from '@/stores/usePatientStore'
import useSettingsStore from '@/stores/useSettingsStore'
import useAuditStore from '@/stores/useAuditStore'
import { ImageUpload } from '@/components/ui/image-upload'
import { updateCliente, saveLead } from '@/lib/api/belle'

const formSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  age: z.coerce.number().min(0, 'Idade inválida'),
  phone: z.string().min(10, 'Telefone inválido'),
  avatar: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  profissao: z.string().optional(),
  estado_civil: z.string().optional(),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional(),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numeroRua: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface PatientDialogProps {
  patient?: Patient
  trigger?: React.ReactNode
}

export function PatientDialog({ patient, trigger }: PatientDialogProps) {
  const [open, setOpen] = useState(false)
  const { addPatient, updatePatient } = usePatientStore()
  const { belleSoftware } = useSettingsStore()
  const { addLog } = useAuditStore()
  const { toast } = useToast()

  const isEdit = !!patient

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: patient?.name || '',
      age: patient?.age || 30,
      phone: patient?.phone || '',
      avatar: patient?.avatar || '',
      cpf: patient?.cpf || '',
      rg: patient?.rg || '',
      profissao: patient?.profissao || '',
      estado_civil: patient?.estado_civil || '',
      email: patient?.email || '',
      cep: patient?.cep || '',
      rua: patient?.rua || '',
      numeroRua: patient?.numeroRua || '',
      bairro: patient?.bairro || '',
      cidade: patient?.cidade || '',
      uf: patient?.uf || '',
    },
  })

  useEffect(() => {
    if (open) {
      if (patient) {
        form.reset({
          name: patient.name,
          age: patient.age,
          phone: patient.phone,
          avatar: patient.avatar || '',
          cpf: patient.cpf || '',
          rg: patient.rg || '',
          profissao: patient.profissao || '',
          estado_civil: patient.estado_civil || '',
          email: patient.email || '',
          cep: patient.cep || '',
          rua: patient.rua || '',
          numeroRua: patient.numeroRua || '',
          bairro: patient.bairro || '',
          cidade: patient.cidade || '',
          uf: patient.uf || '',
        })
      } else {
        form.reset({
          name: '',
          age: 30,
          phone: '',
          avatar: '',
          cpf: '',
          rg: '',
          profissao: '',
          estado_civil: '',
          email: '',
          cep: '',
          rua: '',
          numeroRua: '',
          bairro: '',
          cidade: '',
          uf: '',
        })
      }
    }
  }, [open, patient, form])

  const onSubmit = async (values: FormValues) => {
    if (isEdit && patient) {
      if (patient.belleId) {
        try {
          await updateCliente(patient.belleId, {
            nome: values.name,
            cpf: values.cpf,
            celular: values.phone,
            email: values.email,
            profissao: values.profissao,
            cep: values.cep,
            rua: values.rua,
            numeroRua: values.numeroRua,
            bairro: values.bairro,
            cidade: values.cidade,
            uf: values.uf,
          })
          addLog('Atualização sincronizada com Belle Software', patient.id)
        } catch (e: any) {
          toast({
            title: 'Aviso de Integração',
            description: 'Salvo localmente, mas não foi possível atualizar no Belle Software.',
            variant: 'destructive',
          })
        }
      }
      updatePatient(patient.id, values)
      addLog('Dados do paciente editados', patient.id)
      toast({
        title: 'Paciente atualizado',
        description: `Os dados de ${values.name} foram atualizados.`,
      })
    } else {
      let newBelleId = undefined
      try {
        const res = await saveLead({
          nome: values.name,
          celular: values.phone,
          email: values.email,
          cpf: values.cpf,
          codEstab: belleSoftware.estabelecimento,
        })
        newBelleId = res?.codigo || res?.id || undefined
        addLog('Novo lead gerado no Belle Software', 'SYSTEM')
      } catch (e: any) {
        toast({
          title: 'Aviso de Integração',
          description: 'Paciente salvo localmente, mas falhou ao registrar lead no Belle.',
          variant: 'destructive',
        })
      }

      const newPatientId = `p-${Date.now()}`
      addPatient({
        ...values,
        id: newPatientId,
        belleId: newBelleId,
        dob: '1990-01-01',
        lastVisit: new Date().toISOString().split('T')[0],
        nextAppointment: null,
        status: 'active',
        procedures: [],
        professional: null,
      })
      addLog('Novo paciente cadastrado', newPatientId)
      toast({
        title: 'Paciente cadastrado',
        description: `${values.name} foi adicionado com sucesso.`,
      })
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Paciente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-primary">
            {isEdit ? 'Editar Paciente' : 'Novo Paciente'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize a foto e as informações do paciente.'
              : 'Preencha os dados abaixo para cadastrar um novo paciente.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foto do Paciente</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      nameInitials={form.watch('name') || '?'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2 lg:col-span-3">
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Maria Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idade</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 90000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000-0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="profissao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profissão</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Engenheira" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estado_civil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado Civil</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Solteira" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="md:col-span-2 lg:col-span-3">
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="paciente@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="col-span-1 md:col-span-2 lg:col-span-3 border-t border-border mt-2 pt-4">
                <h4 className="text-sm font-medium text-primary mb-3">Endereço</h4>
              </div>
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rua"
                render={({ field }) => (
                  <FormItem className="lg:col-span-2">
                    <FormLabel>Rua / Logradouro</FormLabel>
                    <FormControl>
                      <Input placeholder="Av. Paulista" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numeroRua"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input placeholder="1000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bairro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Bela Vista" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="São Paulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="uf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF</FormLabel>
                    <FormControl>
                      <Input placeholder="SP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{isEdit ? 'Salvar Alterações' : 'Cadastrar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
