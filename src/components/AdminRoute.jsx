import { useAuth } from '../context/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'
import PageLoader from './PageLoader'

const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-70px)] items-center justify-center bg-[var(--bg-secondary)]">
        <PageLoader message="நிர்வாக பக்கத்தை ஏற்றுகிறது... / Loading Admin Panel..." />
      </div>
    )
  }
  if (!currentUser) {
    return (
      <Navigate
        to="/login"
        state={{
          redirectTo: location.pathname,
          message: 'நிர்வாக பக்கத்திற்குள் நுழைய உள்நுழையவும் / Please Sign In to access Admin Panel'
        }}
        replace
      />
    )
  }
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

export default AdminRoute
