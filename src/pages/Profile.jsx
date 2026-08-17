import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/client';
import IDCard from '../components/IDCard';
import SEO from '../components/SEO';
import PageLoader from '../components/PageLoader';

const getPhotoSrc = (member) =>
  member?.photo_url ||
  member?.photo_base64 ||
  member?.photoPreview ||
  null;

function Profile() {
  const { currentUser, userProfile, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [memberData, setMemberData] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Sync edit name from profile
  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.name || '');
    }
  }, [userProfile]);

  // Load member registration from Supabase
  useEffect(() => {
    const loadMember = async () => {
      if (!currentUser) return;
      setLoading(true);

      try {
        // Try by user_id first
        let { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (error) throw error;

        // Fallback: try by mobile from userProfile
        if (!data && userProfile?.mobile) {
          const { data: data2, error: error2 } = await supabase
            .from('members')
            .select('*')
            .eq('mobile', userProfile.mobile)
            .maybeSingle();
          if (error2) throw error2;
          data = data2;
        }

        if (data) {
          console.log('Member found:', data);
          setMemberData(data);
        } else {
          console.log('No member found for user:', currentUser.id);
          setMemberData(null);
        }
      } catch (err) {
        console.error("Error loading member details:", err.message || err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) loadMember();
  }, [currentUser, userProfile]);

  const handleSaveName = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      // Check if user profile exists in database
      const { data: existing, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!existing) {
        // Profile row does not exist, insert it now
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: currentUser.id,
            name: editName,
            email: currentUser.email || '',
            photo: currentUser.user_metadata?.avatar_url || null,
            provider: currentUser.app_metadata?.provider || 'email',
            role: 'member',
            has_registered: false,
            last_login: new Date().toISOString()
          });
        if (insertError) throw insertError;
      } else {
        // Profile row exists, update it
        const { error: updateError } = await supabase
          .from('users')
          .update({ name: editName })
          .eq('id', currentUser.id);
        if (updateError) throw updateError;
      }

      // Sync name changes to members table too
      if (memberData?.member_id) {
        await supabase
          .from('members')
          .update({ full_name: editName })
          .eq('member_id', memberData.member_id);
      }

      await refreshProfile();
      alert('✅ பெயர் சேமிக்கப்பட்டது / Name saved!');
    } catch (err) {
      console.error('Error saving name:', err.message || err);
      alert('பெயர் சேமிக்கப்படவில்லை: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Derive provider from Supabase app_metadata
  const provider = currentUser?.app_metadata?.provider;
  const displayName = userProfile?.name || currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || '';
  const photoUrl = userProfile?.photo || currentUser?.user_metadata?.avatar_url;
  const isRegistered = userProfile?.has_registered || !!memberData;

  // Map Supabase member columns to IDCard expected shape
  const idCardMember = memberData ? {
    memberId: memberData.member_id,
    fullName: memberData.full_name,
    posting: memberData.posting,
    dob: memberData.dob,
    bloodGroup: memberData.blood_group,
    mobile: memberData.mobile,
    district: memberData.district,
    address: memberData.address,
    nomineeName: memberData.nominee_name,
    joinDate: memberData.join_date,
    pledgeDistrict: memberData.district,
    pledgeBranch: memberData.branch,
    photo_url: memberData.photo_url,
    photo_base64: memberData.photo_base64,
    photoPreview: getPhotoSrc(memberData),
    aadhaar: memberData.aadhar,
  } : null;

  return (
    <>
      <SEO
        title="சுயவிவரம் / Profile"
        description="உறுப்பினர் சுயவிவரம் மற்றும் அடையாள அட்டை விவரங்கள் - South India Welding Workers Welfare Association Member Profile"
        url="/profile"
      />
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold text-[var(--text-primary)]">My Profile</h1>

        <div className="grid gap-8 md:grid-cols-2">
          {/* SECTION A — Account Card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm h-fit">
            <div className="flex flex-col items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FF6B00] text-3xl font-bold text-white border-4 border-[#FFB347] overflow-hidden">
                {photoUrl ? (
                  <img src={photoUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  displayName?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="mt-4 flex gap-2">
                {provider === 'google' && <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">🟢 Google</span>}
                {provider === 'email' && <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">✉️ Email</span>}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Name</label>
                <input
                  id="profile-name-input"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] focus:border-amber focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Email</label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  readOnly
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] opacity-70 cursor-not-allowed"
                />
              </div>

              <button
                id="profile-save-btn"
                onClick={handleSaveName}
                disabled={saving}
                className="button-amber mt-4 w-full text-black py-3 rounded-xl font-bold disabled:opacity-60"
              >
                {saving ? 'சேமிக்கிறது...' : 'Save Changes'}
              </button>

              <button
                onClick={logout}
                className="mt-2 w-full rounded-xl border border-red-300 py-2 text-sm text-red-500 hover:bg-red-50 transition"
              >
                🚪 Logout
              </button>
            </div>
          </div>

          {/* SECTION B — Membership Status */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-[var(--text-primary)]">📋 உறுப்பினர் அட்டை</h2>

            {loading ? (
              <PageLoader message="உறுப்பினர் விவரங்களை ஏற்றுகிறது..." />
            ) : !memberData ? (
              // NOT REGISTERED STATE
              <div style={{ textAlign: 'center', paddingTop: '2rem', paddingBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📋</div>
                <div className="mb-2 text-lg font-semibold text-[var(--text-secondary)]">இன்னும் பதிவு செய்யவில்லை</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1rem' }}>You haven't registered yet</div>
                <button
                  onClick={() => navigate('/register')}
                  style={{
                    background: '#FF6B00', color: '#fff', border: 'none',
                    borderRadius: '8px', padding: '12px 24px',
                    fontSize: '14px', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  பதிவு செய்க / Register Now
                </button>
              </div>

            ) : memberData.status === 'pending' ? (
              // PENDING STATE
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: '#FEF3C7', border: '3px solid #F59E0B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', margin: '0 auto 1rem'
                }}>⏳</div>
                <h3 style={{ color: '#92400E', fontWeight: '800', marginBottom: '0.5rem', fontFamily: 'Catamaran, sans-serif' }}>
                  அனுமதிக்காக காத்திருக்கிறது
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '1rem' }}>
                  Your application is under review.<br/>
                  நிர்வாகி சரிபார்க்கும் வரை காத்திருங்கள்.
                </p>
                <div style={{
                  background: '#FEF3C7', border: '1px solid #F59E0B',
                  borderRadius: '8px', padding: '0.8rem 1rem', marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>விண்ணப்ப எண் / Application ID</div>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: '13px', fontWeight: '900', color: '#FF6B00' }}>
                    {memberData.member_id}
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  அனுமதி கிடைத்தவுடன் இங்கே உங்கள் அட்டை காட்டப்படும்.<br/>
                  Your ID card will appear here once approved.
                </p>
              </div>

            ) : memberData.status === 'rejected' ? (
              // REJECTED STATE
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: '#FEE2E2', border: '3px solid #EF4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', margin: '0 auto 1rem'
                }}>❌</div>
                <h3 style={{ color: '#DC2626', fontWeight: '800', marginBottom: '0.5rem', fontFamily: 'Catamaran, sans-serif' }}>
                  விண்ணப்பம் நிராகரிக்கப்பட்டது
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '1rem' }}>
                  Your application was rejected. Please correct the details/photo and re-submit.
                </p>
                {memberData.rejection_reason && (
                  <div style={{
                    background: '#FEE2E2', border: '1px solid #EF4444',
                    borderRadius: '8px', padding: '0.8rem 1rem',
                    marginBottom: '1rem', textAlign: 'left'
                  }}>
                    <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: '700', marginBottom: '4px' }}>காரணம் / Reason:</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>{memberData.rejection_reason}</div>
                  </div>
                )}
                <div style={{
                  background: '#FEF3C7', border: '1px solid #F59E0B',
                  borderRadius: '8px', padding: '0.8rem 1rem', marginBottom: '1.2rem'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>உறுப்பினர் எண் / Member ID</div>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: '13px', fontWeight: '900', color: '#FF6B00' }}>
                    {memberData.member_id}
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigate('/register?mode=edit');
                  }}
                  style={{
                    background: '#FF6B00', color: '#fff', border: 'none',
                    borderRadius: '8px', padding: '12px 24px', fontSize: '14px',
                    fontWeight: '700', cursor: 'pointer', width: '100%',
                    boxShadow: '0 4px 12px rgba(255, 107, 0, 0.2)'
                  }}
                >
                  ✏️ விவரங்களை திருத்தி மீண்டும் சமர்ப்பிக்க / Edit & Re-Submit Application
                </button>
              </div>

            ) : (
              // APPROVED STATE (existing logic — unchanged)
              <div>
                <div style={{ color: '#22C55E', fontSize: '14px', fontWeight: '700', marginBottom: '1rem' }}>
                  ✅ பதிவு செய்யப்பட்டது / Registered
                </div>

                {idCardMember && (
                  <div className="mb-6 flex justify-center">
                    <div className="transform scale-[0.85] origin-top">
                      <IDCard member={idCardMember} showReset={false} />
                    </div>
                  </div>
                )}

                {[
                  ['Member ID', memberData.member_id],
                  ['Name', memberData.full_name],
                  ['Aadhaar / ஆதார் எண்', memberData.aadhar],
                  ['District', memberData.district],
                  ['Mobile', memberData.mobile],
                  ['Blood Group', memberData.blood_group],
                  ['Joined', memberData.join_date],
                ].map(([label, value]) => (
                  <div key={label} style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--border)',
                    padding: '8px 0',
                    fontSize: '13px'
                  }}>
                    <span style={{ width: '120px', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{value || '-'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
