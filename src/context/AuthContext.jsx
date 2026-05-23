import { createContext, useContext, useState } from 'react'
import { jwtDecode } from 'jwt-decode'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const loginWithGoogleCredential = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      setCurrentUser({
        uid: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        photo: decoded.picture,
        provider: 'google'
      });
      setIsAdmin(false);
    } catch (err) {
      console.error('Google login failed', err);
    }
  };

  const loginWithEmail = (email, password) => {
    // Mock — replace with Supabase later
    if (email === 'admin@tiwtn.com' && password === 'admin123') {
      setCurrentUser({
        uid: 'admin-uid',
        name: 'Admin',
        email: 'admin@tiwtn.com',
        photo: null,
        provider: 'email'
      })
      setIsAdmin(true)
    } else {
      setCurrentUser({
        uid: 'mock-uid-' + Date.now(),
        name: email.split('@')[0],
        email,
        photo: null,
        provider: 'email'
      })
      setIsAdmin(false)
    }
  }

  const logout = () => {
    setCurrentUser(null)
    setIsAdmin(false)
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAdmin,
      loginWithGoogleCredential,
      loginWithEmail,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
