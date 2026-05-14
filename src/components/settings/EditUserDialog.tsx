import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Edit2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import useUserStore, { User, UserRole } from '@/stores/useUserStore'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

const formSchema = z
  .object({
    name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
    email: z.string().email('Formato de e-mail inválido.'),
    role: z.enum(['Médico', 'Estético', 'Secretária'], {
      required_error: 'Selecione um nível de acesso.',
    }),
    avatar: z.string().optional(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => !data.password || data.password.length >= 8, {
    message: 'A senha deve ter pelo menos 8 caracteres.',
    path: ['password'],
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof formSchema>

export function EditUserDialog({ user }: { user: User }) {
  const [open, setOpen] = useState(false)
  const { updateUser } = useUserStore()
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '',
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        password: '',
        confirmPassword: '',
      })
    }
  }, [open, user, form])

  const onSubmit = async (values: FormValues) => {
    try {
      const updateData: any = {
        name: values.name,
        email: values.email,
        role: values.role,
        avatar: values.avatar,
      }
      if (values.password) {
        updateData.password = values.password
        updateData.confirmPassword = values.confirmPassword
      }

      await updateUser(user.id, updateData)
      toast({
        title: 'Usuário atualizado',
        description: `Os dados de ${values.name} foram atualizados com sucesso.`,
      })
      setOpen(false)
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar usuário',
        description: error.message || 'Falha ao processar solicitação.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
          title="Editar Usuário"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-primary">Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize as informações e credenciais do membro da equipe.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="flex items-center gap-4 pb-2">
              <Avatar className="h-16 w-16 border border-border shrink-0">
                <AvatarFallback className="bg-primary/5 text-primary text-xl font-medium">
                  {getInitials(form.watch('name'))}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Dra. Juliana" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@clinica.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível de Acesso</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível de acesso" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Médico">Médico (Acesso Total)</SelectItem>
                      <SelectItem value="Estético">Estético (Acesso Parcial)</SelectItem>
                      <SelectItem value="Secretária">Secretária (Acesso Restrito)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Senha (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Digite a nova senha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirme a nova senha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
