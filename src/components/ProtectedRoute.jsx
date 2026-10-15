import { useAuth } from '../context/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'
import PageLoader from './PageLoader'

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-70px)] items-center justify-center bg-[var(--bg-secondary)]">
        <PageLoader message="உள்நுழைகிறது... / Signing in..." />
      </div>
    )
  }
  return currentUser ? children : (
    <Navigate
      to="/login"
      state={{
        redirectTo: location.pathname,
        message: location.pathname === '/register'
          ? 'உறுப்பினர் பதிவு செய்ய முதலில் உள்நுழையவும் / Please Sign In to complete member registration'
          : undefined
      }}
      replace
    />
  )
}

export default ProtectedRoute
