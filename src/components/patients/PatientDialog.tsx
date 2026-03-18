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
import useAuditStore from '@/stores/useAuditStore'
import { ImageUpload } from '@/components/ui/image-upload'

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
  endereco: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface PatientDialogProps {
  patient?: Patient
  trigger?: React.ReactNode
}

export function PatientDialog({ patient, trigger }: PatientDialogProps) {
  const [open, setOpen] = useState(false)
  const { addPatient, updatePatient } = usePatientStore()
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
      endereco: patient?.endereco || '',
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
          endereco: patient.endereco || '',
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
          endereco: '',
        })
      }
    }
  }, [open, patient, form])

  const onSubmit = (values: FormValues) => {
    if (isEdit && patient) {
      updatePatient(patient.id, values)
      addLog('Dados do paciente editados', patient.id)
      toast({
        title: 'Paciente atualizado',
        description: `Os dados de ${values.name} foram atualizados.`,
      })
    } else {
      addPatient({
        ...values,
        dob: '1990-01-01',
        lastVisit: new Date().toISOString().split('T')[0],
        nextAppointment: null,
        status: 'active',
        procedures: [],
        professional: null,
      })
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="paciente@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Endereço Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua das Flores, 123 - São Paulo/SP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
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
