import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import PageLoader from './PageLoader'

const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-70px)] items-center justify-center bg-[var(--bg-secondary)]">
        <PageLoader message="நிர்வாக பக்கத்தை ஏற்றுகிறது... / Loading Admin Panel..." />
      </div>
    )
  }
  if (!currentUser) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

export default AdminRoute
