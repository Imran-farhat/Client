import { useState, useEffect } from 'react';
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

const ITEMS_PER_PAGE = 10;

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { logout } = useAuth();

  // ── Data loaders ────────────────────────────────────────────
  const loadMembers = async () => {
    const { data } = await supabase
      .from('members')
      .select('*')
      .order('registered_at', { ascending: false });
    if (data) setMembers(data);
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  useEffect(() => {
    Promise.all([loadMembers(), loadUsers()]).finally(() => setLoadingData(false));

    // Real-time updates for members table
    const sub = supabase
      .channel('admin-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        () => loadMembers()
      )
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  // ── Derived data ────────────────────────────────────────────
  const filteredMembers = members.filter(m => {
    const matchSearch = !searchQuery ||
      m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.mobile?.includes(searchQuery) ||
      m.member_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDistrict = !districtFilter || m.district === districtFilter;
    return matchSearch && matchDistrict;
  });

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const todayCount = members.filter(m =>
    new Date(m.registered_at).toDateString() === new Date().toDateString()
  ).length;

  const districtsCount = TAMIL_NADU_DISTRICTS.map(dist => ({
    name: dist,
    count: members.filter(m => m.district === dist).length
  }));
  const activeDistricts = districtsCount.filter(d => d.count > 0).length;

  // ── Actions ─────────────────────────────────────────────────
  const deleteMember = async (memberId, userId) => {
    if (!window.confirm('இந்த உறுப்பினரை நீக்கவா? / Delete this member?')) return;
    await supabase.from('members').delete().eq('member_id', memberId);
    if (userId) {
      await supabase.from('users')
        .update({ has_registered: false, member_id: null })
        .eq('id', userId);
    }
    await loadMembers();
    setSelectedMember(null);
  };

  const saveEditMember = async () => {
    if (!editMember) return;
    await supabase.from('members').update({
      full_name: editMember.full_name,
      mobile: editMember.mobile,
      district: editMember.district,
      address: editMember.address,
      blood_group: editMember.blood_group,
      dob: editMember.dob
    }).eq('member_id', editMember.member_id);
    setEditMember(null);
    await loadMembers();
  };

  const changeUserRole = async (userId, newRole) => {
    await supabase.from('users').update({ role: newRole }).eq('id', userId);
    await loadUsers();
  };

  const exportCSV = () => {
    const headers = [
      'Member ID', 'Full Name', 'DOB', 'Blood Group',
      'Mobile', 'Aadhar', 'District', 'Address',
      'Nominee', 'Branch', 'Joined Date', 'Registered At'
    ];
    const rows = members.map(m => [
      m.member_id, m.full_name, m.dob,
      m.blood_group, m.mobile, m.aadhar,
      m.district, m.address, m.nominee_name,
      m.branch, m.join_date,
      new Date(m.registered_at).toLocaleDateString('en-IN')
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${v || ''}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `TIWTN_Members_${Date.now()}.csv`;
    a.click();
  };

  // Map Supabase member row → IDCard prop shape
  const toIdCardShape = (m) => m ? ({
    memberId: m.member_id,
    fullName: m.full_name,
    dob: m.dob,
    bloodGroup: m.blood_group,
    mobile: m.mobile,
    district: m.district,
    address: m.address,
    nomineeName: m.nominee_name,
    joinDate: m.join_date,
    pledgeDistrict: m.district,
    pledgeBranch: m.branch,
    photoPreview: m.photo_base64,
  }) : null;

  return (
    <div className="flex min-h-screen bg-[#F4F7FA]">
      {/* SIDEBAR */}
      <div className="w-[220px] bg-[#003366] text-white flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#FFB347] flex items-center justify-center font-bold text-black text-sm">A</div>
          <span className="font-bold text-lg tracking-wide text-white">Admin Panel</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'members', label: '👥 All Members' },
            { id: 'users',   label: '🙍 All Users' },
            { id: 'district', label: '🗺️ By District' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-3 rounded text-sm transition ${activeTab === tab.id ? 'bg-white/10 text-[#FFB347] border-l-4 border-[#FFB347]' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
          <button onClick={exportCSV} className="w-full text-left px-4 py-3 rounded text-sm text-gray-300 hover:bg-white/5 hover:text-white transition">
            📥 Export CSV
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 transition">
            🚪 Logout Admin
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 ml-[220px] p-8">

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-5xl">
            <h2 className="text-2xl font-bold text-[#003366]">Dashboard Overview</h2>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-lg border-l-4 border-[#FFB347] shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Total Members</p>
                <p className="text-4xl font-display text-[#003366] mt-2">{loadingData ? '…' : members.length}</p>
              </div>
              <div className="bg-white p-5 rounded-lg border-l-4 border-[#FFB347] shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Today Registered</p>
                <p className="text-4xl font-display text-[#003366] mt-2">{loadingData ? '…' : todayCount}</p>
              </div>
              <div className="bg-white p-5 rounded-lg border-l-4 border-[#FFB347] shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Districts Covered</p>
                <p className="text-4xl font-display text-[#003366] mt-2">{loadingData ? '…' : activeDistricts}</p>
              </div>
              <div className="bg-white p-5 rounded-lg border-l-4 border-[#FFB347] shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Registered Users</p>
                <p className="text-4xl font-display text-[#003366] mt-2">{loadingData ? '…' : users.length}</p>
              </div>
            </div>

            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-semibold text-[#003366]">Recent Registrations</h3>
              </div>
              <div className="p-0">
                {loadingData ? (
                  <p className="p-6 text-gray-400 text-sm text-center">Loading...</p>
                ) : members.slice(0, 5).map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FFB347]/20 text-[#FF6B00] flex items-center justify-center font-bold text-sm">
                        {m.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{m.full_name}</p>
                        <p className="text-xs text-gray-500">{m.district}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-[#003366]">{m.member_id}</p>
                      <p className="text-xs text-gray-500">{m.join_date}</p>
                    </div>
                  </div>
                ))}
                {!loadingData && members.length === 0 && (
                  <p className="p-6 text-gray-400 text-sm text-center">No registrations yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ALL MEMBERS ── */}
        {activeTab === 'members' && (
          <div className="space-y-6 max-w-6xl">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[#003366]">All Members</h2>
              <button onClick={exportCSV} className="bg-[#FFB347] text-black px-4 py-2 rounded font-semibold text-sm shadow-sm hover:opacity-90">
                📥 Export CSV
              </button>
            </div>

            <div className="flex gap-4 mb-6">
              <input
                type="text"
                placeholder="பெயர், மொபைல் அல்லது உறுப்பினர் எண் தேடுக..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="flex-1 p-3 rounded-lg border border-gray-200 text-black focus:outline-none focus:border-[#FFB347] focus:ring-1 focus:ring-[#FFB347] shadow-sm"
              />
              <select
                value={districtFilter}
                onChange={e => { setDistrictFilter(e.target.value); setCurrentPage(1); }}
                className="w-64 p-3 rounded-lg border border-gray-200 text-black focus:outline-none focus:border-[#FFB347] shadow-sm"
              >
                <option value="">All Districts</option>
                {TAMIL_NADU_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#003366] text-white text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">#</th>
                    <th className="p-4 font-semibold">Photo</th>
                    <th className="p-4 font-semibold">Name</th>
                    <th className="p-4 font-semibold">Member ID</th>
                    <th className="p-4 font-semibold">District</th>
                    <th className="p-4 font-semibold">Mobile</th>
                    <th className="p-4 font-semibold">Joined</th>
                    <th className="p-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loadingData ? (
                    <tr><td colSpan="8" className="p-8 text-center text-gray-400">Loading...</td></tr>
                  ) : paginatedMembers.map((m, idx) => (
                    <tr key={m.member_id} className="border-b border-gray-100 hover:bg-gray-50 hover:border-l-4 hover:border-l-[#FFB347] transition-all group">
                      <td className="p-4 text-gray-500 group-hover:pl-3">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                      <td className="p-4">
                        {m.photo_base64 ? (
                          <img src={m.photo_base64} alt="" className="w-9 h-9 rounded-full object-cover border border-[#FFB347]/30" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#FFB347]/20 text-[#FF6B00] flex items-center justify-center font-bold text-xs border border-[#FFB347]/30">
                            {m.full_name?.charAt(0)}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-gray-800">{m.full_name}</td>
                      <td className="p-4 font-mono text-[#003366] text-xs">{m.member_id}</td>
                      <td className="p-4 text-gray-600">{m.district}</td>
                      <td className="p-4 text-gray-600">{m.mobile}</td>
                      <td className="p-4 text-gray-600">{m.join_date}</td>
                      <td className="p-4 text-center flex gap-1 justify-center">
                        <button onClick={() => setSelectedMember(m)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition" title="View">👁️</button>
                        <button onClick={() => setEditMember({ ...m })} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition" title="Edit">✏️</button>
                        <button onClick={() => deleteMember(m.member_id, m.user_id)} className="p-2 text-red-500 hover:bg-red-50 rounded transition" title="Delete">🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {!loadingData && paginatedMembers.length === 0 && (
                    <tr><td colSpan="8" className="p-8 text-center text-gray-500">No members found.</td></tr>
                  )}
                </tbody>
              </table>

              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <span className="text-sm text-gray-600">
                  Showing {filteredMembers.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)} of {filteredMembers.length} members
                </span>
                <div className="flex gap-2">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border border-gray-300 rounded text-sm text-black disabled:opacity-50 hover:bg-white transition">Prev</button>
                  <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border border-gray-300 rounded text-sm text-black disabled:opacity-50 hover:bg-white transition">Next</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ALL USERS ── */}
        {activeTab === 'users' && (
          <div className="space-y-6 max-w-5xl">
            <h2 className="text-2xl font-bold text-[#003366]">All Users</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#003366] text-white text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">#</th>
                    <th className="p-4 font-semibold">Name</th>
                    <th className="p-4 font-semibold">Email</th>
                    <th className="p-4 font-semibold">Provider</th>
                    <th className="p-4 font-semibold">Role</th>
                    <th className="p-4 font-semibold">Registered</th>
                    <th className="p-4 font-semibold text-center">Change Role</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loadingData ? (
                    <tr><td colSpan="7" className="p-8 text-center text-gray-400">Loading...</td></tr>
                  ) : users.map((u, idx) => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-500">{idx + 1}</td>
                      <td className="p-4 font-semibold text-gray-800">{u.name || '-'}</td>
                      <td className="p-4 text-gray-600">{u.email}</td>
                      <td className="p-4 text-gray-600 capitalize">{u.provider || '-'}</td>
                      <td className="p-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{u.has_registered ? '✅ Yes' : '—'}</td>
                      <td className="p-4 text-center">
                        <select
                          value={u.role}
                          onChange={e => changeUserRole(u.id, e.target.value)}
                          className="rounded border border-gray-200 px-2 py-1 text-xs text-black focus:outline-none focus:border-[#FFB347]"
                        >
                          <option value="member">member</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {!loadingData && users.length === 0 && (
                    <tr><td colSpan="7" className="p-8 text-center text-gray-500">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── BY DISTRICT ── */}
        {activeTab === 'district' && (
          <div className="max-w-6xl">
            <h2 className="text-2xl font-bold text-[#003366] mb-6">Members by District</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {districtsCount.map(d => (
                <button
                  key={d.name}
                  onClick={() => { setDistrictFilter(d.name); setActiveTab('members'); setCurrentPage(1); }}
                  disabled={d.count === 0}
                  className={`p-4 rounded-xl border text-left transition ${d.count > 0 ? 'bg-white border-[#FFB347] shadow-sm hover:-translate-y-1' : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'}`}
                >
                  <p className={`font-semibold ${d.count > 0 ? 'text-[#003366]' : 'text-gray-500'}`}>{d.name}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-gray-500">Members</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${d.count > 0 ? 'bg-[#FFB347]/20 text-[#FF6B00]' : 'bg-gray-200 text-gray-500'}`}>{d.count}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── VIEW MODAL ── */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
            <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-black hover:bg-gray-200 z-10">✕</button>

            <div className="p-8 flex-1 overflow-y-auto border-r border-gray-100">
              <h3 className="text-2xl font-bold text-[#003366] mb-6 border-b pb-2">Member Details</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
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
                    <p className="text-gray-500 text-xs uppercase mb-1">{label}</p>
                    <p className="font-semibold text-gray-900">{val || '-'}</p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs uppercase mb-1">Address</p>
                  <p className="font-semibold text-gray-900">{selectedMember.address || '-'}</p>
                </div>
              </div>
              <button
                onClick={() => deleteMember(selectedMember.member_id, selectedMember.user_id)}
                className="mt-6 w-full rounded-lg border border-red-300 py-2 text-sm text-red-500 hover:bg-red-50 transition"
              >
                🗑️ Delete Member
              </button>
            </div>

            <div className="p-8 bg-gray-50 flex items-center justify-center min-w-[350px]">
              <div className="transform scale-90 origin-center">
                <IDCard member={toIdCardShape(selectedMember)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
            <button onClick={() => setEditMember(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-black hover:bg-gray-200">✕</button>
            <h3 className="text-xl font-bold text-[#003366] mb-6">Edit Member</h3>
            <div className="space-y-4 text-sm">
              {[
                ['full_name', 'Full Name', 'text'],
                ['mobile', 'Mobile', 'text'],
                ['dob', 'DOB', 'date'],
                ['blood_group', 'Blood Group', 'text'],
                ['address', 'Address', 'text'],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">{label}</label>
                  <input
                    type={type}
                    value={editMember[key] || ''}
                    onChange={e => setEditMember(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-black focus:outline-none focus:border-[#FFB347]"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">District</label>
                <select
                  value={editMember.district || ''}
                  onChange={e => setEditMember(prev => ({ ...prev, district: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-black focus:outline-none focus:border-[#FFB347]"
                >
                  <option value="">-- Select --</option>
                  {TAMIL_NADU_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={saveEditMember} className="flex-1 rounded-lg bg-[#FFB347] text-black py-2 font-semibold hover:opacity-90 transition">Save Changes</button>
              <button onClick={() => setEditMember(null)} className="flex-1 rounded-lg border border-gray-300 py-2 text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
