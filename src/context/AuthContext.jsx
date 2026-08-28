import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase/client'
import { SITE_URL } from '../config/constants'

const AuthContext = createContext()

const CACHE_PREFIX = 'wpa_user_profile_'

const getCachedProfile = (userId) => {
  if (!userId) return null
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${userId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const setCachedProfile = (userId, profile) => {
  if (!userId || !profile) return
  try {
    localStorage.setItem(`${CACHE_PREFIX}${userId}`, JSON.stringify(profile))
  } catch {}
}

const clearCachedProfile = (userId = null) => {
  try {
    if (userId) {
      localStorage.removeItem(`${CACHE_PREFIX}${userId}`)
    } else {
      Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_PREFIX))
        .forEach(k => localStorage.removeItem(k))
    }
  } catch {}
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // In-flight fetch deduplication promise ref
  const inFlightFetchRef = useRef(null)

  const fetchProfile = async (userId) => {
    if (!userId) return null

    // Deduplicate in-flight fetch for same userId
    if (inFlightFetchRef.current) {
      return inFlightFetchRef.current
    }

    const fetchPromise = (async () => {
      try {
        // Query users table and members table in parallel for maximum speed
        const [userRes, memberRes] = await Promise.allSettled([
          supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle(),
          supabase
            .from('members')
            .select('member_id, status, mobile')
            .eq('user_id', userId)
            .maybeSingle()
        ])

        const userData = userRes.status === 'fulfilled' ? userRes.value.data : null
        let memberRec = memberRes.status === 'fulfilled' ? memberRes.value.data : null

        // Fallback: check members table by mobile if not found by user_id
        if (!memberRec && userData?.mobile) {
          try {
            const { data: mByMob } = await supabase
              .from('members')
              .select('member_id, status, mobile')
              .eq('mobile', userData.mobile)
              .maybeSingle()
            if (mByMob) memberRec = mByMob
          } catch (mErr) {
            console.warn('Fallback members query error:', mErr)
          }
        }

        const isRegistered = Boolean(userData?.has_registered || memberRec)
        const effectiveMemberId = userData?.member_id || memberRec?.member_id || null

        if (userData) {
          const updatedProfile = {
            ...userData,
            has_registered: isRegistered,
            member_id: effectiveMemberId,
            member_status: memberRec?.status || null
          }
          setUserProfile(updatedProfile)
          setIsAdmin(userData.role === 'admin')
          setCachedProfile(userId, updatedProfile)

          // Auto-sync users table in background if members record exists but user row was out of sync
          if (memberRec && (!userData.has_registered || !userData.member_id)) {
            supabase
              .from('users')
              .update({ has_registered: true, member_id: memberRec.member_id })
              .eq('id', userId)
              .then(() => {})
          }

          return updatedProfile
        } else {
          // Lazy create user profile for new login
          const { data: { session } } = await supabase.auth.getSession()
          const authUser = session?.user
          if (authUser && authUser.id === userId) {
            const newProfile = {
              id: authUser.id,
              name: authUser.user_metadata?.full_name ||
                    authUser.email?.split('@')[0] || '',
              email: authUser.email || '',
              photo: authUser.user_metadata?.avatar_url || null,
              provider: authUser.app_metadata?.provider || 'google',
              role: 'member',
              has_registered: isRegistered,
              member_id: effectiveMemberId,
              last_login: new Date().toISOString()
            }

            setUserProfile(newProfile)
            setIsAdmin(newProfile.role === 'admin')
            setCachedProfile(userId, newProfile)

            // Upsert profile in background
            supabase.from('users').upsert(newProfile).then(() => {})
            return newProfile
          }
        }
      } catch (err) {
        console.error('Exception fetching profile:', err)
      } finally {
        inFlightFetchRef.current = null
      }
      return null
    })()

    inFlightFetchRef.current = fetchPromise
    return fetchPromise
  }

  const updateLastLogin = (userId) => {
    if (!userId) return
    // Fire-and-forget: update last_login in background without blocking UI
    supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)
      .then(() => {})
  }

  useEffect(() => {
    let isMounted = true

    // 1. Initial Session Check (Fast synchronous check from local storage session)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return

      if (session?.user) {
        setCurrentUser(session.user)

        // Instant local cache restore
        const cached = getCachedProfile(session.user.id)
        if (cached) {
          setUserProfile(cached)
          setIsAdmin(cached.role === 'admin')
          setLoading(false)
        }

        // Fetch fresh profile in background
        fetchProfile(session.user.id).finally(() => {
          if (isMounted) setLoading(false)
        })
        updateLastLogin(session.user.id)
      } else {
        setCurrentUser(null)
        setUserProfile(null)
        setIsAdmin(false)
        setLoading(false)
      }
    }).catch(() => {
      if (isMounted) setLoading(false)
    })

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_OUT' || !session?.user) {
        setCurrentUser(null)
        setUserProfile(null)
        setIsAdmin(false)
        clearCachedProfile()
        setLoading(false)

        const protectedPaths = ['/profile', '/admin']
        if (protectedPaths.some(p => window.location.pathname.startsWith(p))) {
          window.location.href = '/login'
        }
        return
      }

      if (session?.user) {
        setCurrentUser(session.user)

        // Instant local cache restore
        const cached = getCachedProfile(session.user.id)
        if (cached) {
          setUserProfile(cached)
          setIsAdmin(cached.role === 'admin')
        }

        // Fetch latest profile
        await fetchProfile(session.user.id)
        if (isMounted) setLoading(false)

        if (event === 'SIGNED_IN') {
          updateLastLogin(session.user.id)
        }
      }
    })

    return () => {
      isMounted = false
      if (subscription) subscription.unsubscribe()
    }
  }, [])

  const loginWithGoogle = async (customRedirect = null) => {
    const target = customRedirect || '/profile'
    const redirectTo = window.location.hostname === 'localhost'
      ? `http://localhost:5173${target}`
      : `${window.location.origin}${target}`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account'
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
    try {
      clearCachedProfile(currentUser?.id)
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Sign out error:', err)
    } finally {
      setCurrentUser(null)
      setUserProfile(null)
      setIsAdmin(false)
    }
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
