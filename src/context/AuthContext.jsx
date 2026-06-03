import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabase/client'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      if (error) {
        console.error('Error fetching profile:', error.message)
        return
      }

      if (data) {
        setUserProfile(data)
        setIsAdmin(data.role === 'admin')
      } else {
        // User logged in but profile row doesn't exist yet (e.g. initial write failed)
        // Let's lazy-create the profile row now.
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const newProfile = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name ||
                  session.user.email?.split('@')[0] || '',
            email: session.user.email || '',
            photo: session.user.user_metadata?.avatar_url || null,
            provider: session.user.app_metadata?.provider || 'email',
            role: 'member',
            has_registered: false,
            last_login: new Date().toISOString()
          }
          
          const { error: insertError } = await supabase
            .from('users')
            .insert(newProfile)
          
          if (!insertError) {
            setUserProfile(newProfile)
            setIsAdmin(newProfile.role === 'admin')
          } else {
            console.error('Failed to lazy-create user profile:', insertError.message)
          }
        }
      }
    } catch (err) {
      console.error('Exception fetching profile:', err)
    }
  }

  const updateLastLogin = async (userId) => {
    try {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId)
    } catch (err) {
      console.error('Exception updating last login:', err)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setCurrentUser(session.user)
          await fetchProfile(session.user.id)
          await updateLastLogin(session.user.id)
        }
      } catch (err) {
        console.error('Supabase init session error:', err)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    let subscription;
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          if (session?.user) {
            setCurrentUser(session.user)
            await fetchProfile(session.user.id)

            if (event === 'SIGNED_IN') {
              const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('id')
                .eq('id', session.user.id)
                .maybeSingle()

              if (checkError) {
                console.error('Error checking existing user:', checkError.message)
              }

              if (!existingUser) {
                const { error: insertError } = await supabase.from('users').insert({
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

                if (insertError) {
                  console.error('Error creating user profile:', insertError.message)
                } else {
                  await fetchProfile(session.user.id)
                }
              } else {
                await updateLastLogin(session.user.id)
              }
            }
          } else {
            setCurrentUser(null)
            setUserProfile(null)
            setIsAdmin(false)
          }
        } catch (innerErr) {
          console.error('Exception in onAuthStateChange handler:', innerErr)
        } finally {
          setLoading(false)
        }
      })
      subscription = data.subscription
    } catch (err) {
      console.error('Supabase auth state change subscription error:', err)
      setLoading(false)
    }

    return () => {
      if (subscription) subscription.unsubscribe()
    }
  }, [])

  const loginWithGoogle = async () => {
    const redirectTo = window.location.hostname === 'localhost'
      ? 'http://localhost:5173/profile'
      : `${window.location.origin}/profile`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
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
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
