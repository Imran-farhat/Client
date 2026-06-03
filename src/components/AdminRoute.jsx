import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FA] text-[#003366] font-semibold">
        Loading...
      </div>
    )
  }
  if (!currentUser) return <Navigate to="/login" />
  if (!isAdmin) return <Navigate to="/" />
  return children
}
export default AdminRoute
