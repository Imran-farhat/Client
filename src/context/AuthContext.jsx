import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabase/client'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) {
      setUserProfile(data)
      setIsAdmin(data.role === 'admin')
    }
  }

  const updateLastLogin = async (userId) => {
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user)
        fetchProfile(session.user.id)
        updateLastLogin(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setCurrentUser(session.user)
          await fetchProfile(session.user.id)

          if (event === 'SIGNED_IN') {
            const { data } = await supabase
              .from('users')
              .select('id')
              .eq('id', session.user.id)
              .single()

            if (!data) {
              await supabase.from('users').insert({
                id: session.user.id,
                name: session.user.user_metadata?.full_name ||
                      session.user.email?.split('@')[0],
                email: session.user.email,
                photo: session.user.user_metadata?.avatar_url,
                provider: session.user.app_metadata?.provider,
                role: 'member',
                has_registered: false,
                last_login: new Date().toISOString()
              })
              await fetchProfile(session.user.id)
            } else {
              await updateLastLogin(session.user.id)
            }
          }
        } else {
          setCurrentUser(null)
          setUserProfile(null)
          setIsAdmin(false)
        }
        setLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [])

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/profile`
      }
    })
    if (error) throw error
  }

  const loginWithEmail = async (email, password) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Invalid login credentials'))
        throw new Error('தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்')
      throw new Error(error.message)
    }
    return data
  }

  const signupWithEmail = async (name, email, password) => {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing)
      throw new Error(
        'இந்த மின்னஞ்சல் ஏற்கனவே பதிவாகியுள்ளது / Already registered. Please Sign In.'
      )

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })
    if (error) throw new Error(error.message)
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setUserProfile(null)
    setIsAdmin(false)
  }

  const refreshProfile = async () => {
    if (currentUser) await fetchProfile(currentUser.id)
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      isAdmin,
      loading,
      loginWithGoogle,
      loginWithEmail,
      signupWithEmail,
      logout,
      refreshProfile
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
