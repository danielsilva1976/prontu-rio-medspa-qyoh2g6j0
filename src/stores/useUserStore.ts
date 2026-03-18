import { useState, useContext, createContext, ReactNode, createElement } from 'react'

export type UserRole = 'Médico' | 'Estético' | 'Secretária'
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
  isAuthenticated: boolean
  addUser: (user: Omit<User, 'id' | 'status'>) => void
  toggleStatus: (id: string) => void
  removeUser: (id: string) => void
  switchUser: (id: string) => void
  login: () => void
  logout: () => void
}

const defaultUsers: User[] = [
  {
    id: 'usr-1',
    name: 'Dra. Fabíola Kleinert',
    email: 'fabiola@medspa.com',
    role: 'Médico',
    status: 'Ativo',
  },
  {
    id: 'usr-2',
    name: 'Dra. Sofia Mendes',
    email: 'sofia@medspa.com',
    role: 'Estético',
    status: 'Ativo',
  },
  {
    id: 'usr-3',
    name: 'Mariana Costa',
    email: 'mariana@medspa.com',
    role: 'Secretária',
    status: 'Ativo',
  },
]

const UserContext = createContext<UserState>({} as UserState)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(defaultUsers)
  const [currentUserId, setCurrentUserId] = useState<string>(defaultUsers[0].id)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  const currentUser = users.find((u) => u.id === currentUserId) || users[0]

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

  const switchUser = (id: string) => {
    setCurrentUserId(id)
  }

  const login = () => setIsAuthenticated(true)
  const logout = () => setIsAuthenticated(false)

  return createElement(
    UserContext.Provider,
    {
      value: {
        users,
        currentUser,
        isAuthenticated,
        addUser,
        toggleStatus,
        removeUser,
        switchUser,
        login,
        logout,
      },
    },
    children,
  )
}

export default function useUserStore() {
  return useContext(UserContext)
}
