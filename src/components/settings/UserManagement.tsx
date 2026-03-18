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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trash2, Shield, User, ShieldAlert } from 'lucide-react'
import useUserStore from '@/stores/useUserStore'
import { AddUserDialog } from './AddUserDialog'
import { EditUserDialog } from './EditUserDialog'

interface UserManagementProps {
  title: string
  description: string
}

export function UserManagement({ title, description }: UserManagementProps) {
  const { users, currentUser, removeUser } = useUserStore()

  const isAdmin = currentUser.email === 'daniel.nefro@gmail.com'

  return (
    <Card className="border-none shadow-subtle animate-fade-in-up">
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 gap-4">
        <div className="space-y-1">
          <CardTitle className="text-xl text-primary font-serif">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {isAdmin && <AddUserDialog />}
      </CardHeader>
      <CardContent>
        <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Profissional</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Nível de Acesso</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                {isAdmin && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="group transition-colors hover:bg-muted/10">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage src={user.avatar} className="object-cover" />
                        <AvatarFallback className="bg-primary/5 text-primary text-sm font-medium">
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-none">
                      {user.role === 'Médico' && <ShieldAlert className="w-3 h-3 mr-1" />}
                      {user.role === 'Estético' && <Shield className="w-3 h-3 mr-1" />}
                      {user.role === 'Secretária' && <User className="w-3 h-3 mr-1" />}
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
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <EditUserDialog user={user} />
                        {user.id !== currentUser.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeUser(user.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Remover Usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
