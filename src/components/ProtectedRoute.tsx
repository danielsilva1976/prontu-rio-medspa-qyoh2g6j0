import { Navigate, Outlet, useLocation } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'

export function ProtectedRoute() {
  const location = useLocation()

  // Check if user has a valid authentication token
  if (!pb.authStore.isValid) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user is in 'users' collection and has admin, aesthetic or secretary role
  const user = pb.authStore.record || pb.authStore.model
  if (
    !user ||
    user.collectionName !== 'users' ||
    !['admin', 'secretary', 'aesthetic'].includes(user.role)
  ) {
    // Clear invalid session and redirect
    pb.authStore.clear()
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
