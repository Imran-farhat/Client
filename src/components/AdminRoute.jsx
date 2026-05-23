import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin } = useAuth()
  if (!currentUser) return <Navigate to="/login" />
  if (!isAdmin) return <Navigate to="/" />
  return children
}
export default AdminRoute
