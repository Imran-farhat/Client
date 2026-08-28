import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase/client'
import { SITE_URL, ADMIN_EMAIL } from '../config/constants'

const AuthContext = createContext()

const CACHE_PROFILE_KEY = 'wpa_user_profile_'
const CACHE_MEMBER_KEY = 'wpa_member_data_'

const ADMIN_EMAILS = [
  ADMIN_EMAIL?.toLowerCase(),
  'thenindiawelding@gmail.com',
  'idhreesufiyaidhreesufiya@gmail.com'
].filter(Boolean)

const checkIsAdmin = (email, role) => {
  if (role === 'admin') return true
  if (email && ADMIN_EMAILS.includes(email.toLowerCase())) return true
  return false
}

// Helpers for fast local cache
const getCached = (key) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const setCached = (key, val) => {
  try {
    if (val) localStorage.setItem(key, JSON.stringify(val))
    else localStorage.removeItem(key)
  } catch {}
}

const clearAllAuthCache = () => {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith('wpa_'))
      .forEach(k => localStorage.removeItem(k))
  } catch {}
}

// Helper to check existing Supabase token synchronously
const getInitialStoredSession = () => {
  try {
    const keys = Object.keys(localStorage)
    const authKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
    if (authKey) {
      const item = JSON.parse(localStorage.getItem(authKey))
      return item?.user || null
    }
  } catch {}
  return null
}

export const AuthProvider = ({ children }) => {
  // 1. Instant 0ms synchronous state initialization from local storage
  const [currentUser, setCurrentUser] = useState(() => getInitialStoredSession())

  const [userProfile, setUserProfile] = useState(() => {
    const user = getInitialStoredSession()
    return user?.id ? getCached(`${CACHE_PROFILE_KEY}${user.id}`) : null
  })

  const [memberData, setMemberData] = useState(() => {
    const user = getInitialStoredSession()
    return user?.id ? getCached(`${CACHE_MEMBER_KEY}${user.id}`) : null
  })

  const [isAdmin, setIsAdmin] = useState(() => {
    const user = getInitialStoredSession()
    if (!user) return false
    const cachedProfile = user.id ? getCached(`${CACHE_PROFILE_KEY}${user.id}`) : null
    return checkIsAdmin(user.email, cachedProfile?.role)
  })

  const [loading, setLoading] = useState(() => {
    // If URL contains OAuth callback tokens, keep loading true until Supabase processes it
    if (typeof window !== 'undefined') {
      const hasAuthHash = window.location.hash.includes('access_token') || 
                          window.location.hash.includes('error') ||
                          window.location.search.includes('code')
      if (hasAuthHash) return true
    }
    // Otherwise if we have stored session or no session, not loading
    return false
  })

  // In-flight fetch deduplication ref
  const inFlightFetchRef = useRef(null)

  // Fast single unified fetch for both User and Member profiles
  const fetchProfile = async (userId, userEmail = null, userMetadata = null) => {
    if (!userId) return null

    if (inFlightFetchRef.current) {
      return inFlightFetchRef.current
    }

    const promise = (async () => {
      try {
        // Query users table and members table in parallel
        const [userRes, memberRes] = await Promise.allSettled([
          supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle(),
          supabase
            .from('members')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()
        ])

        const userData = userRes.status === 'fulfilled' ? userRes.value.data : null
        let member = memberRes.status === 'fulfilled' ? memberRes.value.data : null

        // Fallback: check members table by mobile if not linked by user_id
        if (!member && (userData?.mobile || userMetadata?.phone)) {
          const mob = userData?.mobile || userMetadata?.phone
          try {
            const { data: mByMob } = await supabase
              .from('members')
              .select('*')
              .eq('mobile', mob)
              .maybeSingle()
            if (mByMob) {
              member = mByMob
              // Auto link member with user_id in background
              supabase.from('members').update({ user_id: userId }).eq('id', mByMob.id).then(() => {})
            }
          } catch {}
        }

        const isRegistered = Boolean(userData?.has_registered || member)
        const effectiveMemberId = userData?.member_id || member?.member_id || null
        const emailToCheck = userData?.email || userEmail || ''
        const adminStatus = checkIsAdmin(emailToCheck, userData?.role)

        let resolvedProfile = null

        if (userData) {
          resolvedProfile = {
            ...userData,
            has_registered: isRegistered,
            member_id: effectiveMemberId,
            member_status: member?.status || null
          }
          // Auto sync user row if member exists
          if (member && (!userData.has_registered || !userData.member_id)) {
            supabase
              .from('users')
              .update({ has_registered: true, member_id: member.member_id })
              .eq('id', userId)
              .then(() => {})
          }
        } else {
          // Fast lazy create user record if first-time login
          resolvedProfile = {
            id: userId,
            name: userMetadata?.full_name || userEmail?.split('@')[0] || 'Member',
            email: userEmail || '',
            photo: userMetadata?.avatar_url || null,
            provider: 'google',
            role: adminStatus ? 'admin' : 'member',
            has_registered: isRegistered,
            member_id: effectiveMemberId,
            last_login: new Date().toISOString()
          }
          supabase.from('users').upsert(resolvedProfile).then(() => {})
        }

        // Update states and caches
        setUserProfile(resolvedProfile)
        setMemberData(member)
        setIsAdmin(adminStatus)
        setCached(`${CACHE_PROFILE_KEY}${userId}`, resolvedProfile)
        setCached(`${CACHE_MEMBER_KEY}${userId}`, member)

        return { profile: resolvedProfile, member }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        inFlightFetchRef.current = null
      }
      return null
    })()

    inFlightFetchRef.current = promise
    return promise
  }

  const updateLastLogin = (userId) => {
    if (!userId) return
    supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)
      .then(() => {})
  }

  useEffect(() => {
    let isMounted = true

    // Fast session verification
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return

      if (session?.user) {
        setCurrentUser(session.user)
        setIsAdmin(checkIsAdmin(session.user.email, userProfile?.role))

        // Background profile sync
        fetchProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata
        ).finally(() => {
          if (isMounted) setLoading(false)
        })

        updateLastLogin(session.user.id)
      } else {
        setCurrentUser(null)
        setUserProfile(null)
        setMemberData(null)
        setIsAdmin(false)
        setLoading(false)
      }
    }).catch(() => {
      if (isMounted) setLoading(false)
    })

    // Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_OUT' || !session?.user) {
        setCurrentUser(null)
        setUserProfile(null)
        setMemberData(null)
        setIsAdmin(false)
        clearAllAuthCache()
        setLoading(false)

        const protectedPaths = ['/profile', '/admin']
        if (protectedPaths.some(p => window.location.pathname.startsWith(p))) {
          window.location.href = '/login'
        }
        return
      }

      if (session?.user) {
        setCurrentUser(session.user)
        setIsAdmin(checkIsAdmin(session.user.email, userProfile?.role))

        // Instantly stop loading indicator since user is authenticated
        setLoading(false)

        // Sync profile and member records in background
        await fetchProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata
        )

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

    const { data, error } = await supabase.auth.signInWithOAuth({
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
    if (data?.url) {
      window.location.href = data.url
    }
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
      clearAllAuthCache()
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Sign out error:', err)
    } finally {
      setCurrentUser(null)
      setUserProfile(null)
      setMemberData(null)
      setIsAdmin(false)
    }
  }

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(
        currentUser.id,
        currentUser.email,
        currentUser.user_metadata
      )
    }
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      memberData,
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
