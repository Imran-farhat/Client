import { createContext, useContext, useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();
        
        setCurrentUser({
          uid: userInfo.sub,
          name: userInfo.name,
          email: userInfo.email,
          photo: userInfo.picture,
          provider: 'google'
        });
        setIsAdmin(false);
      } catch (err) {
        console.error('Google login failed', err);
      }
    },
    onError: (error) => console.log('Login Failed:', error)
  });

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
      loginWithGoogle,
      loginWithEmail,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
