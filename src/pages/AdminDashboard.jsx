import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/client';
import IDCard from '../components/IDCard';

const TAMIL_NADU_DISTRICTS = [
  'அரியலூர்', 'சேலம்', 'சென்னை', 'கோயம்புத்தூர்', 'கடலூர்', 'தர்மபுரி', 'திண்டுக்கல்',
  'ஈரோடு', 'காஞ்சிபுரம்', 'கன்னியாகுமரி', 'கரூர்', 'கிருஷ்ணகிரி', 'மதுரை',
  'மயிலாடுதுறை', 'நாகப்பட்டினம்', 'நாமக்கல்', 'நீலகிரி', 'பெரம்பலூர்',
  'புதுக்கோட்டை', 'ராமநாதபுரம்', 'ராணிப்பேட்டை', 'சிவகங்கை', 'தென்காசி',
  'தஞ்சாவூர்', 'தேனி', 'திருவள்ளூர்', 'திருவண்ணாமலை', 'திருவாரூர்',
  'தூத்துக்குடி', 'திருச்சிராப்பள்ளி', 'திருநெல்வேலி', 'திருப்பத்தூர்',
  'திருப்பூர்', 'வேலூர்', 'விழுப்புரம்', 'விருதுநகர்'
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const ITEMS_PER_PAGE = 10;

const EMPTY_REGISTER_FORM = {
  fullName: '', address: '', companyAddress: '', bloodGroup: '',
  dob: '', aadhaar: '', mobile: '', nomineeName: '', nomineeMobile: '',
  pledgeDistrict: '', pledgeBranch: '', referral: '', pledgeName: '',
  photoPreview: null,
};

function formatDateDisplay() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
}

const NAV = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'members',  icon: '👥', label: 'All Members' },
  { id: 'register', icon: '📝', label: 'Register Member' },
  { id: 'users',    icon: '🙍', label: 'All Users' },
  { id: 'district', icon: '🗺️', label: 'By District' },
];

