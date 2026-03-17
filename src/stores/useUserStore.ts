import { useState, useContext, createContext, ReactNode, createElement } from 'react'

export type UserRole = 'Admin' | 'Profissional' | 'Assistente'
export type UserStatus = 'Ativo' | 'Inativo'

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
}

type UserState = {
  users: User[]
  currentUser: User
  addUser: (user: Omit<User, 'id' | 'status'>) => void
  toggleStatus: (id: string) => void
  removeUser: (id: string) => void
}

const defaultUsers: User[] = [
  {
    id: 'usr-1',
    name: 'Dra. Fabíola Kleinert',
    email: 'fabiola@medspa.com',
    role: 'Admin',
    status: 'Ativo',
  },
  {
    id: 'usr-2',
    name: 'Dra. Sofia Mendes',
    email: 'sofia@medspa.com',
    role: 'Profissional',
    status: 'Ativo',
  },
]

const UserContext = createContext<UserState>({} as UserState)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(defaultUsers)
  // Mock logged in user for Access Control (Admin)
  const [currentUser] = useState<User>(defaultUsers[0])

  const addUser = (userData: Omit<User, 'id' | 'status'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      status: 'Ativo',
    }
    setUsers((prev) => [...prev, newUser])
  }

  const toggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === 'Ativo' ? 'Inativo' : 'Ativo' } : u,
      ),
    )
  }

  const removeUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  return createElement(
    UserContext.Provider,
    {
      value: {
        users,
        currentUser,
        addUser,
        toggleStatus,
        removeUser,
      },
    },
    children,
  )
}

export default function useUserStore() {
  return useContext(UserContext)
}
