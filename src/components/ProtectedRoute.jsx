import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FA] text-[#003366] font-semibold">
        Loading...
      </div>
    )
  }
  return currentUser ? children : <Navigate to="/login" />
}
export default ProtectedRoute
