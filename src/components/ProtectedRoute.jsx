import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import PageLoader from './PageLoader'

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-70px)] items-center justify-center bg-[var(--bg-secondary)]">
        <PageLoader message="உள்நுழைகிறது... / Signing in..." />
      </div>
    )
  }
  return currentUser ? children : <Navigate to="/login" replace />
}

export default ProtectedRoute
