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
  fetchUsers: () => Promise<void>
  addUser: (user: any) => Promise<void>
  updateUser: (id: string, data: any) => Promise<void>
  removeUser: (id: string) => Promise<void>
  login: (email?: string, password?: string) => Promise<boolean>
  logout: () => void
}

const UserContext = createContext<UserState>({} as UserState)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const mapPbRole = (r: string): UserRole => {
    if (r === 'admin') return 'Médico'
    if (r === 'aesthetic') return 'Estético'
    return 'Secretária'
  }

  const mapPbUser = (record: any): User | null => {
    if (!record) return null
    return {
      id: record.id,
      name: record.name || 'Usuário',
      email: record.email,
      role: mapPbRole(record.role),
      status: 'Ativo',
      avatar: record.avatar
        ? pb.files.getURL(record, record.avatar)
        : `https://img.usecurling.com/ppl/thumbnail?gender=female&seed=${record.id}`,
    }
  }

  const [users, setUsers] = useState<User[]>([])
  const [pbUser, setPbUser] = useState<User | null>(mapPbUser(pb.authStore.record))
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(pb.authStore.isValid)

  useEffect(() => {
    const unsub = pb.authStore.onChange((token, record) => {
      setPbUser(mapPbUser(record))
      setIsAuthenticated(pb.authStore.isValid)
    })
    return () => unsub()
  }, [])

  const currentUser = pbUser || {
    id: 'guest',
    name: 'Convidado',
    email: '',
    role: 'Secretária',
    status: 'Ativo',
  }

  const fetchUsers = async () => {
    if (currentUser.role === 'Médico') {
      try {
        const records = await pb.collection('users').getFullList({ sort: 'name' })
        setUsers(records.map((r) => mapPbUser(r) as User))
      } catch (e) {
        console.error('Error fetching users', e)
      }
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentUser.role, isAuthenticated])

  const addUser = async (userData: any) => {
    const pbRole =
      userData.role === 'Médico'
        ? 'admin'
        : userData.role === 'Estético'
          ? 'aesthetic'
          : 'secretary'

    const formData = new FormData()
    formData.append('email', userData.email)
    formData.append('password', userData.password)
    formData.append('passwordConfirm', userData.password)
    formData.append('name', userData.name)
    formData.append('role', pbRole)

    if (userData.avatar && userData.avatar.startsWith('data:')) {
      const res = await fetch(userData.avatar)
      const blob = await res.blob()
      formData.append('avatar', blob, 'avatar.png')
    }

    await pb.collection('users').create(formData)
    await fetchUsers()
  }

  const updateUser = async (id: string, data: any) => {
    const formData = new FormData()
    if (data.name) formData.append('name', data.name)
    if (data.email) formData.append('email', data.email)
    if (data.role) {
      const pbRole =
        data.role === 'Médico' ? 'admin' : data.role === 'Estético' ? 'aesthetic' : 'secretary'
      formData.append('role', pbRole)
    }

    if (data.avatar && data.avatar.startsWith('data:')) {
      const res = await fetch(data.avatar)
      const blob = await res.blob()
      formData.append('avatar', blob, 'avatar.png')
    }

    await pb.collection('users').update(id, formData)
    await fetchUsers()

    if (id === currentUser.id) {
      const record = await pb.collection('users').getOne(id)
      setPbUser(mapPbUser(record))
    }
  }

  const removeUser = async (id: string) => {
    await pb.collection('users').delete(id)
    await fetchUsers()
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
    setUsers([])
  }

  return createElement(
    UserContext.Provider,
    {
      value: {
        users,
        currentUser,
        isAuthenticated,
        fetchUsers,
        addUser,
        updateUser,
        removeUser,
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
