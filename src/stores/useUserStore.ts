import { useState, useContext, createContext, ReactNode, createElement, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'

export type UserRole = 'Médico' | 'Estético' | 'Secretária'
export type UserStatus = 'Ativo' | 'Inativo'

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  avatar?: string
}

type UserState = {
  users: User[]
  currentUser: User
  isAuthenticated: boolean
  addUser: (user: Omit<User, 'id' | 'status'>) => void
  updateUser: (id: string, data: Partial<User>) => void
  toggleStatus: (id: string) => void
  removeUser: (id: string) => void
  switchUser: (id: string) => void
  login: (email?: string, password?: string) => Promise<boolean>
  logout: () => void
}

const defaultUsers: User[] = [
  {
    id: 'usr-admin',
    name: 'Daniel Silva',
    email: 'daniel.nefro@gmail.com',
    role: 'Médico',
    status: 'Ativo',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=4',
  },
  {
    id: 'usr-1',
    name: 'Dra. Fabíola Kleinert',
    email: 'fabiola@medspa.com',
    role: 'Médico',
    status: 'Ativo',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=1',
  },
]

const UserContext = createContext<UserState>({} as UserState)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(defaultUsers)

  const mapPbUser = (record: any): User | null => {
    if (!record) return null
    return {
      id: record.id,
      name: record.name || 'Administrador',
      email: record.email,
      role: record.role === 'admin' ? 'Médico' : 'Secretária',
      status: 'Ativo',
      avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=4',
    }
  }

  const [pbUser, setPbUser] = useState<User | null>(mapPbUser(pb.authStore.record))
  const [currentUserId, setCurrentUserId] = useState<string>(defaultUsers[0].id)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(pb.authStore.isValid)

  useEffect(() => {
    const unsub = pb.authStore.onChange((token, record) => {
      setPbUser(mapPbUser(record))
      setIsAuthenticated(pb.authStore.isValid)
    })
    return () => unsub()
  }, [])

  const currentUser = pbUser || users.find((u) => u.id === currentUserId) || users[0]

  const addUser = (userData: Omit<User, 'id' | 'status'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      status: 'Ativo',
    }
    setUsers((prev) => [...prev, newUser])
  }

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)))
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

  const login = async (email?: string, password?: string) => {
    if (!email || !password) return false
    try {
      await pb.collection('users').authWithPassword(email, password)
      return true
    } catch (e) {
      console.error('Login failed:', e)
      return false
    }
  }

  const logout = () => {
    pb.authStore.clear()
    setIsAuthenticated(false)
    setPbUser(null)
  }

  return createElement(
    UserContext.Provider,
    {
      value: {
        users,
        currentUser,
        isAuthenticated,
        addUser,
        updateUser,
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