function AdminDashboard() {
  const [activeTab, setActiveTab]           = useState('overview');
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [members, setMembers]               = useState([]);
  const [users, setUsers]                   = useState([]);
  const [loadingData, setLoadingData]       = useState(true);
  const [searchQuery, setSearchQuery]       = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [editMember, setEditMember]         = useState(null);
  const [currentPage, setCurrentPage]       = useState(1);

  const [regForm, setRegForm]               = useState(EMPTY_REGISTER_FORM);
  const [regErrors, setRegErrors]           = useState({});
  const [regSubmitting, setRegSubmitting]   = useState(false);
  const [regSuccess, setRegSuccess]         = useState(null);
  const joiningDate = useMemo(() => formatDateDisplay(), []);

  const { logout } = useAuth();

  // ── Data loaders ─────────────────────────────────────────────
  const loadMembers = async () => {
    const { data } = await supabase.from('members').select('*').order('registered_at', { ascending: false });
    if (data) setMembers(data);
  };
  const loadUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  useEffect(() => {
    Promise.all([loadMembers(), loadUsers()]).finally(() => setLoadingData(false));
    const sub = supabase.channel('admin-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => loadMembers())
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  // ── Derived ─────────────────────────────────────────────────
  const filteredMembers = members.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || m.full_name?.toLowerCase().includes(q) || m.mobile?.includes(q) || m.member_id?.toLowerCase().includes(q);
    const matchDistrict = !districtFilter || m.district === districtFilter;
    return matchSearch && matchDistrict;
  });
  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const todayCount = members.filter(m => new Date(m.registered_at).toDateString() === new Date().toDateString()).length;
  const districtsCount = TAMIL_NADU_DISTRICTS.map(dist => ({ name: dist, count: members.filter(m => m.district === dist).length }));
  const activeDistricts = districtsCount.filter(d => d.count > 0).length;

  // ── Actions ──────────────────────────────────────────────────
  const deleteMember = async (memberId, userId) => {
    if (!window.confirm('Delete this member?')) return;
    await supabase.from('members').delete().eq('member_id', memberId);
    if (userId) await supabase.from('users').update({ has_registered: false, member_id: null }).eq('id', userId);
    await loadMembers();
    setSelectedMember(null);
  };
  const saveEditMember = async () => {
    if (!editMember) return;
    await supabase.from('members').update({
      full_name: editMember.full_name, mobile: editMember.mobile, district: editMember.district,
      address: editMember.address, blood_group: editMember.blood_group, dob: editMember.dob,
    }).eq('member_id', editMember.member_id);
    setEditMember(null);
    await loadMembers();
  };
  const changeUserRole = async (userId, newRole) => {
    await supabase.from('users').update({ role: newRole }).eq('id', userId);
    await loadUsers();
  };
  const exportCSV = () => {
    const headers = ['Member ID','Full Name','DOB','Blood Group','Mobile','Aadhar','District','Address','Nominee','Branch','Joined Date','Registered At'];
    const rows = members.map(m => [m.member_id, m.full_name, m.dob, m.blood_group, m.mobile, m.aadhar, m.district, m.address, m.nominee_name, m.branch, m.join_date, new Date(m.registered_at).toLocaleDateString('en-IN')]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `TIWTN_Members_${Date.now()}.csv`; a.click();
  };
  const toIdCardShape = (m) => m ? ({ memberId: m.member_id, fullName: m.full_name, dob: m.dob, bloodGroup: m.blood_group, mobile: m.mobile, district: m.district, address: m.address, nomineeName: m.nominee_name, joinDate: m.join_date, pledgeDistrict: m.district, pledgeBranch: m.branch, photoPreview: m.photo_base64 }) : null;

  // ── Register on behalf ───────────────────────────────────────
  const handleRegChange = (field) => (e) => {
    setRegForm(prev => ({ ...prev, [field]: e.target.value }));
    if (regErrors[field]) setRegErrors(prev => { const n = {...prev}; delete n[field]; return n; });
  };
  const handleRegPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setRegForm(prev => ({ ...prev, photoPreview: reader.result }));
    reader.readAsDataURL(file);
  };
  const validateReg = () => {
    const e = {};
    if (!regForm.fullName.trim())          e.fullName = 'Required';
    if (!regForm.address.trim())           e.address = 'Required';
    if (!regForm.bloodGroup)               e.bloodGroup = 'Required';
    if (!regForm.dob)                      e.dob = 'Required';
    if (!/^\d{12}$/.test(regForm.aadhaar)) e.aadhaar = '12 digits required';
    if (!/^\d{10}$/.test(regForm.mobile))  e.mobile = '10 digits required';
    if (!regForm.nomineeName.trim())       e.nomineeName = 'Required';
    if (!regForm.pledgeDistrict)           e.pledgeDistrict = 'Select district';
    if (!regForm.pledgeBranch.trim())      e.pledgeBranch = 'Required';
    return e;
  };
  const handleRegSubmit = async () => {
    const errs = validateReg();
    if (Object.keys(errs).length) { setRegErrors(errs); return; }
    setRegSubmitting(true);
    const memberId = `TIWTN-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000)).padStart(5,'0')}`;
    const record = {
      member_id: memberId, user_id: null, full_name: regForm.fullName, dob: regForm.dob,
      blood_group: regForm.bloodGroup, mobile: regForm.mobile, aadhar: regForm.aadhaar,
      address: regForm.address, org_address: regForm.companyAddress || '', district: regForm.pledgeDistrict,
      branch: regForm.pledgeBranch || '', nominee_name: regForm.nomineeName || '',
      nominee_phone: regForm.nomineeMobile || '', join_date: joiningDate,
      referrer: regForm.referral || '', photo_base64: regForm.photoPreview || null,
      registered_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('members').insert(record).select().single();
    setRegSubmitting(false);
    if (error) { alert('Error: ' + error.message); return; }
    setRegSuccess(data);
    await loadMembers();
  };
  const resetRegForm = () => { setRegForm(EMPTY_REGISTER_FORM); setRegErrors({}); setRegSuccess(null); };

  // ── Nav helper ───────────────────────────────────────────────
  const goTab = (id) => { setActiveTab(id); setSidebarOpen(false); };

  // ── Input helper ─────────────────────────────────────────────
  const inp = (field, label, type = 'text', extra = {}) => (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">{label}</label>
      <input type={type} value={regForm[field] || ''} onChange={handleRegChange(field)}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347] ${regErrors[field] ? 'border-red-400' : 'border-gray-200'}`}
        {...extra} />
      {regErrors[field] && <p className="mt-0.5 text-xs text-red-500">{regErrors[field]}</p>}
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F4F7FA]">

      {/* ── MOBILE TOP BAR ── */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-[#003366] px-4 py-3 md:hidden shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#FFB347] flex items-center justify-center font-bold text-black text-sm">A</div>
          <span className="font-bold text-white text-sm">Admin Panel</span>
        </div>
        <button onClick={() => setSidebarOpen(o => !o)} className="text-white text-2xl leading-none p-1">
          {sidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* ── MOBILE DRAWER OVERLAY ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      <div className="flex">
        {/* ── SIDEBAR ── */}
        <aside className={`
          fixed top-0 left-0 h-full w-64 bg-[#003366] text-white z-20 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:w-[220px] md:h-screen md:sticky md:top-0
        `}>
          {/* Sidebar header */}
          <div className="p-5 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded bg-[#FFB347] flex items-center justify-center font-bold text-black text-sm">A</div>
            <span className="font-bold text-lg tracking-wide">Admin Panel</span>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {NAV.map(tab => (
              <button key={tab.id} onClick={() => goTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded text-sm transition ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-[#FFB347] border-l-4 border-[#FFB347]'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
            <button onClick={() => { exportCSV(); setSidebarOpen(false); }}
              className="w-full text-left px-4 py-3 rounded text-sm text-gray-300 hover:bg-white/5 hover:text-white transition">
              📥 Export CSV
            </button>
          </nav>

          <div className="p-4 border-t border-white/10 flex-shrink-0">
            <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 transition">
              🚪 Logout Admin
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 p-4 md:p-8">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-5xl">
              <h2 className="text-xl md:text-2xl font-bold text-[#003366]">Dashboard Overview</h2>

              {/* Stat cards — 2 cols on mobile, 4 on desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                  { label: 'Total Members',    value: members.length,  color: '#FFB347' },
                  { label: 'Today Registered', value: todayCount,       color: '#22C55E' },
                  { label: 'Districts Covered',value: activeDistricts,  color: '#3B82F6' },
                  { label: 'Registered Users', value: users.length,     color: '#A855F7' },
                ].map(card => (
                  <div key={card.label} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm" style={{ borderLeft: `4px solid ${card.color}` }}>
                    <p className="text-[10px] md:text-xs text-gray-500 font-semibold uppercase tracking-wider leading-tight">{card.label}</p>
                    <p className="text-3xl md:text-4xl font-bold mt-2 text-[#003366]">
                      {loadingData ? '…' : card.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recent registrations */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-semibold text-[#003366] text-sm">Recent Registrations</h3>
                  <button onClick={() => goTab('members')} className="text-xs text-[#FF6B00] hover:underline">View All →</button>
                </div>
                {loadingData ? (
                  <p className="p-6 text-gray-400 text-sm text-center">Loading...</p>
                ) : members.slice(0, 8).map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 md:p-4 border-b border-gray-50 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      {m.photo_base64
                        ? <img src={m.photo_base64} alt="" className="w-9 h-9 rounded-full object-cover border border-[#FFB347]/30 flex-shrink-0" />
                        : <div className="w-9 h-9 rounded-full bg-[#FFB347]/20 text-[#FF6B00] flex items-center justify-center font-bold text-sm flex-shrink-0">{m.full_name?.charAt(0)}</div>
                      }
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{m.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{m.district}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs font-mono text-[#003366]">{m.member_id}</p>
                      <p className="text-xs text-gray-500">{m.join_date}</p>
                    </div>
                  </div>
                ))}
                {!loadingData && members.length === 0 && <p className="p-6 text-gray-400 text-sm text-center">No registrations yet.</p>}
              </div>
            </div>
          )}

          {/* ── ALL MEMBERS ── */}
          {activeTab === 'members' && (
            <div className="space-y-4 md:space-y-6 max-w-6xl">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-[#003366]">All Members</h2>
                <div className="flex gap-2">
                  <button onClick={() => goTab('register')} className="bg-[#003366] text-white px-3 py-2 rounded font-semibold text-xs md:text-sm shadow-sm hover:opacity-90">
                    ➕ Register
                  </button>
                  <button onClick={exportCSV} className="bg-[#FFB347] text-black px-3 py-2 rounded font-semibold text-xs md:text-sm shadow-sm hover:opacity-90">
                    📥 CSV
                  </button>
                </div>
              </div>

              {/* Search + filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="text" placeholder="Search name, mobile, member ID…"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="flex-1 p-3 rounded-lg border border-gray-200 text-black focus:outline-none focus:border-[#FFB347] shadow-sm text-sm"
                />
                <select value={districtFilter}
                  onChange={e => { setDistrictFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full sm:w-48 p-3 rounded-lg border border-gray-200 text-black focus:outline-none focus:border-[#FFB347] shadow-sm text-sm">
                  <option value="">All Districts</option>
                  {TAMIL_NADU_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Scrollable table wrapper */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-[#003366] text-white text-xs uppercase tracking-wider">
                        <th className="p-3 font-semibold">#</th>
                        <th className="p-3 font-semibold">Photo</th>
                        <th className="p-3 font-semibold">Name</th>
                        <th className="p-3 font-semibold">Member ID</th>
                        <th className="p-3 font-semibold">District</th>
                        <th className="p-3 font-semibold">Mobile</th>
                        <th className="p-3 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {loadingData
                        ? <tr><td colSpan="7" className="p-8 text-center text-gray-400">Loading...</td></tr>
                        : paginatedMembers.map((m, idx) => (
                          <tr key={m.member_id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                            <td className="p-3 text-gray-500">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                            <td className="p-3">
                              {m.photo_base64
                                ? <img src={m.photo_base64} alt="" className="w-8 h-8 rounded-full object-cover border border-[#FFB347]/30" />
                                : <div className="w-8 h-8 rounded-full bg-[#FFB347]/20 text-[#FF6B00] flex items-center justify-center font-bold text-xs">{m.full_name?.charAt(0)}</div>
                              }
                            </td>
                            <td className="p-3 font-semibold text-gray-800 max-w-[120px] truncate">{m.full_name}</td>
                            <td className="p-3 font-mono text-[#003366] text-xs">{m.member_id}</td>
                            <td className="p-3 text-gray-600 text-xs">{m.district}</td>
                            <td className="p-3 text-gray-600 text-xs">{m.mobile}</td>
                            <td className="p-3 text-center">
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => setSelectedMember(m)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition text-sm" title="View">👁️</button>
                                <button onClick={() => setEditMember({ ...m })} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition text-sm" title="Edit">✏️</button>
                                <button onClick={() => deleteMember(m.member_id, m.user_id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition text-sm" title="Delete">🗑️</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                      {!loadingData && paginatedMembers.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-gray-500">No members found.</td></tr>}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 bg-gray-50">
                  <span className="text-xs text-gray-600">
                    {filteredMembers.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)} of {filteredMembers.length}
                  </span>
                  <div className="flex gap-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border border-gray-300 rounded text-sm text-black disabled:opacity-40 hover:bg-white transition">Prev</button>
                    <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border border-gray-300 rounded text-sm text-black disabled:opacity-40 hover:bg-white transition">Next</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── REGISTER ON BEHALF ── */}
          {activeTab === 'register' && (
            <div className="max-w-2xl space-y-4 md:space-y-6">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-[#003366]">📝 Register Member</h2>
                {regSuccess && (
                  <button onClick={resetRegForm} className="text-sm border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition text-gray-600">
                    + Register Another
                  </button>
                )}
              </div>

              {regSuccess ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-8 space-y-6">
                  <div className="flex items-center gap-3 text-green-600">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-bold text-lg">Successfully Registered!</p>
                      <p className="text-sm text-gray-500">Member ID: <span className="font-mono font-bold text-[#003366]">{regSuccess.member_id}</span></p>
                    </div>
                  </div>
                  <div className="flex justify-center overflow-x-auto">
                    <div className="transform scale-75 md:scale-90 origin-top">
                      <IDCard member={toIdCardShape(regSuccess)} showReset={false} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {inp('fullName',      'Full Name / முழு பெயர்')}
                    {inp('mobile',        'Mobile / செல் நம்பர்', 'text', { maxLength: 10, inputMode: 'numeric', placeholder: '10 digits' })}
                    {inp('dob',           'Date of Birth / பிறந்த தேதி', 'date')}
                    {inp('aadhaar',       'Aadhaar / ஆதார் எண்', 'text', { maxLength: 12, inputMode: 'numeric', placeholder: '12 digits' })}
                    {inp('nomineeName',   'Nominee Name / வாரிசுதாரர் பெயர்')}
                    {inp('nomineeMobile', 'Nominee Mobile', 'text', { maxLength: 10, inputMode: 'numeric', placeholder: '10 digits' })}
                    {inp('pledgeBranch',  'Branch / கிளை')}
                    {inp('referral',      'Referral / பரிந்துரை')}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Blood Group</label>
                    <select value={regForm.bloodGroup} onChange={handleRegChange('bloodGroup')}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347] ${regErrors.bloodGroup ? 'border-red-400' : 'border-gray-200'}`}>
                      <option value="">-- Select --</option>
                      {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                    {regErrors.bloodGroup && <p className="mt-0.5 text-xs text-red-500">{regErrors.bloodGroup}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">District / மாவட்டம்</label>
                    <select value={regForm.pledgeDistrict} onChange={handleRegChange('pledgeDistrict')}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347] ${regErrors.pledgeDistrict ? 'border-red-400' : 'border-gray-200'}`}>
                      <option value="">-- Select District --</option>
                      {TAMIL_NADU_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {regErrors.pledgeDistrict && <p className="mt-0.5 text-xs text-red-500">{regErrors.pledgeDistrict}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Address / முகவரி</label>
                    <textarea rows={2} value={regForm.address} onChange={handleRegChange('address')}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347] resize-none ${regErrors.address ? 'border-red-400' : 'border-gray-200'}`} />
                    {regErrors.address && <p className="mt-0.5 text-xs text-red-500">{regErrors.address}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Company Address (Optional)</label>
                    <textarea rows={2} value={regForm.companyAddress} onChange={handleRegChange('companyAddress')}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347] resize-none" />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Member Photo</label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer">
                        {regForm.photoPreview
                          ? <img src={regForm.photoPreview} alt="Preview" className="w-16 h-20 object-cover rounded border-2 border-[#003366]" />
                          : <div className="w-16 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-2xl">📷</div>
                        }
                        <input type="file" accept="image/*" className="hidden" onChange={handleRegPhoto} />
                      </label>
                      <p className="text-xs text-gray-500">Tap to upload photo<br />(Optional)</p>
                    </div>
                  </div>

                  <button onClick={handleRegSubmit} disabled={regSubmitting}
                    className="w-full rounded-lg bg-[#003366] text-white py-3 font-bold text-sm hover:opacity-90 transition disabled:opacity-60">
                    {regSubmitting ? 'Registering…' : '📝 Register Member'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── ALL USERS ── */}
          {activeTab === 'users' && (
            <div className="space-y-4 md:space-y-6 max-w-5xl">
              <h2 className="text-xl md:text-2xl font-bold text-[#003366]">All Users</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-[#003366] text-white text-xs uppercase tracking-wider">
                        <th className="p-3 font-semibold">#</th>
                        <th className="p-3 font-semibold">Name</th>
                        <th className="p-3 font-semibold">Email</th>
                        <th className="p-3 font-semibold">Role</th>
                        <th className="p-3 font-semibold">Registered</th>
                        <th className="p-3 font-semibold text-center">Change Role</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {loadingData
                        ? <tr><td colSpan="6" className="p-8 text-center text-gray-400">Loading...</td></tr>
                        : users.map((u, idx) => (
                          <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                            <td className="p-3 text-gray-500">{idx + 1}</td>
                            <td className="p-3 font-semibold text-gray-800 max-w-[100px] truncate">{u.name || '-'}</td>
                            <td className="p-3 text-gray-600 text-xs max-w-[140px] truncate">{u.email}</td>
                            <td className="p-3">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3 text-gray-600 text-xs">{u.has_registered ? '✅' : '—'}</td>
                            <td className="p-3 text-center">
                              <select value={u.role} onChange={e => changeUserRole(u.id, e.target.value)}
                                className="rounded border border-gray-200 px-2 py-1 text-xs text-black focus:outline-none focus:border-[#FFB347]">
                                <option value="member">member</option>
                                <option value="admin">admin</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      }
                      {!loadingData && users.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-500">No users found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── BY DISTRICT ── */}
          {activeTab === 'district' && (
            <div className="max-w-6xl">
              <div className="flex flex-wrap gap-3 items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-[#003366]">Members by District</h2>
                <button onClick={exportCSV} className="bg-[#FFB347] text-black px-3 py-2 rounded font-semibold text-sm shadow-sm hover:opacity-90">
                  📥 Export CSV
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {districtsCount.map(d => (
                  <button key={d.name}
                    onClick={() => { setDistrictFilter(d.name); goTab('members'); setCurrentPage(1); }}
                    disabled={d.count === 0}
                    className={`p-3 rounded-xl border text-left transition ${
                      d.count > 0 ? 'bg-white border-[#FFB347] shadow-sm hover:-translate-y-1 hover:shadow-md active:scale-95' : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                    }`}>
                    <p className={`font-semibold text-xs md:text-sm leading-tight ${d.count > 0 ? 'text-[#003366]' : 'text-gray-500'}`}>{d.name}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-[10px] text-gray-500">Members</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${d.count > 0 ? 'bg-[#FFB347]/20 text-[#FF6B00]' : 'bg-gray-200 text-gray-500'}`}>{d.count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── VIEW MODAL ── */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[92vh]">
            <button onClick={() => setSelectedMember(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-black hover:bg-gray-200 z-10 text-sm">✕</button>

            <div className="p-5 md:p-8 flex-1 overflow-y-auto">
              <h3 className="text-lg md:text-2xl font-bold text-[#003366] mb-4 border-b pb-2">Member Details</h3>
              <div className="grid grid-cols-2 gap-3 md:gap-y-4 md:gap-x-6 text-sm">
                {[
                  ['Full Name', selectedMember.full_name],
                  ['Member ID', selectedMember.member_id],
                  ['Mobile', selectedMember.mobile],
                  ['Date of Birth', selectedMember.dob],
                  ['Blood Group', selectedMember.blood_group],
                  ['District', selectedMember.district],
                  ['Aadhar', selectedMember.aadhar],
                  ['Branch', selectedMember.branch],
                  ['Nominee Name', selectedMember.nominee_name],
                  ['Nominee Phone', selectedMember.nominee_phone],
                  ['Joined Date', selectedMember.join_date],
                  ['Referrer', selectedMember.referrer],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-gray-400 text-[10px] md:text-xs uppercase mb-0.5">{label}</p>
                    <p className="font-semibold text-gray-900 text-xs md:text-sm break-all">{val || '-'}</p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-gray-400 text-[10px] uppercase mb-0.5">Address</p>
                  <p className="font-semibold text-gray-900 text-xs md:text-sm">{selectedMember.address || '-'}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => { setEditMember({ ...selectedMember }); setSelectedMember(null); }}
                  className="flex-1 rounded-lg bg-[#FFB347] text-black py-2 font-semibold text-sm hover:opacity-90 transition">✏️ Edit</button>
                <button onClick={() => deleteMember(selectedMember.member_id, selectedMember.user_id)}
                  className="flex-1 rounded-lg border border-red-300 py-2 text-sm text-red-500 hover:bg-red-50 transition">🗑️ Delete</button>
              </div>
            </div>

            <div className="p-4 md:p-8 bg-gray-50 flex items-center justify-center overflow-x-auto md:min-w-[320px]">
              <div className="transform scale-75 md:scale-90 origin-center">
                <IDCard member={toIdCardShape(selectedMember)} showReset={false} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editMember && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4">
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl md:rounded-2xl shadow-2xl p-5 md:p-8 overflow-y-auto max-h-[90vh]">
            <button onClick={() => setEditMember(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-black hover:bg-gray-200 text-sm">✕</button>
            <h3 className="text-lg md:text-xl font-bold text-[#003366] mb-4">Edit Member</h3>
            <div className="space-y-3 text-sm">
              {[['full_name','Full Name','text'],['mobile','Mobile','text'],['dob','DOB','date'],['blood_group','Blood Group','text'],['address','Address','text']].map(([key, label, type]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">{label}</label>
                  <input type={type} value={editMember[key] || ''}
                    onChange={e => setEditMember(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-black focus:outline-none focus:border-[#FFB347] text-sm" />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">District</label>
                <select value={editMember.district || ''} onChange={e => setEditMember(prev => ({ ...prev, district: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-black focus:outline-none focus:border-[#FFB347] text-sm">
                  <option value="">-- Select --</option>
                  {TAMIL_NADU_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={saveEditMember} className="flex-1 rounded-lg bg-[#FFB347] text-black py-2.5 font-semibold hover:opacity-90 transition text-sm">Save Changes</button>
              <button onClick={() => setEditMember(null)} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-gray-600 hover:bg-gray-50 transition text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
