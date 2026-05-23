import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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

const MOCK_MEMBERS = [
  { memberId: 'TIWTN-2026-00001', fullName: 'Mohamed Idhrees', dob: '1990-05-15', bloodGroup: 'O+', mobile: '9344168518', district: 'கடலூர்', address: 'Cuddalore', joinDate: '19-05-2026', nomineeName: 'Sameha', photoPreview: null },
  { memberId: 'TIWTN-2026-00002', fullName: 'Karthik Raja', dob: '1992-08-20', bloodGroup: 'B+', mobile: '9876543210', district: 'சென்னை', address: 'T Nagar', joinDate: '20-05-2026', nomineeName: 'Lakshmi', photoPreview: null },
  { memberId: 'TIWTN-2026-00003', fullName: 'Suresh Kumar', dob: '1985-12-10', bloodGroup: 'A+', mobile: '9988776655', district: 'கோயம்புத்தூர்', address: 'Gandhipuram', joinDate: '21-05-2026', nomineeName: 'Rani', photoPreview: null },
  { memberId: 'TIWTN-2026-00004', fullName: 'Balaji S', dob: '1988-04-25', bloodGroup: 'O-', mobile: '9443322110', district: 'மதுரை', address: 'Anna Nagar', joinDate: '22-05-2026', nomineeName: 'Meena', photoPreview: null },
  { memberId: 'TIWTN-2026-00005', fullName: 'Prakash M', dob: '1995-11-05', bloodGroup: 'AB+', mobile: '9665544332', district: 'திருச்சிராப்பள்ளி', address: 'Srirangam', joinDate: '22-05-2026', nomineeName: 'Sumathi', photoPreview: null },
  { memberId: 'TIWTN-2026-00006', fullName: 'Ramesh R', dob: '1989-02-14', bloodGroup: 'B-', mobile: '9123456789', district: 'சேலம்', address: 'Meyyanur', joinDate: '23-05-2026', nomineeName: 'Kala', photoPreview: null },
];

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { logout } = useAuth();

  const exportCSV = () => {
    const headers = ['Member ID','Name','DOB','Blood Group','Mobile','District','Address','Nominee','Joined'];
    const rows = MOCK_MEMBERS.map(m => [m.memberId, m.fullName, m.dob, m.bloodGroup, m.mobile, m.district, m.address, m.nomineeName, m.joinDate]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `TIWTN_Members_${Date.now()}.csv`;
    a.click();
  };

  const filteredMembers = MOCK_MEMBERS.filter(m => {
    const matchSearch = m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        m.mobile.includes(searchQuery) || 
                        m.memberId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDistrict = districtFilter ? m.district === districtFilter : true;
    return matchSearch && matchDistrict;
  });

  const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const districtsCount = TAMIL_NADU_DISTRICTS.map(dist => ({
    name: dist,
    count: MOCK_MEMBERS.filter(m => m.district === dist).length
  }));

  const activeDistricts = districtsCount.filter(d => d.count > 0).length;

  return (
    <div className="flex min-h-screen bg-[#F4F7FA]">
      {/* SIDEBAR */}
      <div className="w-[220px] bg-[#003366] text-white flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#FFB347] flex items-center justify-center font-bold text-black text-sm">A</div>
          <span className="font-bold text-lg tracking-wide text-white">Admin Panel</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-4 py-3 rounded text-sm transition ${activeTab === 'overview' ? 'bg-white/10 text-[#FFB347] border-l-4 border-[#FFB347]' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
            📊 Overview
          </button>
          <button onClick={() => setActiveTab('members')} className={`w-full text-left px-4 py-3 rounded text-sm transition ${activeTab === 'members' ? 'bg-white/10 text-[#FFB347] border-l-4 border-[#FFB347]' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
            👥 All Members
          </button>
          <button onClick={() => setActiveTab('district')} className={`w-full text-left px-4 py-3 rounded text-sm transition ${activeTab === 'district' ? 'bg-white/10 text-[#FFB347] border-l-4 border-[#FFB347]' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
            🗺️ By District
          </button>
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
        
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-5xl">
            <h2 className="text-2xl font-bold text-[#003366]">Dashboard Overview</h2>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-lg border-l-4 border-[#FFB347] shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Total Members</p>
                <p className="text-4xl font-display text-[#003366] mt-2">{MOCK_MEMBERS.length}</p>
              </div>
              <div className="bg-white p-5 rounded-lg border-l-4 border-[#FFB347] shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Today Registered</p>
                <p className="text-4xl font-display text-[#003366] mt-2">1</p>
              </div>
              <div className="bg-white p-5 rounded-lg border-l-4 border-[#FFB347] shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Districts Covered</p>
                <p className="text-4xl font-display text-[#003366] mt-2">{activeDistricts}</p>
              </div>
              <div className="bg-white p-5 rounded-lg border-l-4 border-[#FFB347] shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Latest Member</p>
                <p className="text-xl font-bold text-[#003366] mt-3 truncate">{MOCK_MEMBERS[MOCK_MEMBERS.length-1].fullName}</p>
              </div>
            </div>

            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-semibold text-[#003366]">Recent Registrations</h3>
              </div>
              <div className="p-0">
                {MOCK_MEMBERS.slice(-5).reverse().map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FFB347]/20 text-[#FF6B00] flex items-center justify-center font-bold text-sm">
                        {m.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{m.fullName}</p>
                        <p className="text-xs text-gray-500">{m.district}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-[#003366]">{m.memberId}</p>
                      <p className="text-xs text-gray-500">{m.joinDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 p-3 rounded-lg border border-gray-200 text-black focus:outline-none focus:border-[#FFB347] focus:ring-1 focus:ring-[#FFB347] shadow-sm"
              />
              <select 
                value={districtFilter}
                onChange={e => {setDistrictFilter(e.target.value); setCurrentPage(1);}}
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
                  {paginatedMembers.map((m, idx) => (
                    <tr key={m.memberId} className="border-b border-gray-100 hover:bg-gray-50 hover:border-l-4 hover:border-l-[#FFB347] transition-all group">
                      <td className="p-4 text-gray-500 group-hover:pl-3">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td className="p-4">
                        <div className="w-9 h-9 rounded-full bg-[#FFB347]/20 text-[#FF6B00] flex items-center justify-center font-bold text-xs border border-[#FFB347]/30">
                          {m.fullName.charAt(0)}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-gray-800">{m.fullName}</td>
                      <td className="p-4 font-mono text-[#003366] text-xs">{m.memberId}</td>
                      <td className="p-4 text-gray-600">{m.district}</td>
                      <td className="p-4 text-gray-600">{m.mobile}</td>
                      <td className="p-4 text-gray-600">{m.joinDate}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => setSelectedMember(m)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition" title="View Details">
                          👁️ View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedMembers.length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-500">No members found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <span className="text-sm text-gray-600">
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredMembers.length)} to {Math.min(currentPage * itemsPerPage, filteredMembers.length)} of {filteredMembers.length} members
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm text-black disabled:opacity-50 hover:bg-white transition"
                  >
                    Prev
                  </button>
                  <button 
                    disabled={currentPage * itemsPerPage >= filteredMembers.length} 
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm text-black disabled:opacity-50 hover:bg-white transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'district' && (
          <div className="max-w-6xl">
            <h2 className="text-2xl font-bold text-[#003366] mb-6">Members by District</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {districtsCount.map(d => (
                <button 
                  key={d.name} 
                  onClick={() => {
                    setDistrictFilter(d.name);
                    setActiveTab('members');
                    setCurrentPage(1);
                  }}
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

      {/* MEMBER VIEW MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
            <button 
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-black hover:bg-gray-200 z-10"
            >
              ✕
            </button>
            
            <div className="p-8 flex-1 overflow-y-auto border-r border-gray-100">
              <h3 className="text-2xl font-bold text-[#003366] mb-6 border-b pb-2">Member Details</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">Full Name</p>
                  <p className="font-semibold text-gray-900">{selectedMember.fullName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">Member ID</p>
                  <p className="font-mono text-[#003366] font-bold bg-blue-50 px-2 py-1 rounded inline-block">{selectedMember.memberId}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">Mobile</p>
                  <p className="font-semibold text-gray-900">{selectedMember.mobile}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">Date of Birth</p>
                  <p className="font-semibold text-gray-900">{selectedMember.dob}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">Blood Group</p>
                  <p className="font-semibold text-red-600 bg-red-50 px-2 py-1 rounded inline-block">{selectedMember.bloodGroup}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">District</p>
                  <p className="font-semibold text-gray-900">{selectedMember.district}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs uppercase mb-1">Address</p>
                  <p className="font-semibold text-gray-900">{selectedMember.address}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">Nominee Name</p>
                  <p className="font-semibold text-gray-900">{selectedMember.nomineeName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">Joined Date</p>
                  <p className="font-semibold text-gray-900">{selectedMember.joinDate}</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50 flex items-center justify-center min-w-[350px]">
              <div className="transform scale-90 origin-center">
                <IDCard member={selectedMember} />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
