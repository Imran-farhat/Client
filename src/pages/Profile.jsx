import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import IDCard from '../components/IDCard';

function Profile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(currentUser?.name || '');
  const [isRegistered, setIsRegistered] = useState(false);
  const [memberData, setMemberData] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
    }
    const registered = localStorage.getItem('tiwtn_registered');
    if (registered === 'true') {
      setIsRegistered(true);
      const data = localStorage.getItem('tiwtn_member_data');
      if (data) {
        setMemberData(JSON.parse(data));
      }
    }
  }, [currentUser]);

  const handleSave = () => {
    alert('Saved! (Supabase integration coming)');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-[var(--text-primary)]">My Profile</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        {/* SECTION A — Account Card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm h-fit">
          <div className="flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FF6B00] text-3xl font-bold text-white border-4 border-[#FFB347] overflow-hidden">
              {currentUser?.photo ? (
                <img src={currentUser.photo} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                currentUser?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="mt-4 flex gap-2">
              {currentUser?.provider === 'google' && <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">🟢 Google</span>}
              {currentUser?.provider === 'facebook' && <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">🔵 Facebook</span>}
              {currentUser?.provider === 'email' && <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">✉️ Email</span>}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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

            <button onClick={handleSave} className="button-amber mt-4 w-full text-black py-3 rounded-xl font-bold">
              Save Changes
            </button>
          </div>
        </div>

        {/* SECTION B — Membership Status */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-[var(--text-primary)]">📋 உறுப்பினர் அட்டை</h2>
          
          {!isRegistered ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="mb-2 text-lg font-semibold text-[var(--text-secondary)]">இன்னும் பதிவு செய்யவில்லை</p>
              <p className="mb-6 text-sm text-[var(--text-muted)]">You haven't registered yet</p>
              <button onClick={() => navigate('/register')} className="button-amber px-6 py-3 text-black font-bold rounded-xl">
                பதிவு செய்க / Register Now
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-700 border border-green-200">
                <span>✅</span>
                <span className="font-semibold">பதிவு செய்யப்பட்டது (Registered)</span>
              </div>
              
              {memberData && (
                <div className="mb-6 flex justify-center">
                  <div className="transform scale-[0.85] origin-top">
                    <IDCard member={memberData} />
                  </div>
                </div>
              )}

              <div className="space-y-3 rounded-xl bg-[var(--bg-secondary)] p-4 text-sm border border-[var(--border)]">
                <div className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--text-secondary)]">Member ID</span>
                  <span className="font-semibold text-[var(--text-primary)]">{memberData?.memberId || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--text-secondary)]">District</span>
                  <span className="font-semibold text-[var(--text-primary)]">{memberData?.district || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Joined</span>
                  <span className="font-semibold text-[var(--text-primary)]">{memberData?.joinDate || '-'}</span>
                </div>
              </div>

              <button className="button-amber mt-6 w-full text-black py-3 rounded-xl font-bold" onClick={() => alert('Download coming soon!')}>
                Download ID Card
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
