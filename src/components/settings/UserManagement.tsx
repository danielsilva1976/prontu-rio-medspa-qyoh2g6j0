import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, Shield, User, ShieldAlert } from 'lucide-react'
import useUserStore from '@/stores/useUserStore'
import { AddUserDialog } from './AddUserDialog'

interface UserManagementProps {
  title: string
  description: string
}

export function UserManagement({ title, description }: UserManagementProps) {
  const { users, currentUser, removeUser } = useUserStore()

  return (
    <Card className="border-none shadow-subtle animate-fade-in-up">
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 gap-4">
        <div className="space-y-1">
          <CardTitle className="text-xl text-primary font-serif">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <AddUserDialog />
      </CardHeader>
      <CardContent>
        <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Nível de Acesso</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="group transition-colors hover:bg-muted/10">
                  <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-none">
                      {user.role === 'Admin' && <ShieldAlert className="w-3 h-3 mr-1" />}
                      {user.role === 'Profissional' && <Shield className="w-3 h-3 mr-1" />}
                      {user.role === 'Assistente' && <User className="w-3 h-3 mr-1" />}
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant="outline"
                      className={
                        user.status === 'Ativo'
                          ? 'text-success border-success/30'
                          : 'text-muted-foreground'
                      }
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {user.id !== currentUser.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeUser(user.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remover Usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
