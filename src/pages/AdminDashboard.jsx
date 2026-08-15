import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/client';
import IDCard from '../components/IDCard';
import { generateMemberId } from '../utils/memberIdUtils';
import { printMemberForm } from '../utils/printMemberForm';
import { bulkDownloadMembers } from '../utils/bulkDownload.jsx';
import PageLoader from '../components/PageLoader';

const getPhotoSrc = (member) =>
  member?.photo_url ||
  member?.photo_base64 ||
  member?.photoPreview ||
  null;

const TAMIL_NADU_DISTRICTS = [
  "அரியலூர்",
  "ஈரோடு",
  "காஞ்சிபுரம்",
  "காரைக்கால்",
  "கடலூர்",
  "கரூர்",
  "கன்னியாகுமரி",
  "கள்ளக்குறிச்சி",
  "கிருஷ்ணகிரி",
  "கோயம்புத்தூர்",
  "சிவகங்கை",
  "சேலம்",
  "செங்கல்பட்டு",
  "சென்னை",
  "தஞ்சாவூர்",
  "தர்மபுரி",
  "திண்டுக்கல்",
  "திருச்சிராப்பள்ளி",
  "திருநெல்வேலி",
  "திருப்பத்தூர்",
  "திருப்பூர்",
  "திருவண்ணாமலை",
  "திருவாரூர்",
  "திருவள்ளூர்",
  "தூத்துக்குடி",
  "தேனி",
  "தென்காசி",
  "நாகப்பட்டினம்",
  "நாமக்கல்",
  "நீலகிரி",
  "பெரம்பலூர்",
  "புதுக்கோட்டை",
  "புதுச்சேரி",
  "மதுரை",
  "மயிலாடுதுறை",
  "ராணிப்பேட்டை",
  "ராமநாதபுரம்",
  "விருதுநகர்",
  "விழுப்புரம்",
  "வேலூர்"
];

const ITEMS_PER_PAGE = 10;

const displayAadhar = (aadhar) => {
  if (!aadhar) return '-'
  return String(aadhar)
}

function formatDateDisplay() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
}

const EMPTY_REGISTER_FORM = {
  fullName: '', posting: '', address: '', companyAddress: '', bloodGroup: '',
  dob: '', aadhaar: '', mobile: '', nomineeName: '', nomineeMobile: '',
  pledgeDistrict: '', pledgeBranch: '', referral: '', pledgeName: '',
  photoPreview: null,
  photoFile: null,
  joinDate: formatDateDisplay(),
};

const NAV = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'pending',  icon: '⏳', label: 'Pending Approval' },
  { id: 'rejected', icon: '❌', label: 'Rejected (Fix & Upload)' },
  { id: 'members',  icon: '👥', label: 'All Members' },
  { id: 'district', icon: '🗺️', label: 'By District' },
  { id: 'register', icon: '📝', label: 'Register Member' },
  { id: 'users',    icon: '🙍', label: 'All Users' },
  { id: 'gallery',  icon: '🖼️', label: 'Gallery' },
];

// ── Album card for admin gallery ──────────────────────────────
function AlbumAdminCard({ album, onDeleteAlbum, onDeleteImage }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      border: '1px solid #f0f0f0',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Cover image */}
      <div style={{ position: 'relative' }}>
        <img
          src={album.cover}
          alt={album.title}
          style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
        />
        {/* Photo count badge */}
        <div style={{
          position: 'absolute', top: '8px', right: '8px',
          background: 'rgba(0,0,0,0.65)',
          color: '#fff', borderRadius: '20px',
          padding: '2px 8px', fontSize: '11px', fontWeight: '700',
        }}>
          📷 {album.images.length}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px', flex: 1 }}>
        <span style={{
          fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px',
          background: '#FFF3E0', color: '#E65100',
          padding: '2px 8px', borderRadius: '20px', fontWeight: '700'
        }}>{album.category}</span>
        <p style={{
          fontWeight: '700', fontSize: '13px', color: '#1a1a1a',
          marginTop: '6px', overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>{album.title}</p>
        <p style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
          {album.images.length} photo{album.images.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Actions */}
      <div style={{
        borderTop: '1px solid #f5f5f5',
        padding: '8px 12px',
        display: 'flex', gap: '8px', alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            fontSize: '11px', color: '#003366', fontWeight: '600',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0
          }}
        >
          {expanded ? '▲ Hide Photos' : '▼ View Photos'}
        </button>
        <button
          onClick={onDeleteAlbum}
          style={{
            fontSize: '11px', color: '#ef4444', fontWeight: '600',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0
          }}
        >
          🗑️ Delete Album
        </button>
      </div>

      {/* Expanded individual photo grid */}
      {expanded && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '4px', padding: '8px 12px 12px',
          borderTop: '1px solid #f5f5f5',
          maxHeight: '200px', overflowY: 'auto'
        }}>
          {album.images.map((img, i) => (
            <div key={img.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: '6px', overflow: 'hidden' }}>
              <img src={img.image_url} alt={`Photo ${i+1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                onClick={() => onDeleteImage(img)}
                style={{
                  position: 'absolute', top: '3px', right: '3px',
                  background: 'rgba(0,0,0,0.6)', color: '#fff',
                  border: 'none', borderRadius: '50%',
                  width: '18px', height: '18px',
                  fontSize: '9px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title="Delete this photo"
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Verify section removed

// Compress a raw File to a JPEG Blob (max 800px, 75% quality) before Storage upload
const compressImageFile = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 800;
      let { width, height } = img;
      if (width > height) {
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
      } else {
        if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob || file),
        'image/jpeg',
        0.75
      );
    };
    img.onerror = () => resolve(file);
    img.src = e.target.result;
  };
  reader.onerror = () => resolve(file);
  reader.readAsDataURL(file);
});

function AdminDashboard() {
  const [activeTab, setActiveTab]           = useState('overview');
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [members, setMembers]               = useState([]);
  const [users, setUsers]                   = useState([]);
  const [loadingData, setLoadingData]       = useState(true);
  const [searchQuery, setSearchQuery]       = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [rejectedDistrictFilter, setRejectedDistrictFilter] = useState('');
  const [rejectedSearchQuery, setRejectedSearchQuery]       = useState('');
  const [districtTabStatusFilter, setDistrictTabStatusFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);
  const [editMember, setEditMember]         = useState(null);
  const [currentPage, setCurrentPage]       = useState(1);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [editPhotoFile, setEditPhotoFile]       = useState(null);
  const [savingEdit, setSavingEdit]             = useState(false);
  const [regeneratingId, setRegeneratingId]     = useState(false);

  const [migrating, setMigrating]       = useState(false);
  const [syncRemaining, setSyncRemaining] = useState(0);
  const isMigrating = useRef(false); // guard against duplicate runs
  const realtimeTimerRef = useRef(null); // debounce postgres changes

  // When modal opens:
  useEffect(() => {
    if (editMember) {
      setEditPhotoPreview(
        editMember.photo_url ||
        editMember.photo_base64 ||
        null
      );
      setEditPhotoFile(null);
      setEditMember(prev => ({
        ...prev,
        _original_member_id: prev.member_id,
        _original_district: prev.district,
        _original_photo_url: prev.photo_url,
        _original_photo_base64: prev.photo_base64
      }));
    }
  }, [editMember?.member_id]);

  // Photo file input handler:
  const handleEditPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Max 2MB');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setEditPhotoFile(file);
  };

  const [newMember, setNewMember]               = useState(EMPTY_REGISTER_FORM);
  const [adminPhotoPreview, setAdminPhotoPreview] = useState(null);
  const [regErrors, setRegErrors]           = useState({});
  const [regSubmitting, setRegSubmitting]   = useState(false);
  const [regSuccess, setRegSuccess]         = useState(null);
  const [galleryItems, setGalleryItems]     = useState([]);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [newGalleryItem, setNewGalleryItem] = useState({
    title: '', category: 'EVENTS', image_url: '', description: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const joiningDate = useMemo(() => formatDateDisplay(), []);

  const { logout, userProfile } = useAuth();

  // ── Data loaders ─────────────────────────────────────────────
  const loadMembers = async () => {
    let allMembers = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('members')
        .select('id, member_id, user_id, full_name, posting, dob, blood_group, mobile, aadhar, district, address, org_address, nominee_name, nominee_phone, branch, join_date, registered_at, referrer, photo_url, status, rejection_reason, approved_at, approved_by')
        .order('registered_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error('Error loading members batch:', error);
        break;
      }
      if (data && data.length > 0) {
        allMembers = [...allMembers, ...data];
        hasMore = data.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }
    setMembers(allMembers);
  };
  const loadUsers = async () => {
    let allUsers = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, has_registered, created_at')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error('Error loading users batch:', error);
        break;
      }
      if (data && data.length > 0) {
        allUsers = [...allUsers, ...data];
        hasMore = data.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }
    setUsers(allUsers);
  };
  const loadGallery = async () => {
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    if (data) setGalleryItems(data);
  };

  const fetchMultipleMemberPhotos = async (memberIds) => {
    if (!memberIds || memberIds.length === 0) return [];
    const { data } = await supabase
      .from('members')
      .select('member_id, photo_url, photo_base64')
      .in('member_id', memberIds);
    return data || [];
  };

  // ── Auto-migrate legacy base64 photos → Supabase Storage (silent) ──
  const migrateLegacyPhotos = async () => {
    if (isMigrating.current) return; // already running
    isMigrating.current = true;
    setMigrating(true);

    try {
      const { data: legacy, error } = await supabase
        .from('members')
        .select('member_id, photo_base64')
        .not('photo_base64', 'is', null)
        .is('photo_url', null);

      if (error || !legacy || legacy.length === 0) {
        console.log('[PhotoSync] No legacy photos to migrate.');
        return;
      }

      console.log(`[PhotoSync] Starting auto-migration for ${legacy.length} member(s)...`);
      setSyncRemaining(legacy.length);

      const BATCH = 10;
      for (let i = 0; i < legacy.length; i += BATCH) {
        const batch = legacy.slice(i, i + BATCH);

        for (const member of batch) {
          try {
            const base64 = member.photo_base64;
            const [meta, b64data] = base64.split(',');
            const mimeMatch = meta?.match(/data:([^;]+);/);
            const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            const byteStr = atob(b64data);
            const bytes = new Uint8Array(byteStr.length);
            for (let j = 0; j < byteStr.length; j++) bytes[j] = byteStr.charCodeAt(j);
            const blob = new Blob([bytes], { type: mime });

            const path = `members/${member.member_id}`;
            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from('member-photos')
              .upload(path, blob, { contentType: mime, upsert: true });
            if (uploadErr) throw uploadErr;

            const { data: urlData } = supabase.storage
              .from('member-photos')
              .getPublicUrl(uploadData.path);

            const { error: updateErr } = await supabase
              .from('members')
              .update({ photo_url: urlData.publicUrl, photo_base64: null })
              .eq('member_id', member.member_id);
            if (updateErr) throw updateErr;

            console.log(`[PhotoSync] ✓ ${member.member_id}`);
          } catch (err) {
            console.error(`[PhotoSync] ✗ ${member.member_id}:`, err);
          }
          setSyncRemaining(prev => Math.max(0, prev - 1));
        }

        // Pause 500ms between batches to avoid rate-limiting
        if (i + BATCH < legacy.length) {
          await new Promise(r => setTimeout(r, 500));
        }
      }

      console.log('[PhotoSync] Auto-migration complete. Refreshing member list...');
      await loadMembers();
    } finally {
      setSyncRemaining(0);
      setMigrating(false);
      isMigrating.current = false;
    }
  };

  const fetchSingleMemberPhoto = async (memberId) => {
    const { data } = await supabase
      .from('members')
      .select('photo_url, photo_base64')
      .eq('member_id', memberId)
      .maybeSingle();
    return {
      photo_url: data?.photo_url || null,
      photo_base64: data?.photo_base64 || null
    };
  };

  const handleViewMember = async (member) => {
    setSelectedMember(member);
    if (!member.photo_url && !member.photo_base64) {
      const photos = await fetchSingleMemberPhoto(member.member_id);
      if (photos.photo_url || photos.photo_base64) {
        setSelectedMember(prev => prev && prev.member_id === member.member_id ? { ...prev, ...photos } : prev);
        setMembers(prev => prev.map(m => m.member_id === member.member_id ? { ...m, ...photos } : m));
      }
    }
  };

  const handleEditMemberClick = async (member) => {
    setEditMember({ ...member });
    if (!member.photo_url && !member.photo_base64) {
      const photos = await fetchSingleMemberPhoto(member.member_id);
      if (photos.photo_url || photos.photo_base64) {
        setEditMember(prev => prev && prev.member_id === member.member_id ? { ...prev, ...photos } : prev);
        setMembers(prev => prev.map(m => m.member_id === member.member_id ? { ...m, ...photos } : m));
      }
    }
  };

  const handlePrintMember = async (member) => {
    if (!member.photo_url && !member.photo_base64) {
      const photos = await fetchSingleMemberPhoto(member.member_id);
      if (photos.photo_url || photos.photo_base64) {
        printMemberForm({ ...member, ...photos });
        return;
      }
    }
    printMemberForm(member);
  };

  useEffect(() => {
    Promise.all([loadMembers(), loadUsers(), loadGallery()]).finally(() => setLoadingData(false));
    
    const handleRealtimeChange = () => {
      if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
      realtimeTimerRef.current = setTimeout(() => {
        loadMembers();
      }, 500);
    };

    const sub = supabase.channel('admin-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, handleRealtimeChange)
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
      if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
    };
  }, []);

  // ── Auto-migrate on mount + every 5 min ──
  useEffect(() => {
    // Wait briefly for initial data load to settle, then run
    const initial = setTimeout(() => migrateLegacyPhotos(), 3000);

    // Re-check every 5 minutes (catches new legacy registrations)
    const poll = setInterval(() => migrateLegacyPhotos(), 5 * 60 * 1000);

    return () => {
      clearTimeout(initial);
      clearInterval(poll);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Lazy-load photos for the visible page (batch queries)
  useEffect(() => {
    const missingPhotos = paginatedMembers.filter(m => !m.photo_url && !m.photo_base64);
    if (missingPhotos.length === 0) return;

    const ids = missingPhotos.map(m => m.member_id);
    fetchMultipleMemberPhotos(ids).then(results => {
      if (results.length === 0) return;
      setMembers(prev => prev.map(m => {
        const found = results.find(r => r.member_id === m.member_id);
        return found ? { ...m, photo_url: found.photo_url, photo_base64: found.photo_base64 } : m;
      }));
    });
  }, [currentPage, searchQuery, districtFilter, members.length]);

  // Lazy-load photos for the recent registrations on Overview dashboard (batch queries)
  useEffect(() => {
    if (activeTab === 'overview') {
      const recentMembers = members.slice(0, 8);
      const missingPhotos = recentMembers.filter(m => !m.photo_url && !m.photo_base64);
      if (missingPhotos.length === 0) return;

      const ids = missingPhotos.map(m => m.member_id);
      fetchMultipleMemberPhotos(ids).then(results => {
        if (results.length === 0) return;
        setMembers(prev => prev.map(m => {
          const found = results.find(r => r.member_id === m.member_id);
          return found ? { ...m, photo_url: found.photo_url, photo_base64: found.photo_base64 } : m;
        }));
      });
    }
  }, [activeTab, members.length]);

  // ── Derived ─────────────────────────────────────────────────
  const pendingCount = useMemo(() => members.filter(m => m.status === 'pending').length, [members]);
  const rejectedCount = useMemo(() => members.filter(m => m.status === 'rejected').length, [members]);
  const approvedCount = useMemo(() => members.filter(m => m.status === 'approved').length, [members]);

  const rejectedMembers = useMemo(() => {
    return members.filter(m => m.status === 'rejected');
  }, [members]);

  const filteredRejectedMembers = useMemo(() => {
    return rejectedMembers.filter(m => {
      const q = rejectedSearchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        m.full_name?.toLowerCase().includes(q) ||
        m.mobile?.includes(q) ||
        m.member_id?.toLowerCase().includes(q) ||
        m.rejection_reason?.toLowerCase().includes(q) ||
        m.aadhar?.includes(q);
      const matchDistrict = !rejectedDistrictFilter || m.district === rejectedDistrictFilter;
      return matchSearch && matchDistrict;
    });
  }, [rejectedMembers, rejectedSearchQuery, rejectedDistrictFilter]);

  const rejectedDistrictsSummary = useMemo(() => {
    const map = {};
    rejectedMembers.forEach(m => {
      if (m.district) {
        map[m.district] = (map[m.district] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [rejectedMembers]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || m.full_name?.toLowerCase().includes(q) || m.mobile?.includes(q) || m.member_id?.toLowerCase().includes(q);
      const matchDistrict = !districtFilter || m.district === districtFilter;
      return matchSearch && matchDistrict;
    });
  }, [members, searchQuery, districtFilter]);

  const totalPages = useMemo(() => Math.ceil(filteredMembers.length / ITEMS_PER_PAGE), [filteredMembers.length]);
  
  const paginatedMembers = useMemo(() => {
    return filteredMembers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredMembers, currentPage]);

  const todayCount = useMemo(() => {
    // Use IST timezone to avoid UTC↔IST date mismatch
    const todayIST = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    return members.filter(m => {
      if (!m.registered_at) return false;
      return new Date(m.registered_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) === todayIST;
    }).length;
  }, [members]);

  const districtsCount = useMemo(() => {
    return TAMIL_NADU_DISTRICTS.map(dist => {
      const distMembers = members.filter(m => m.district === dist);
      const total = distMembers.length;
      const approved = distMembers.filter(m => m.status === 'approved').length;
      const pending = distMembers.filter(m => m.status === 'pending').length;
      const rejected = distMembers.filter(m => m.status === 'rejected').length;
      return {
        name: dist,
        count: total,
        approved,
        pending,
        rejected
      };
    });
  }, [members]);

  const activeDistricts = useMemo(() => districtsCount.filter(d => d.count > 0).length, [districtsCount]);

  // ── Actions ──────────────────────────────────────────────────
  const handleRegenerateDistrictId = async (targetDistrict) => {
    if (!targetDistrict) {
      alert('தயவுசெய்து மாவட்டத்தை தேர்ந்தெடுக்கவும் / Please select a district first');
      return;
    }
    setRegeneratingId(true);
    try {
      const newId = await generateMemberId(targetDistrict);
      setEditMember(prev => ({
        ...prev,
        member_id: newId,
        district: targetDistrict
      }));
      alert(`✅ புதிய அடையாள எண் உருவாக்கப்பட்டது / Generated new ID: ${newId}`);
    } catch (err) {
      console.error('Error generating ID:', err);
      alert('Error generating ID: ' + err.message);
    } finally {
      setRegeneratingId(false);
    }
  };

  const deleteMember = async (memberId, userId) => {
    if (!window.confirm('Delete this member?')) return;
    await supabase.from('members').delete().eq('member_id', memberId);
    if (userId) await supabase.from('users').update({ has_registered: false, member_id: null }).eq('id', userId);
    await loadMembers();
    setSelectedMember(null);
  };

  const approveMember = async (member) => {
    const { error } = await supabase
      .from('members')
      .update({
        status: 'approved',
        rejection_reason: null,
        approved_at: new Date().toISOString(),
        approved_by: userProfile?.name || 'Admin'
      })
      .eq('member_id', member.member_id);

    if (!error) {
      try {
        const payload = new FormData();
        payload.append('access_key', import.meta.env.VITE_WEB3FORMS_KEY);
        payload.append('subject', '\u2705 \u0b89\u0bb1\u0bc1\u0baa\u0bcd\u0baa\u0bbf\u0ba9\u0bb0\u0bcd \u0b85\u0ba9\u0bc1\u0bae\u0ba4\u0bbf / Membership Approved: ' + member.full_name);
        payload.append('from_name', 'TIWTN Admin');
        payload.append('message',
          '\u0b85\u0ba9\u0bcd\u0baa\u0bc1\u0bb3\u0bcd\u0bb3 ' + member.full_name + ',\n\n' +
          '\u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0ba4\u0bc6\u0ba9\u0bcd\u0ba9\u0bbf\u0ba8\u0bcd\u0ba4\u0bbf\u0baf \u0bb5\u0bc6\u0bb2\u0bcd\u0b9f\u0bbf\u0b99\u0bcd \u0ba4\u0bca\u0bb4\u0bbf\u0bb2\u0bbe\u0bb3\u0bb0\u0bcd\u0b95\u0bb3\u0bcd \u0ba8\u0bb2\u0b9a\u0bcd\u0b9a\u0b99\u0bcd\u0b95 \u0b89\u0bb1\u0bc1\u0baa\u0bcd\u0baa\u0bbf\u0ba9\u0bb0\u0bcd \u0bb5\u0bbf\u0ba3\u0bcd\u0ba3\u0baa\u0bcd\u0baa\u0bae\u0bcd \u0b85\u0ba8\u0bc1\u0bae\u0ba4\u0bbf\u0b95\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f\u0ba4\u0bc1!\n\n' +
          '\u0b89\u0bb1\u0bc1\u0baa\u0bcd\u0baa\u0bbf\u0ba9\u0bb0\u0bcd \u0b8e\u0ba3\u0bcd / Member ID: ' + member.member_id + '\n' +
          '\u0bae\u0bbe\u0bb5\u0b9f\u0bcd\u0b9f\u0bae\u0bcd / District: ' + member.district + '\n\n' +
          'Dear ' + member.full_name + ',\n\nYour membership has been APPROVED!\n' +
          'Login to download your ID card:\nhttps://www.thennindiaweldingthozhilaalargalnalasangam.org/profile\n\n- TIWTN Admin Team'
        );
        await fetch('https://api.web3forms.com/submit', { method: 'POST', body: payload });
      } catch (err) {
        console.error('Email error:', err);
      }
      await loadMembers();
      alert('\u2705 ' + member.full_name + ' \u0b85\u0ba8\u0bc1\u0bae\u0ba4\u0bbf\u0b95\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f\u0bbe\u0bb0\u0bcd!');
    }
  };

  const rejectMember = async (member) => {
    const reason = window.prompt(
      '\u0ba8\u0bbf\u0bb0\u0bbe\u0b95\u0bb0\u0bbf\u0baa\u0bcd\u0baa\u0bc1 \u0b95\u0bbe\u0bb0\u0ba3\u0bae\u0bcd / Rejection reason for ' + member.full_name + ':\n(This will be shown to the member)'
    );
    if (reason === null) return;
    if (!reason.trim()) { alert('\u0b95\u0bbe\u0bb0\u0ba3\u0bae\u0bcd \u0b89\u0bb3\u0bcd\u0bb3\u0bbf\u0b9f\u0bb5\u0bc1\u0bae\u0bcd / Please enter a reason'); return; }

    const { error } = await supabase
      .from('members')
      .update({ status: 'rejected', rejection_reason: reason.trim() })
      .eq('member_id', member.member_id);

    if (!error) {
      try {
        const payload = new FormData();
        payload.append('access_key', import.meta.env.VITE_WEB3FORMS_KEY);
        payload.append('subject', '\u274c \u0bb5\u0bbf\u0ba3\u0bcd\u0ba3\u0baa\u0bcd\u0baa\u0bae\u0bcd \u0ba8\u0bbf\u0bb0\u0bbe\u0b95\u0bb0\u0bbf\u0baa\u0bcd\u0baa\u0bc1 / Application Rejected: ' + member.full_name);
        payload.append('from_name', 'TIWTN Admin');
        payload.append('message',
          '\u0b85\u0ba9\u0bcd\u0baa\u0bc1\u0bb3\u0bcd\u0bb3 ' + member.full_name + ',\n\n' +
          '\u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0bb5\u0bbf\u0ba3\u0bcd\u0ba3\u0baa\u0bcd\u0baa\u0bae\u0bcd \u0ba4\u0bb1\u0bcd\u0baa\u0bcb\u0ba4\u0bc1 \u0ba8\u0bbf\u0bb0\u0bbe\u0b95\u0bb0\u0bbf\u0b95\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f\u0ba4\u0bc1.\n\n' +
          '\u0b95\u0bbe\u0bb0\u0ba3\u0bae\u0bcd / Reason: ' + reason + '\n\n' +
          'Dear ' + member.full_name + ',\nYour membership application was rejected.\nReason: ' + reason + '\n\nRe-apply at:\nhttps://www.thennindiaweldingthozhilaalargalnalasangam.org/profile\n\n- TIWTN Admin Team'
        );
        await fetch('https://api.web3forms.com/submit', { method: 'POST', body: payload });
      } catch (err) {
        console.error('Email error:', err);
      }
      await loadMembers();
      alert('\u274c ' + member.full_name + ' \u0ba8\u0bbf\u0bb0\u0bbe\u0b95\u0bb0\u0bbf\u0b95\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f\u0bbe\u0bb0\u0bcd');
    }
  };

  const statusBadge = (status) => {
    const cfg = {
      approved: { bg: '#F0FDF4', color: '#15803D', text: '\u2705 Approved' },
      pending:  { bg: '#FEF3C7', color: '#92400E', text: '\u23f3 Pending' },
      rejected: { bg: '#FEE2E2', color: '#DC2626', text: '\u274c Rejected' },
    };
    const c = cfg[status] || cfg.pending;
    return (
      <span style={{ background: c.bg, color: c.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
        {c.text}
      </span>
    );
  };

  const saveEditMember = async (andApprove = false) => {
    setSavingEdit(true);
    try {
      let newPhotoUrl = editMember.photo_url;
      let newPhotoBase64 = editMember.photo_base64;
      const effectiveMemberId = editMember.member_id;
      const oldMemberId = editMember._original_member_id || editMember.member_id;

      // If admin selected a new photo file
      if (editPhotoFile) {
        try {
          const path = `members/${effectiveMemberId}`; // no extension!
          // Compress before upload
          const compressed = await compressImageFile(editPhotoFile);
          const { data, error } = await supabase.storage
            .from('member-photos')
            .upload(path, compressed, {
              contentType: 'image/jpeg',
              upsert: true  // overwrite existing
            });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from('member-photos')
            .getPublicUrl(data.path);

          // Append cache-buster so browser fetches the fresh image (upsert keeps same URL)
          newPhotoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
          newPhotoBase64 = null; // clear old base64
        } catch (err) {
          console.error('Photo upload failed:', err);
          alert('படம் பதிவேற்றம் தோல்வி / Photo upload failed');
          setSavingEdit(false);
          return;
        }
      }

      // Sync the details to the users table if a user is linked
      let userIdToUpdate = editMember.user_id;

      if (!userIdToUpdate) {
        // Check if there is a matching user by member_id
        const { data: userByMemberId } = await supabase
          .from('users')
          .select('id')
          .or(`member_id.eq.${oldMemberId},member_id.eq.${effectiveMemberId}`)
          .maybeSingle();

        if (userByMemberId) {
          userIdToUpdate = userByMemberId.id;
        } else if (editMember.mobile) {
          // Fallback: check by mobile
          const { data: userByMobile } = await supabase
            .from('users')
            .select('id')
            .eq('mobile', editMember.mobile)
            .maybeSingle();
          if (userByMobile) {
            userIdToUpdate = userByMobile.id;
          }
        }
      }

      if (userIdToUpdate) {
        // Sync the user's name, mobile, and member_id
        await supabase
          .from('users')
          .update({
            name: editMember.full_name,
            mobile: editMember.mobile,
            has_registered: true,
            member_id: effectiveMemberId
          })
          .eq('id', userIdToUpdate);
      }

      const updatePayload = {
        member_id: effectiveMemberId,
        user_id: userIdToUpdate || editMember.user_id || null,
        full_name: editMember.full_name,
        posting: editMember.posting,
        dob: editMember.dob,
        mobile: editMember.mobile,
        aadhar: editMember.aadhar,
        address: editMember.address,
        org_address: editMember.org_address,
        district: editMember.district,
        branch: editMember.branch,
        blood_group: editMember.blood_group,
        nominee_name: editMember.nominee_name,
        nominee_phone: editMember.nominee_phone,
        photo_url: newPhotoUrl || null,
        photo_base64: newPhotoBase64 || null
      };

      if (andApprove) {
        updatePayload.status = 'approved';
        updatePayload.rejection_reason = null;
        updatePayload.approved_at = new Date().toISOString();
        updatePayload.approved_by = userProfile?.name || 'Admin';
      }

      let memberUpdateQuery = supabase.from('members').update(updatePayload);
      if (editMember.id) {
        memberUpdateQuery = memberUpdateQuery.eq('id', editMember.id);
      } else {
        memberUpdateQuery = memberUpdateQuery.eq('member_id', oldMemberId);
      }

      const { error } = await memberUpdateQuery;

      if (error) throw error;

      if (andApprove) {
        try {
          const payload = new FormData();
          payload.append('access_key', import.meta.env.VITE_WEB3FORMS_KEY);
          payload.append('subject', '✅ உறுப்பினர் அனுமதி / Membership Approved: ' + editMember.full_name);
          payload.append('from_name', 'TIWTN Admin');
          payload.append('message',
            'அன்புள்ள ' + editMember.full_name + ',\n\n' +
            'உங்கள் தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்க உறுப்பினர் விண்ணப்பம் அனுமதிக்கப்பட்டது!\n\n' +
            'உறுப்பினர் எண் / Member ID: ' + effectiveMemberId + '\n' +
            'மாவட்டம் / District: ' + editMember.district + '\n\n' +
            'Dear ' + editMember.full_name + ',\n\nYour membership has been APPROVED!\n' +
            'Login to download your ID card:\nhttps://www.thennindiaweldingthozhilaalargalnalasangam.org/profile\n\n- TIWTN Admin Team'
          );
          await fetch('https://api.web3forms.com/submit', { method: 'POST', body: payload });
        } catch (err) {
          console.error('Email error:', err);
        }
      }

      setEditMember(null);
      setEditPhotoPreview(null);
      setEditPhotoFile(null);
      await loadMembers();
      await loadUsers(); // Refresh users list too
      alert(andApprove ? '✅ திருத்தப்பட்டு அனுமதிக்கப்பட்டது! / Saved & Approved!' : '✅ திருத்தப்பட்டது / Updated!');
    } catch (err) {
      console.error('Save error:', err);
      alert('Error: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };
  const changeUserRole = async (userId, newRole) => {
    await supabase.from('users').update({ role: newRole }).eq('id', userId);
    await loadUsers();
  };
  const exportCSV = () => {
    const headers = ['Member ID','Full Name','Posting','DOB','Blood Group','Mobile','Aadhar','District','Address','Nominee','Branch','Joined Date','Registered At'];
    const rows = members.map(m => [m.member_id, m.full_name, m.posting, m.dob, m.blood_group, m.mobile, m.aadhar, m.district, m.address, m.nominee_name, m.branch, m.join_date, new Date(m.registered_at).toLocaleDateString('en-IN')]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `TIWTN_Members_${Date.now()}.csv`; a.click();
  };
  const toIdCardShape = (m) => m ? ({ memberId: m.member_id, fullName: m.full_name, posting: m.posting, dob: m.dob, bloodGroup: m.blood_group, mobile: m.mobile, district: m.district, address: m.address, nomineeName: m.nominee_name, joinDate: m.join_date, pledgeDistrict: m.district, pledgeBranch: m.branch, photo_url: m.photo_url, photo_base64: m.photo_base64, photoPreview: m.photo_base64, aadhar: m.aadhar, aadhaar: m.aadhar }) : null;

  // ── Register on behalf ───────────────────────────────────────
  const handleRegChange = (field) => (e) => {
    setNewMember(prev => ({ ...prev, [field]: e.target.value }));
    if (regErrors[field]) setRegErrors(prev => { const n = {...prev}; delete n[field]; return n; });
  };

  const compressMemberPhoto = (base64Str) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const handleAdminPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('படக் கோப்பு மட்டுமே / Images only');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('2MB க்கு கீழ் / Max 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAdminPhotoPreview(reader.result);
      setNewMember(prev => ({
        ...prev,
        photoPreview: reader.result,
        photoFile: file
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateReg = () => {
    const e = {};
    if (!newMember.fullName.trim()) e.fullName = 'இந்த தகவல் அவசியம்';
    if (!newMember.address.trim()) e.address = 'இந்த தகவல் அவசியம்';
    if (!newMember.bloodGroup) e.bloodGroup = 'இந்த தகவல் அவசியம்';
    if (!newMember.dob) e.dob = 'இந்த தகவல் அவசியம்';
    if (!newMember.aadhaar || !newMember.aadhaar.match(/^\d{12}$/)) e.aadhaar = 'சரியான ஆதார் எண் உள்ளிடுக';
    if (!newMember.mobile || !newMember.mobile.match(/^\d{10}$/)) e.mobile = 'சரியான செல் நம்பர் உள்ளிடுக';
    if (!newMember.pledgeDistrict || newMember.pledgeDistrict === '') e.pledgeDistrict = 'மாவட்டம் தேர்வு செய்க';
    return e;
  };
  const sendAdminNotification = async (formData, memberId) => {
    try {
      const payload = new FormData();
      payload.append(
        'access_key',
        import.meta.env.VITE_WEB3FORMS_KEY
      );
      payload.append(
        'subject',
        `புதிய உறுப்பினர் பதிவு: ${formData.fullName} | ${memberId}`
      );
      payload.append('from_name', 'TIWTN Registration System');
      payload.append('email', 'idhreesufiyaidhreesufiya@gmail.com');
      payload.append('message', `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
புதிய உறுப்பினர் பதிவு விவரங்கள்
NEW MEMBER REGISTRATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

உறுப்பினர் எண் / Member ID : ${memberId}
பெயர் / Full Name          : ${formData.fullName}
பிறந்த தேதி / DOB          : ${formData.dob}
இரத்த பிரிவு / Blood Group : ${formData.bloodGroup}
கைபேசி / Mobile           : ${formData.mobile}
ஆதார் எண் / Aadhar        : ${formData.aadhaar}
மாவட்டம் / District        : ${formData.pledgeDistrict}
முகவரி / Address           : ${formData.address}
கிளை / Branch              : ${formData.pledgeBranch || '-'}
வாரிசுதாரர் / Nominee      : ${formData.nomineeName || '-'}
பரிந்துரை / Referrer        : ${formData.referral || '-'}
இணைந்த தேதி / Joined       : ${joiningDate}
பதிவு நேரம் / Registered   : ${
  new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata'
  })
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

      const res = await fetch(
        'https://api.web3forms.com/submit',
        { method: 'POST', body: payload }
      );
      const result = await res.json();
      console.log('Email sent:', result);
    } catch (err) {
      console.error('Email error:', err);
    }
  };

  const handleRegSubmit = async () => {
    const errs = validateReg();
    if (Object.keys(errs).length) { setRegErrors(errs); return; }
    setRegSubmitting(true);
    const memberId = await generateMemberId(newMember.pledgeDistrict);

    let photoUrl = null;
    if (newMember.photoFile) {
      try {
        const file = newMember.photoFile;
        const path = `members/${memberId}`; // no extension!
        // Compress before upload
        const compressed = await compressImageFile(file);
        const { data, error } = await supabase.storage
          .from('member-photos')
          .upload(path, compressed, {
            contentType: 'image/jpeg',
            upsert: true
          });
        if (error) throw error;
        const { data: urlData } = supabase.storage
          .from('member-photos')
          .getPublicUrl(data.path);
        // Append cache-buster so browser fetches the fresh image
        photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      } catch (err) {
        console.error('Admin photo upload failed:', err);
      }
    }

    const record = {
      member_id: memberId, user_id: null, full_name: newMember.fullName,
      posting: newMember.posting,
      dob: newMember.dob,
      blood_group: newMember.bloodGroup, mobile: newMember.mobile, aadhar: newMember.aadhaar,
      address: newMember.address, org_address: newMember.companyAddress || '', district: newMember.pledgeDistrict,
      branch: newMember.pledgeBranch || '', nominee_name: newMember.nomineeName || '',
      nominee_phone: newMember.nomineeMobile || '', join_date: joiningDate,
      referrer: newMember.referral || '', 
      photo_url: photoUrl,
      photo_base64: photoUrl ? null : (newMember.photoPreview || null),
      registered_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('members').insert(record).select().single();
    setRegSubmitting(false);
    if (error) { alert('Error: ' + error.message); return; }

    // Fix: mark matching user as registered (find by mobile number)
    if (newMember.mobile) {
      const { data: matchedUser } = await supabase
        .from('users')
        .select('id')
        .eq('mobile', newMember.mobile)
        .maybeSingle();

      // Also try matching by checking members.user_id via email fallback
      const { data: memberWithUser } = await supabase
        .from('members')
        .select('user_id')
        .eq('member_id', memberId)
        .maybeSingle();

      const userIdToUpdate = matchedUser?.id || memberWithUser?.user_id;
      if (userIdToUpdate) {
        await supabase
          .from('users')
          .update({ has_registered: true, member_id: memberId })
          .eq('id', userIdToUpdate);
        // Link user_id in members table too!
        await supabase
          .from('members')
          .update({ user_id: userIdToUpdate })
          .eq('member_id', memberId);
        await loadUsers();
      }
    }

    await sendAdminNotification(newMember, memberId);
    setRegSuccess(data);
    await loadMembers();
  };
  const resetRegForm = () => { setNewMember(EMPTY_REGISTER_FORM); setRegErrors({}); setRegSuccess(null); };

  // ── Gallery actions ──────────────────────────────────────────
  const compressImage = (file) => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const compressed = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressed);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.75); // Compress to 75% quality JPEG
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const uploadSingleImage = async (file) => {
    const compressedFile = await compressImage(file);
    if (!compressedFile) return null;

    const fileExt = 'jpg';
    const fileName = `gallery_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { data, error } = await supabase
      .storage
      .from('gallery-images')
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = supabase
      .storage
      .from('gallery-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleGalleryImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      alert('படக் கோப்புகள் மட்டுமே அனுமதிக்கப்படும் / Only image files allowed');
      return;
    }

    if (galleryItems.length + uploadedImageUrls.length + files.length > 30) {
      alert('இலவச கணக்கு வரம்பு: கேலரியில் அதிகபட்சம் 30 படங்கள் மட்டுமே சேர்க்க முடியும். / Free Account Limit: You can only have up to 30 images in the gallery.');
      return;
    }

    setUploadingImage(true);

    try {
      const urls = [];
      for (const file of files) {
        const publicUrl = await uploadSingleImage(file);
        if (publicUrl) {
          urls.push(publicUrl);
        }
      }
      setUploadedImageUrls(prev => [...prev, ...urls]);
      console.log('Uploaded URLs:', urls);
    } catch (err) {
      console.error('Upload error:', err);
      alert('பதிவேற்றம் தோல்வி / Upload failed: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeUploadedPreviewImage = async (url) => {
    if (url.includes('supabase')) {
      const fileName = url.split('/').pop();
      try {
        await supabase
          .storage
          .from('gallery-images')
          .remove([fileName]);
      } catch (err) {
        console.error('Error deleting file from storage:', err);
      }
    }
    setUploadedImageUrls(prev => prev.filter(item => item !== url));
  };

  // Delete image from storage when gallery item deleted
  const deleteGalleryItem = async (id, imageUrl, silent = false) => {
    if (!silent && !window.confirm(
      'இந்த படத்தை நீக்கவா? / Delete this item?'
    )) return

    // Delete from storage if uploaded to Supabase
    if (imageUrl?.includes('supabase')) {
      const fileName = imageUrl.split('/').pop()
      await supabase
        .storage
        .from('gallery-images')
        .remove([fileName])
    }

    // Delete from database
    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id)

    if (!error) await loadGallery()
    else alert('Error: ' + error.message)
  }

  const closeGalleryForm = async () => {
    // If there are uploaded images that weren't saved, clean them up from storage
    if (uploadedImageUrls.length > 0) {
      const fileNames = uploadedImageUrls
        .filter(url => url.includes('supabase'))
        .map(url => url.split('/').pop());
      
      if (fileNames.length > 0) {
        try {
          await supabase
            .storage
            .from('gallery-images')
            .remove(fileNames);
        } catch (err) {
          console.error('Error cleaning up images:', err);
        }
      }
    }
    setUploadedImageUrls([]);
    setNewGalleryItem({
      title: '', category: 'EVENTS',
      image_url: '', description: ''
    });
    setShowGalleryForm(false);
  };

  const handleGallerySubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newGalleryItem.title.trim() || uploadedImageUrls.length === 0) {
      alert('தலைப்பு மற்றும் படம் அவசியம் / Title and image are required');
      return;
    }

    if (galleryItems.length + uploadedImageUrls.length > 30) {
      alert('இலவச கணக்கு வரம்பு: கேலரியில் அதிகபட்சம் 30 படங்கள் மட்டுமே சேர்க்க முடியும். புதிய படத்தை சேர்க்க பழைய படத்தை நீக்கவும். / Free Account Limit: You can only have up to 30 images in the gallery. Please delete an old photo first.');
      return;
    }

    const records = uploadedImageUrls.map(url => ({
      title: newGalleryItem.title,
      category: newGalleryItem.category,
      image_url: url,
      description: newGalleryItem.description || ''
    }));

    const { error } = await supabase
      .from('gallery')
      .insert(records);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      await loadGallery();
      // Clear state without cleaning up from storage
      setUploadedImageUrls([]);
      setNewGalleryItem({
        title: '', category: 'EVENTS',
        image_url: '', description: ''
      });
      setShowGalleryForm(false);
    }
  };

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
  if (loadingData) {
    return <PageLoader message="நிர்வாக பக்கத் தகவல்களை ஏற்றுகிறது..." />;
  }

  return (
    <div className="min-h-screen admin-dashboard" style={{ background: '#F0F4F9' }}>

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
          fixed top-0 left-0 h-full w-64 z-20 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:w-[240px] md:h-screen md:sticky md:top-0
        `} style={{ background: 'linear-gradient(180deg, #0A1628 0%, #003366 60%, #004080 100%)' }}>

          {/* Sidebar header */}
          <div className="px-5 py-6 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #FF6B00, #FFB347)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '900', color: '#fff', fontSize: '18px',
              boxShadow: '0 4px 12px rgba(255,107,0,0.4)'
            }}>A</div>
            <div>
              <div className="font-bold text-white text-sm tracking-wide">Admin Panel</div>
              <div className="text-[10px] text-white/50 mt-0.5">TIWTN Management</div>
            </div>
          </div>

          {/* Admin info chip */}
          <div className="mx-4 mt-4 mb-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,179,71,0.12)', border: '1px solid rgba(255,179,71,0.2)' }}>
            <div className="text-[10px] text-white/40 uppercase tracking-wider">Logged in as</div>
            <div className="text-xs text-[#FFB347] font-semibold truncate mt-0.5">{userProfile?.email || userProfile?.name || 'Admin'}</div>
          </div>

          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
            {NAV.map(tab => (
              <button key={tab.id} onClick={() => goTab(tab.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-2.5"
                style={activeTab === tab.id ? {
                  background: 'rgba(255,179,71,0.18)',
                  color: '#FFB347',
                  borderLeft: '3px solid #FFB347',
                  fontWeight: '700',
                  paddingLeft: '9px'
                } : {
                  color: 'rgba(255,255,255,0.65)',
                  fontWeight: '500'
                }}>
                <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'pending' && pendingCount > 0 && (
                  <span style={{
                    background: '#EF4444', color: '#fff', borderRadius: '20px',
                    padding: '1px 7px', fontSize: '10px', fontWeight: '700', marginLeft: 'auto'
                  }}>{pendingCount}</span>
                )}
                {tab.id === 'rejected' && rejectedCount > 0 && (
                  <span style={{
                    background: '#DC2626', color: '#fff', borderRadius: '20px',
                    padding: '1px 7px', fontSize: '10px', fontWeight: '700', marginLeft: 'auto'
                  }}>{rejectedCount}</span>
                )}
              </button>
            ))}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />
            <button onClick={() => { exportCSV(); setSidebarOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2.5"
              style={{ color: 'rgba(255,255,255,0.55)' }}>
              <span style={{ fontSize: '16px' }}>📥</span>
              <span>Export CSV</span>
            </button>
          </nav>

          <div className="p-4 border-t border-white/10 flex-shrink-0">
            <button onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{ color: '#FC8181', background: 'rgba(252,129,129,0.08)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(252,129,129,0.16)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(252,129,129,0.08)'}>
              <span>🚪</span> <span className="font-semibold">Logout</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 p-4 md:p-8">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-5xl">
              {/* Header row */}
              <div className="flex flex-wrap gap-3 items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: '#0A1628' }}>Dashboard Overview</h2>
                  <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' })}
                  </p>
                </div>
                <button onClick={() => { loadMembers(); loadUsers(); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: '#F0F4F9', color: '#003366', border: '1px solid #D1D9E6' }}>
                  ↻ Refresh
                </button>
              </div>

              {/* Stat cards */}
              {(() => {
                const notRegistered = users.filter(u => !u.has_registered).length;
                const legacyPhotos  = members.filter(m => m.photo_base64 && !m.photo_url).length;
                const cards = [
                  {
                    label: 'Total Members', value: members.length,
                    sub: 'All time registrations',
                    iconBg: 'linear-gradient(135deg,#FF6B00,#FFB347)', icon: '👥',
                    valueCls: '#FF6B00'
                  },
                  {
                    label: 'Registered Today', value: todayCount,
                    sub: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' }),
                    iconBg: 'linear-gradient(135deg,#16A34A,#4ADE80)', icon: '✅',
                    valueCls: '#16A34A'
                  },
                  {
                    label: 'Districts Covered', value: activeDistricts,
                    sub: `of ${TAMIL_NADU_DISTRICTS.length} total districts`,
                    iconBg: 'linear-gradient(135deg,#2563EB,#60A5FA)', icon: '🗺️',
                    valueCls: '#2563EB'
                  },
                  {
                    label: 'Signed-Up Users', value: users.length,
                    sub: 'Accounts created',
                    iconBg: 'linear-gradient(135deg,#7C3AED,#A78BFA)', icon: '👤',
                    valueCls: '#7C3AED'
                  },
                  {
                    label: 'Pending Approval', value: pendingCount,
                    sub: pendingCount > 0 ? 'Awaiting admin review' : 'All applications reviewed',
                    iconBg: pendingCount > 0 ? 'linear-gradient(135deg,#F59E0B,#FCD34D)' : 'linear-gradient(135deg,#16A34A,#4ADE80)',
                    icon: pendingCount > 0 ? '⏳' : '✅',
                    valueCls: pendingCount > 0 ? '#B45309' : '#16A34A',
                    onClick: pendingCount > 0 ? () => goTab('pending') : undefined
                  },
                  {
                    label: 'Rejected Applications', value: rejectedCount,
                    sub: rejectedCount > 0 ? 'Fix info / photo & approve' : 'No rejected applications',
                    iconBg: rejectedCount > 0 ? 'linear-gradient(135deg,#DC2626,#EF4444)' : 'linear-gradient(135deg,#16A34A,#4ADE80)',
                    icon: rejectedCount > 0 ? '❌' : '✅',
                    valueCls: rejectedCount > 0 ? '#DC2626' : '#16A34A',
                    onClick: rejectedCount > 0 ? () => goTab('rejected') : undefined
                  },
                  {
                    label: 'Pending Registration', value: notRegistered,
                    sub: notRegistered > 0 ? 'Users yet to register' : 'All users registered!',
                    iconBg: notRegistered > 0 ? 'linear-gradient(135deg,#DC2626,#F87171)' : 'linear-gradient(135deg,#16A34A,#4ADE80)',
                    icon: notRegistered > 0 ? '⏳' : '🎉',
                    valueCls: notRegistered > 0 ? '#DC2626' : '#16A34A'
                  },
                  {
                    label: 'Legacy Photos', value: legacyPhotos,
                    sub: legacyPhotos > 0 ? 'Pending migration' : 'All synced to cloud',
                    iconBg: legacyPhotos > 0 ? 'linear-gradient(135deg,#D97706,#FCD34D)' : 'linear-gradient(135deg,#16A34A,#4ADE80)',
                    icon: legacyPhotos > 0 ? '🖼️' : '☁️',
                    valueCls: legacyPhotos > 0 ? '#D97706' : '#16A34A'
                  },
                ];
                return (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {cards.map(card => (
                      <div key={card.label} style={{
                        background: '#fff', borderRadius: '16px', padding: '18px 20px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8EDF5',
                        display: 'flex', flexDirection: 'column', gap: '10px',
                        cursor: card.onClick ? 'pointer' : 'default'
                      }}
                      onClick={card.onClick}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '10px',
                            background: card.iconBg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px'
                          }}>{card.icon}</div>
                        </div>
                        <div>
                          <div style={{
                            fontSize: '28px', fontWeight: '800',
                            color: card.valueCls, lineHeight: 1.1
                          }}>{loadingData ? '—' : card.value}</div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginTop: '4px' }}>{card.label}</div>
                          <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>{card.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* ── CLOUD STORAGE MONITOR ── */}
              {(() => {
                const memberStorageMB = (members.length * 75) / 1024;
                const galleryStorageMB = (galleryItems.length * 150) / 1024;
                const estimatedStorageMB = Math.round(memberStorageMB + galleryStorageMB);
                const storagePercentage = Math.min(100, Math.round((estimatedStorageMB / 1024) * 100));
                const isNearLimit = storagePercentage >= 80;

                return (
                  <div style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    border: '1px solid #E8EDF5',
                    marginTop: '4px'
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontWeight: '700', color: '#0A1628', fontSize: '14px' }}>Supabase Storage Monitor</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                          Est. <strong>{estimatedStorageMB} MB</strong> used of <strong>1024 MB (1 GB)</strong> free tier capacity ({members.length} member photos + {galleryItems.length} gallery photos)
                        </div>
                      </div>
                      <span style={{
                        fontSize: '11px', fontWeight: '700',
                        color: isNearLimit ? '#DC2626' : '#16A34A',
                        background: isNearLimit ? '#FEF2F2' : '#EFF6FF',
                        border: isNearLimit ? '1px solid #FCA5A5' : '1px solid #DBEAFE',
                        padding: '3px 10px', borderRadius: '20px'
                      }}>
                        {isNearLimit ? '⚠️ Storage Alert' : '✓ Healthy'}
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${storagePercentage}%`,
                        height: '100%',
                        background: isNearLimit ? 'linear-gradient(90deg, #EF4444, #DC2626)' : 'linear-gradient(90deg, #FFB347, #FF6B00)',
                        transition: 'width 0.5s ease-out'
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9CA3AF', marginTop: '6px' }}>
                      <span>0%</span>
                      <span>{storagePercentage}% full</span>
                      <span>100%</span>
                    </div>

                    {isNearLimit && (
                      <div style={{
                        marginTop: '12px', padding: '10px 12px', borderRadius: '8px',
                        background: '#FFFBEB', border: '1px solid #FDE68A',
                        fontSize: '12px', color: '#B45309', fontWeight: '500'
                      }}>
                        <strong>⚠️ Storage limit warning:</strong> Your combined cloud attachments (member photos + gallery images) are nearing the 1 GB free tier limit. Consider upgrading your Supabase bucket plan or cleaning up unused files to avoid registration failures.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Auto-sync indicator (subtle, no buttons) ── */}
              {migrating && syncRemaining > 0 && (
                <p style={{
                  fontSize: '11px', color: '#6B7280',
                  textAlign: 'right', marginTop: '-8px'
                }}>
                  ⟳ Auto-syncing photos… ({syncRemaining} remaining)
                </p>
              )}

              {/* Recent registrations */}
              <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8EDF5', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#0A1628', fontSize: '15px' }}>Recent Registrations</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>Latest {Math.min(members.length, 8)} of {members.length} members</div>
                  </div>
                  <button onClick={() => goTab('members')}
                    style={{ fontSize: '12px', color: '#FF6B00', fontWeight: '600', background: '#FFF3E0', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}>
                    View All →
                  </button>
                </div>
                {loadingData ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>Loading…</div>
                ) : members.slice(0, 8).map((m, idx) => (
                  <div key={idx}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #F9FAFB', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => handleViewMember(m)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      {(() => {
                        const photoSrc = getPhotoSrc(m);
                        return photoSrc
                          ? <img src={photoSrc} alt="" crossOrigin="anonymous" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FFB347', flexShrink: 0 }} />
                          : <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#FF6B00,#FFB347)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px', flexShrink: 0 }}>{m.full_name?.charAt(0)}</div>;
                      })()}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.full_name}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{m.district} · {m.blood_group || '—'}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                      <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: '700', color: '#003366', background: '#EEF3FF', borderRadius: '6px', padding: '2px 8px', display: 'inline-block' }}>{m.member_id}</div>
                      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '4px' }}>{m.join_date}</div>
                    </div>
                  </div>
                ))}
                {!loadingData && members.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>No registrations yet.</div>}
              </div>

              {/* ── Pending Registration Users ── */}
              {(() => {
                const pendingUsers = users.filter(u => !u.has_registered);
                if (pendingUsers.length === 0) return null;
                return (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-red-50/60 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-red-700 text-sm">⏳ Pending Member Registration</h3>
                        <p className="text-xs text-red-400 mt-0.5">{pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} signed up but haven't registered yet</p>
                      </div>
                      <button onClick={() => goTab('register')} className="text-xs bg-[#003366] text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition font-semibold">
                        + Register
                      </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {pendingUsers.map((u, i) => (
                        <div key={u.id || i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {u.name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 text-sm truncate">{u.name || '—'}</p>
                              <p className="text-xs text-gray-400 truncate">{u.email}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <span className="inline-block text-[10px] font-semibold text-red-500 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">Not Registered</span>
                            {u.created_at && (
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                Joined {new Date(u.created_at).toLocaleDateString('en-IN')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            </div>
          )}

          {/* ── PENDING APPROVAL ── */}
          {activeTab === 'pending' && (
            <div className="space-y-4 md:space-y-6 max-w-5xl">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 className="text-xl md:text-2xl font-bold text-[#003366]">
                  அனுமதி நிலுவை / Pending Approval ({pendingCount})
                </h2>
              </div>

              {pendingCount === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3rem' }}>✅</div>
                  <div style={{ marginTop: '1rem' }}>நிலுவையில் விண்ணப்பங்கள் இல்லை<br/>No pending applications</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {members
                    .filter(m => m.status === 'pending')
                    .map(member => (
                    <div key={member.member_id} style={{
                      background: '#fff', border: '1px solid #F59E0B',
                      borderRadius: '12px', padding: '1.2rem',
                      display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap'
                    }}>
                      {/* Photo */}
                      <div style={{ flexShrink: 0 }}>
                        {(member.photo_url || member.photo_base64) ? (
                          <img
                            src={member.photo_url || member.photo_base64}
                            crossOrigin="anonymous"
                            style={{ width: '70px', height: '85px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #003366' }}
                          />
                        ) : (
                          <div style={{
                            width: '70px', height: '85px', borderRadius: '6px',
                            background: '#FF6B00', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '1.8rem', color: '#fff', fontWeight: '800'
                          }}>
                            {member.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#0A1628', marginBottom: '6px' }}>
                          {member.full_name}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: '12px' }}>
                          {[
                            ['Member ID', member.member_id],
                            ['\u0baa\u0ba4\u0bb5\u0bbf', member.posting],
                            ['\u0bae\u0bbe\u0bb5\u0b9f\u0bcd\u0b9f\u0bae\u0bcd', member.district],
                            ['\u0b95\u0bc8\u0baa\u0bc7\u0b9a\u0bbf', member.mobile],
                            ['\u0b87\u0bb0\u0ba4\u0bcd\u0ba4 \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1', member.blood_group],
                            ['DOB', member.dob],
                            ['\u0b95\u0bbf\u0bb3\u0bc8', member.branch || '-'],
                            ['\u0bb5\u0bbf\u0ba3\u0bcd\u0ba3\u0baa\u0bcd\u0baa\u0bbf\u0ba4\u0bcd\u0ba4 \u0ba4\u0bc7\u0ba4\u0bbf', member.registered_at ? new Date(member.registered_at).toLocaleDateString('en-IN') : '-']
                          ].map(([label, value]) => (
                            <div key={label}>
                              <span style={{ color: '#6B7280' }}>{label}: </span>
                              <span style={{ fontWeight: '700', color: '#0A1628' }}>{value || '-'}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                        <button
                          onClick={() => handlePrintMember(member)}
                          style={{ padding: '8px 16px', background: '#003366', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                          🖨️ படிவம் காண்க
                        </button>
                        <button
                          onClick={() => approveMember(member)}
                          style={{ padding: '10px 16px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '800' }}>
                          ✅ அனுமதி / Approve
                        </button>
                        <button
                          onClick={() => rejectMember(member)}
                          style={{ padding: '10px 16px', background: 'transparent', color: '#EF4444', border: '2px solid #EF4444', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '800' }}>
                          ❌ நிராகரி / Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── REJECTED APPLICATIONS ── */}
          {activeTab === 'rejected' && (
            <div className="space-y-4 md:space-y-6 max-w-5xl">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#DC2626] flex items-center gap-2">
                    <span>❌</span> நிராகரிக்கப்பட்டவை / Rejected ({rejectedCount})
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    தவறான விவரம் அல்லது புகைப்படம் காரணத்தால் நிராகரிக்கப்பட்டவர்கள். இங்கு நேரடியாக விவரங்களை திருத்தி, புதிய படம் பதிவேற்றி அனுமதிக்கலாம்.
                  </p>
                </div>
                {rejectedCount > 0 && (
                  <button
                    onClick={() => { setRejectedDistrictFilter(''); setRejectedSearchQuery(''); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-white transition text-gray-700">
                    🔄 Reset Filter
                  </button>
                )}
              </div>

              {/* District & Search Filters */}
              <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Search by name, mobile, member ID, reason..."
                    value={rejectedSearchQuery}
                    onChange={e => setRejectedSearchQuery(e.target.value)}
                    className="flex-1 p-2.5 rounded-lg border border-gray-200 text-black focus:outline-none focus:border-[#DC2626] text-sm"
                  />
                  <select
                    value={rejectedDistrictFilter}
                    onChange={e => setRejectedDistrictFilter(e.target.value)}
                    className="w-full sm:w-56 p-2.5 rounded-lg border border-gray-200 text-black focus:outline-none focus:border-[#DC2626] text-sm font-medium">
                    <option value="">All Districts ({rejectedCount})</option>
                    {TAMIL_NADU_DISTRICTS.map(d => {
                      const c = rejectedMembers.filter(m => m.district === d).length;
                      return (
                        <option key={d} value={d}>
                          {d} {c > 0 ? `(${c})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* District Quick-filter Pills */}
                {rejectedDistrictsSummary.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-500 mr-1">Districts with Rejected:</span>
                    <button
                      type="button"
                      onClick={() => setRejectedDistrictFilter('')}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold transition ${
                        rejectedDistrictFilter === ''
                          ? 'bg-[#DC2626] text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                      All ({rejectedCount})
                    </button>
                    {rejectedDistrictsSummary.map(d => (
                      <button
                        key={d.name}
                        type="button"
                        onClick={() => setRejectedDistrictFilter(d.name)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition flex items-center gap-1 ${
                          rejectedDistrictFilter === d.name
                            ? 'bg-[#DC2626] text-white shadow-sm'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        }`}>
                        <span>{d.name}</span>
                        <span className="text-[10px] bg-white/60 px-1.5 py-0.2 rounded-full font-bold text-red-900">
                          {d.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Members List */}
              {rejectedCount === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3rem' }}>🎉</div>
                  <div style={{ marginTop: '1rem', fontWeight: '600' }}>நிராகரிக்கப்பட்ட விண்ணப்பங்கள் இல்லை<br/>No rejected applications</div>
                </div>
              ) : filteredRejectedMembers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem' }}>🔍</div>
                  <div style={{ marginTop: '0.5rem' }}>பொருந்தும் விண்ணப்பங்கள் இல்லை / No matching applications found for this filter</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredRejectedMembers.map(member => (
                    <div key={member.member_id} style={{
                      background: '#fff', border: '1px solid #FECACA',
                      borderLeft: '5px solid #DC2626',
                      borderRadius: '12px', padding: '1.2rem',
                      display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap',
                      boxShadow: '0 1px 4px rgba(220,38,38,0.08)'
                    }}>
                      {/* Photo */}
                      <div style={{ flexShrink: 0 }}>
                        {(member.photo_url || member.photo_base64) ? (
                          <img
                            src={member.photo_url || member.photo_base64}
                            crossOrigin="anonymous"
                            style={{ width: '75px', height: '90px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #DC2626' }}
                          />
                        ) : (
                          <div style={{
                            width: '75px', height: '90px', borderRadius: '6px',
                            background: '#EF4444', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '1.8rem', color: '#fff', fontWeight: '800'
                          }}>
                            {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontSize: '16px', fontWeight: '800', color: '#0A1628' }}>
                            {member.full_name}
                          </span>
                          <span style={{
                            background: '#FEE2E2', color: '#DC2626', fontSize: '11px',
                            fontWeight: '700', padding: '2px 8px', borderRadius: '12px', border: '1px solid #FCA5A5'
                          }}>
                            ❌ Rejected
                          </span>
                        </div>

                        {/* Rejection reason box */}
                        <div style={{
                          background: '#FEF2F2', border: '1px solid #FCA5A5',
                          borderRadius: '8px', padding: '8px 12px', marginBottom: '10px',
                          fontSize: '12px'
                        }}>
                          <span style={{ color: '#DC2626', fontWeight: '800' }}>⚠️ நிராகரிப்பு காரணம் / Reason: </span>
                          <span style={{ color: '#991B1B', fontWeight: '600' }}>{member.rejection_reason || 'Information or Photo mismatch'}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: '12px' }}>
                          {[
                            ['Member ID', member.member_id],
                            ['மாவட்டம்', member.district],
                            ['பதவி', member.posting],
                            ['கைபேசி', member.mobile],
                            ['ஆதார்', displayAadhar(member.aadhar)],
                            ['இரத்த பிரிவு', member.blood_group],
                            ['DOB', member.dob],
                            ['கிளை', member.branch || '-'],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <span style={{ color: '#6B7280' }}>{label}: </span>
                              <span style={{ fontWeight: '700', color: '#0A1628' }}>{value || '-'}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, width: '165px' }}>
                        <button
                          onClick={() => setEditMember(member)}
                          style={{
                            padding: '9px 12px', background: '#003366', color: '#fff',
                            border: 'none', borderRadius: '8px', cursor: 'pointer',
                            fontSize: '12px', fontWeight: '700', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', gap: '6px'
                          }}>
                          ✏️ திருத்து & படம் ஏற்று
                        </button>
                        <button
                          onClick={() => approveMember(member)}
                          style={{
                            padding: '9px 12px', background: '#16A34A', color: '#fff',
                            border: 'none', borderRadius: '8px', cursor: 'pointer',
                            fontSize: '12px', fontWeight: '700', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', gap: '6px'
                          }}>
                          ✅ அனுமதி / Approve
                        </button>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handlePrintMember(member)}
                            title="படிவம் காண்க"
                            style={{
                              flex: 1, padding: '7px', background: '#F0F4F9', color: '#003366',
                              border: '1px solid #D1D9E6', borderRadius: '6px', cursor: 'pointer',
                              fontSize: '11px', fontWeight: '600'
                            }}>
                            🖨️ படிவம்
                          </button>
                          <button
                            onClick={() => deleteMember(member.member_id, member.user_id)}
                            title="விண்ணப்பத்தை நீக்கு"
                            style={{
                              padding: '7px 10px', background: '#FEE2E2', color: '#DC2626',
                              border: '1px solid #FCA5A5', borderRadius: '6px', cursor: 'pointer',
                              fontSize: '11px', fontWeight: '600'
                            }}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ALL MEMBERS ── */}
          {activeTab === 'members' && (
            <div className="space-y-4 md:space-y-6 max-w-6xl">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-[#003366]">All Members</h2>
                <div className="flex gap-2">
                  <button onClick={async () => {
                    setDownloadingZip(true);
                    setDownloadProgress({ current: 0, total: members.length });
                    await bulkDownloadMembers(members, (current, total) => {
                      setDownloadProgress({ current, total });
                    });
                    setDownloadingZip(false);
                  }} className="bg-[#008000] text-white px-3 py-2 rounded font-semibold text-xs md:text-sm shadow-sm hover:opacity-90">
                    🗂️ Download All (ZIP)
                  </button>
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

              {/* Progress Modal */}
              {downloadingZip && (
                <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center space-y-4">
                    <div className="text-4xl animate-bounce">🗂️</div>
                    <h3 className="text-xl font-bold text-[#003366]">Generating ZIP...</h3>
                    <p className="text-sm text-gray-500">
                      {downloadProgress.current === 'zipping' 
                        ? 'Compressing files into a ZIP archive...' 
                        : ('Processing card ' + downloadProgress.current + ' of ' + downloadProgress.total + '...')}
                    </p>
                    {downloadProgress.current !== 'zipping' && downloadProgress.total > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                      <div className="bg-[#FFB347] h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: ((downloadProgress.current / downloadProgress.total) * 100) + '%' }}></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                        <th className="p-3 font-semibold">Aadhaar</th>
                        <th className="p-3 font-semibold">District</th>
                        <th className="p-3 font-semibold">Mobile</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {loadingData
                        ? <tr><td colSpan="9" className="p-8 text-center text-gray-400">Loading...</td></tr>
                        : paginatedMembers.map((m, idx) => (
                          <tr key={m.member_id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                            <td className="p-3 text-gray-500">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                            <td className="p-3">
                              {(() => {
                                const photoSrc = getPhotoSrc(m);
                                return photoSrc ? (
                                  <img src={photoSrc} alt="" crossOrigin="anonymous" style={{
                                    width: '40px', height: '48px',
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                    border: '1.5px solid #003366'
                                  }} />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[#FFB347]/20 text-[#FF6B00] flex items-center justify-center font-bold text-xs">
                                    {m.full_name?.charAt(0)?.toUpperCase()}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="p-3 font-semibold text-gray-800 max-w-[120px] truncate">{m.full_name}</td>
                            <td className="p-3 font-mono text-[#003366] text-xs">{m.member_id}</td>
                            <td className="p-3 font-mono text-xs">{m.aadhar || m.aadhaar || '-'}</td>
                            <td className="p-3 text-gray-600 text-xs">{m.district}</td>
                            <td className="p-3 text-gray-600 text-xs">{m.mobile}</td>
                            <td className="p-3">{statusBadge(m.status || 'approved')}</td>
                            <td className="p-3 text-center">
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => handleViewMember(m)} title="View" style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #DBEAFE', background: '#EFF6FF', color: '#2563EB', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>View</button>
                                <button onClick={() => handleEditMemberClick(m)} title="Edit" style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #FDE68A', background: '#FFFBEB', color: '#D97706', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Edit</button>
                                <button onClick={() => handlePrintMember(m)} title="Print" style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #C7D2FE', background: '#EEF2FF', color: '#4338CA', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>🖨️</button>
                                <button onClick={() => deleteMember(m.member_id, m.user_id)} title="Delete" style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Del</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                      {!loadingData && paginatedMembers.length === 0 && <tr><td colSpan="9" className="p-8 text-center text-gray-500">No members found.</td></tr>}
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
            <div className="max-w-4xl space-y-4 md:space-y-6">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-8 space-y-6">
                  
                  {/* Grid for form inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* 1. Full Name */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[#003366] mb-1">
                        முழு பெயர் / Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newMember.fullName}
                        onChange={handleRegChange('fullName')}
                        className={`w-full rounded-lg border px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347] ${
                          regErrors.fullName ? 'border-red-400' : 'border-gray-200'
                        }`}
                      />
                      {regErrors.fullName && <p className="mt-0.5 text-xs text-red-500">{regErrors.fullName}</p>}
                    </div>

                    {/* 1b. Posting */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[#003366] mb-1">
                        பதவி / Posting <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newMember.posting}
                        onChange={handleRegChange('posting')}
                        placeholder="பதவி / Posting (வெல்டர் / Welder)"
                        className={`w-full rounded-lg border px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347] ${
                          regErrors.posting ? 'border-red-400' : 'border-gray-200'
                        }`}
                      />
                      {regErrors.posting && <p className="mt-0.5 text-xs text-red-500">{regErrors.posting}</p>}
                    </div>

                    {/* 2. Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[#003366] mb-1">
                        சரியான முகவரி / Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={newMember.address}
                        onChange={handleRegChange('address')}
                        className={`w-full rounded-lg border px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347] resize-none ${
                          regErrors.address ? 'border-red-400' : 'border-gray-200'
                        }`}
                      />
                      {regErrors.address && <p className="mt-0.5 text-xs text-red-500">{regErrors.address}</p>}
                    </div>

                    {/* 3. Company Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[#003366] mb-1">
                        நிறுவனத்தின் முகவரி / Org Address
                      </label>
                      <textarea
                        rows={2}
                        value={newMember.companyAddress}
                        onChange={handleRegChange('companyAddress')}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347] resize-none"
                      />
                    </div>

                    {/* 4. Blood Group */}
                    <div>
                      <label className="block text-sm font-semibold text-[#003366] mb-1">
                        இரத்த பிரிவு / Blood Group <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="இரத்த பிரிவு / Blood Group"
                        value={newMember.bloodGroup}
                        onChange={handleRegChange('bloodGroup')}
                        className={`w-full rounded-lg border px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347] ${
                          regErrors.bloodGroup ? 'border-red-400' : 'border-gray-200'
                        }`}
                      />
                      {regErrors.bloodGroup && <p className="mt-0.5 text-xs text-red-500">{regErrors.bloodGroup}</p>}
                    </div>

                    {/* 5. DOB */}
                    <div>
                      <label className="block text-sm font-semibold text-[#003366] mb-1">
                        வயது / பிறந்த தேதி / DOB <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={newMember.dob}
                        onChange={handleRegChange('dob')}
                        className={`w-full rounded-lg border px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347] ${
                          regErrors.dob ? 'border-red-400' : 'border-gray-200'
                        }`}
                      />
                      {regErrors.dob && <p className="mt-0.5 text-xs text-red-500">{regErrors.dob}</p>}
                    </div>

                    {/* 6. Aadhaar */}
                    <div>
                      <label className="block text-sm font-semibold text-[#003366] mb-1">
                        ஆதார் எண் / Aadhaar <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={12}
                        placeholder="12 digits"
                        inputMode="numeric"
                        value={newMember.aadhaar}
                        onChange={handleRegChange('aadhaar')}
                        className={`w-full rounded-lg border px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347] ${
                          regErrors.aadhaar ? 'border-red-400' : 'border-gray-200'
                        }`}
                      />
                      {regErrors.aadhaar && <p className="mt-0.5 text-xs text-red-500">{regErrors.aadhaar}</p>}
                    </div>

                    {/* 7. Mobile */}
                    <div>
                      <label className="block text-sm font-semibold text-[#003366] mb-1">
                        செல் நம்பர் / Mobile <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="10 digits"
                        inputMode="numeric"
                        value={newMember.mobile}
                        onChange={handleRegChange('mobile')}
                        className={`w-full rounded-lg border px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347] ${
                          regErrors.mobile ? 'border-red-400' : 'border-gray-200'
                        }`}
                      />
                      {regErrors.mobile && <p className="mt-0.5 text-xs text-red-500">{regErrors.mobile}</p>}
                    </div>

                    {/* 8. Nominee Name */}
                    <div>
                      <label className="block text-sm font-semibold text-[#003366] mb-1">
                        வாரிசுதாரர் பெயர் / Nominee Name
                      </label>
                      <input
                        type="text"
                        value={newMember.nomineeName}
                        onChange={handleRegChange('nomineeName')}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347]"
                      />
                    </div>

                    {/* 9. Nominee Mobile */}
                    <div>
                      <label className="block text-sm font-semibold text-[#003366] mb-1">
                        வாரிசுதாரர் செல்நம்பர் / Nominee Mobile
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="10 digits"
                        inputMode="numeric"
                        value={newMember.nomineeMobile}
                        onChange={handleRegChange('nomineeMobile')}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347]"
                      />
                    </div>

                    {/* 10. District */}
                    <div>
                      <label className="block text-sm font-semibold text-[#003366] mb-1">
                        மாவட்டம் / District <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newMember.pledgeDistrict}
                        onChange={handleRegChange('pledgeDistrict')}
                        className={`w-full rounded-lg border px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347] ${
                          regErrors.pledgeDistrict ? 'border-red-400' : 'border-gray-200'
                        }`}
                      >
                        <option value="">-- Select District --</option>
                        {TAMIL_NADU_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {regErrors.pledgeDistrict && <p className="mt-0.5 text-xs text-red-500">{regErrors.pledgeDistrict}</p>}
                    </div>

                    {/* 11. Branch */}
                    <div>
                      <label className="block text-sm font-semibold text-[#003366] mb-1">
                        கிளை சங்கம் / Branch
                      </label>
                      <input
                        type="text"
                        value={newMember.pledgeBranch}
                        onChange={handleRegChange('pledgeBranch')}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347]"
                      />
                    </div>

                    {/* 12. Joined Date */}
                    <div>
                      <label className="block text-sm font-semibold text-[#003366] mb-1">
                        இணைந்த தேதி / Joined Date (auto today, editable)
                      </label>
                      <input
                        type="text"
                        value={newMember.joinDate}
                        onChange={handleRegChange('joinDate')}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347]"
                      />
                    </div>

                    {/* 13. Referral */}
                    <div>
                      <label className="block text-sm font-semibold text-[#003366] mb-1">
                        பரிந்துரை / Referral
                      </label>
                      <input
                        type="text"
                        value={newMember.referral}
                        onChange={handleRegChange('referral')}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:outline-none focus:border-[#FFB347]"
                      />
                    </div>

                  </div>

                  {/* 14. Photo upload & Member ID Box */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                    
                    {/* Photo Upload Box */}
                    <div className="w-full sm:w-1/2 rounded-[12px] p-5 text-center" style={{ border: '1.5px solid #E5DDD0' }}>
                      <p className="mb-3 text-sm font-semibold text-[#003366]">படம் / Photo upload</p>
                      <label className="group relative mx-auto block cursor-pointer" style={{ width: '120px', height: '140px' }}>
                        {adminPhotoPreview ? (
                          <img
                            src={adminPhotoPreview}
                            alt="Member"
                            className="w-full h-full object-cover rounded-lg border-2 border-[#003366]"
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', border: '2px dashed #CCCCCC', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#888888', fontSize: '12px' }}>
                            <span style={{ fontSize: '24px' }}>📷</span>
                            <span>படம் பதிவேற்று</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-[2]"
                          onChange={handleAdminPhoto}
                        />
                      </label>
                    </div>

                    {/* ID Preview Box */}
                    <div className="w-full sm:w-1/2 rounded-[12px] p-6 text-center bg-[#F0F7FF] border border-[#003366]">
                      <p className="mb-2 text-xs text-gray-400 uppercase tracking-wider">உறுப்பினர் பதிவு எண் Preview</p>
                      <div className="font-mono text-sm font-bold text-[#003366] py-2 border-t border-[#003366] tracking-widest">
                        TIWTN-2026-XXXXX
                      </div>
                    </div>

                  </div>

                  {/* Submit button */}
                  <button
                    onClick={handleRegSubmit}
                    disabled={regSubmitting}
                    className="w-full rounded-lg bg-[#FF6B00] text-white py-3 font-bold text-sm hover:opacity-90 transition disabled:opacity-60"
                  >
                    {regSubmitting ? 'Registering…' : '✅ உறுப்பினரை பதிவு செய்க / Register Member'}
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
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#003366]">Members by District</h2>
                  <p className="text-xs text-gray-500 mt-0.5">மாவட்ட வாரியாக உறுப்பினர்கள் விவரம்</p>
                </div>
                <button onClick={exportCSV} className="bg-[#FFB347] text-black px-3 py-2 rounded font-semibold text-sm shadow-sm hover:opacity-90">
                  📥 Export CSV
                </button>
              </div>

              {/* Status filter tabs */}
              <div className="flex items-center gap-2 mb-5 flex-wrap bg-white p-2 rounded-xl border border-gray-200">
                {[
                  { id: 'all', label: 'All Members', count: members.length, bg: 'bg-blue-50 text-blue-800' },
                  { id: 'approved', label: 'Approved', count: approvedCount, bg: 'bg-green-50 text-green-800' },
                  { id: 'pending', label: 'Pending', count: pendingCount, bg: 'bg-amber-50 text-amber-800' },
                  { id: 'rejected', label: 'Rejected', count: rejectedCount, bg: 'bg-red-50 text-red-800' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDistrictTabStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      districtTabStatusFilter === tab.id
                        ? 'bg-[#003366] text-white shadow-sm'
                        : `${tab.bg} hover:opacity-80`
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${districtTabStatusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-black/10'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {districtsCount.map(d => {
                  const displayCount = 
                    districtTabStatusFilter === 'approved' ? d.approved :
                    districtTabStatusFilter === 'pending' ? d.pending :
                    districtTabStatusFilter === 'rejected' ? d.rejected : d.count;

                  const hasCount = displayCount > 0;

                  return (
                    <button key={d.name}
                      onClick={() => {
                        if (districtTabStatusFilter === 'rejected') {
                          setRejectedDistrictFilter(d.name);
                          goTab('rejected');
                        } else if (districtTabStatusFilter === 'pending') {
                          goTab('pending');
                        } else {
                          setDistrictFilter(d.name);
                          goTab('members');
                          setCurrentPage(1);
                        }
                      }}
                      disabled={!hasCount}
                      className={`p-3 rounded-xl border text-left transition ${
                        hasCount
                          ? districtTabStatusFilter === 'rejected'
                            ? 'bg-red-50/50 border-red-200 shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-red-400 active:scale-95'
                            : 'bg-white border-[#FFB347] shadow-sm hover:-translate-y-1 hover:shadow-md active:scale-95'
                          : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                      }`}>
                      <p className={`font-semibold text-xs md:text-sm leading-tight ${hasCount ? (districtTabStatusFilter === 'rejected' ? 'text-red-900' : 'text-[#003366]') : 'text-gray-500'}`}>{d.name}</p>
                      
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-[10px] text-gray-500">
                          {districtTabStatusFilter === 'rejected' ? 'Rejected' :
                           districtTabStatusFilter === 'pending' ? 'Pending' :
                           districtTabStatusFilter === 'approved' ? 'Approved' : 'Members'}
                        </span>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                          hasCount
                            ? districtTabStatusFilter === 'rejected'
                              ? 'bg-red-200 text-red-900'
                              : 'bg-[#FFB347]/20 text-[#FF6B00]'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {displayCount}
                        </span>
                      </div>

                      {/* Sub-counts in All View */}
                      {districtTabStatusFilter === 'all' && (d.pending > 0 || d.rejected > 0) && (
                        <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex items-center gap-1 text-[9px] font-bold">
                          {d.pending > 0 && <span className="text-amber-600">⏳ {d.pending}</span>}
                          {d.rejected > 0 && <span className="text-red-600">❌ {d.rejected}</span>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── GALLERY MANAGEMENT ── */}
          {activeTab === 'gallery' && (() => {
            // Group images by title — same logic as public Gallery.jsx
            const adminAlbums = Object.values(
              galleryItems.reduce((groups, item) => {
                const key = item.title.trim().toLowerCase();
                if (!groups[key]) {
                  groups[key] = {
                    title: item.title,
                    category: item.category,
                    cover: item.image_url,
                    images: [],
                    created_at: item.created_at,
                  };
                }
                groups[key].images.push(item);
                if (new Date(item.created_at) > new Date(groups[key].created_at)) {
                  groups[key].created_at = item.created_at;
                }
                return groups;
              }, {})
            ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return (
              <div className="space-y-4 md:space-y-6 max-w-6xl">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#003366]">Gallery Management</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{adminAlbums.length} album{adminAlbums.length !== 1 ? 's' : ''} · {galleryItems.length} photo{galleryItems.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button onClick={() => setShowGalleryForm(true)} className="bg-[#003366] text-white px-3 py-2 rounded font-semibold text-xs md:text-sm shadow-sm hover:opacity-90">
                    ➕ Add Photos
                  </button>
                </div>

                {adminAlbums.length === 0 ? (
                  <p className="p-8 text-center text-gray-400 text-sm">No images in gallery yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {adminAlbums.map((album) => (
                      <AlbumAdminCard
                        key={album.title}
                        album={album}
                        onDeleteAlbum={async () => {
                          if (!window.confirm(`Delete entire album "${album.title}" (${album.images.length} photo${album.images.length !== 1 ? 's' : ''})?`)) return;
                          for (const img of album.images) {
                            await deleteGalleryItem(img.id, img.image_url, true);
                          }
                          await loadGallery();
                        }}
                        onDeleteImage={async (img) => {
                          await deleteGalleryItem(img.id, img.image_url);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}


          {/* Verify section removed */}

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
                  ['Aadhar', displayAadhar(selectedMember.aadhar)],
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

            {/* Edit Photo Input Section */}
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: '16px', padding: '12px',
              background: 'var(--bg-secondary)',
              borderRadius: '10px', marginBottom: '16px',
              border: '1px solid var(--border)'
            }}>
              {/* Preview */}
              <div style={{ flexShrink: 0 }}>
                {editPhotoPreview ? (
                  <img
                    src={editPhotoPreview}
                    style={{
                      width: '80px', height: '96px',
                      objectFit: 'cover', borderRadius: '6px',
                      border: '2px solid #003366'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '80px', height: '96px',
                    borderRadius: '6px',
                    background: '#FF6B00',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem', color: '#fff',
                    fontWeight: '800'
                  }}>
                    {editMember?.full_name?.charAt(0)
                      ?.toUpperCase() || '?'}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '13px', fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '4px'
                }}>படம் மாற்று / Change Photo</div>
                <div style={{
                  fontSize: '11px', color: 'var(--text-muted)',
                  marginBottom: '10px'
                }}>JPG, PNG · Max 2MB</div>

                <label style={{
                  display: 'inline-block',
                  padding: '7px 16px',
                  background: '#003366', color: '#fff',
                  borderRadius: '6px', fontSize: '12px',
                  fontWeight: '700', cursor: 'pointer'
                }}>
                  📷 படம் தேர்வு / Choose Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditPhotoUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                {editPhotoFile && (
                  <button
                    onClick={() => {
                      setEditPhotoPreview(
                        editMember._original_photo_url ||
                        editMember._original_photo_base64 ||
                        null
                      )
                      setEditPhotoFile(null)
                    }}
                    style={{
                      marginLeft: '8px', padding: '7px 12px',
                      background: 'transparent',
                      color: '#E53E3E',
                      border: '1px solid #E53E3E',
                      borderRadius: '6px', fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >↩ Reset</button>
                )}
              </div>
            </div>

            {/* Rejection reason banner if rejected */}
            {editMember.rejection_reason && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-800 mb-1">
                  <span>❌</span> நிராகரிப்பு காரணம் / Rejection Reason:
                </div>
                <div className="text-xs text-red-900 font-medium bg-white/60 p-2 rounded-lg border border-red-100">
                  {editMember.rejection_reason}
                </div>
                <div className="text-[11px] text-red-600 mt-1.5">
                  💡 சரியான விவரங்களை திருத்தி / புதிய புகைப்படத்தை பதிவேற்றி கீழே உள்ள <b>&quot;சேமித்து அனுமதி&quot;</b> பட்டனை அழுத்தவும்.
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm">
              {[
                { key: 'full_name', label: 'பெயர் / Name', type: 'text' },
                { key: 'posting',   label: 'பதவி / Posting', type: 'text' },
                { key: 'dob',       label: 'பிறந்த தேதி / DOB (dd-mm-yyyy)', type: 'text' },
                { key: 'blood_group', label: 'இரத்த பிரிவு / Blood Group', type: 'text' },
                { key: 'mobile',    label: 'கைபேசி / Mobile', type: 'tel' },
                { key: 'aadhar',    label: 'ஆதார் / Aadhaar', type: 'text' },
                { key: 'address',   label: 'முகவரி / Address', type: 'textarea' },
                { key: 'org_address', label: 'நிறுவனத்தின் முகவரி / Org Address', type: 'textarea' },
                { key: 'branch',    label: 'கிளை / Branch', type: 'text' },
                { key: 'nominee_name', label: 'வாரிசுதாரர் / Nominee', type: 'text' },
                { key: 'nominee_phone', label: 'வாரிசுதாரர் கைபேசி / Nominee Phone', type: 'tel' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '12px', fontWeight: '600',
                    color: 'var(--text-muted)',
                    display: 'block', marginBottom: '4px'
                  }}>{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={editMember[field.key] || ''}
                      onChange={e => setEditMember(prev => ({
                        ...prev, [field.key]: e.target.value
                      }))}
                      style={{
                        width: '100%', padding: '8px 12px',
                        borderRadius: '8px', fontSize: '14px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        resize: 'vertical'
                      }}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={editMember[field.key] || ''}
                      onChange={e => setEditMember(prev => ({
                        ...prev, [field.key]: e.target.value
                      }))}
                      style={{
                        width: '100%', padding: '8px 12px',
                        borderRadius: '8px', fontSize: '14px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  )}
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">District / மாவட்டம்</label>
                <select value={editMember.district || ''} onChange={e => setEditMember(prev => ({ ...prev, district: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-black focus:outline-none focus:border-[#FFB347] text-sm">
                  <option value="">-- Select --</option>
                  {TAMIL_NADU_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* District Member ID Sync Tool */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#003366]">
                    உறுப்பினர் எண் / Member ID
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    editMember.status === 'approved' ? 'bg-green-100 text-green-800' :
                    editMember.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Status: {editMember.status || 'pending'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editMember.member_id || ''}
                    onChange={e => setEditMember(prev => ({ ...prev, member_id: e.target.value }))}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-black font-mono text-xs font-bold bg-white focus:outline-none focus:border-[#003366]"
                    placeholder="e.g. TIWTN-2026-CHN-001"
                  />
                  <button
                    type="button"
                    disabled={regeneratingId || !editMember.district}
                    onClick={() => handleRegenerateDistrictId(editMember.district)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#003366] text-white hover:bg-[#002244] transition flex items-center gap-1 shadow-sm whitespace-nowrap disabled:opacity-50"
                    title="Generate correct district ID code for the selected district"
                  >
                    {regeneratingId ? '⏳ Generating...' : '🔄 மாவட்ட ID உருவாக்கு'}
                  </button>
                </div>
                {editMember._original_district && editMember.district && editMember._original_district !== editMember.district && (
                  <p className="text-[11px] text-amber-700 font-semibold">
                    ⚠️ மாவட்டம் &quot;{editMember._original_district}&quot; இலிருந்து &quot;{editMember.district}&quot; என மாற்றப்பட்டது. புதிய மாவட்ட ID உருவாக்க &quot;மாவட்ட ID உருவாக்கு&quot; பட்டனை அழுத்தவும்.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              {(editMember.status === 'rejected' || editMember.status === 'pending') && (
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => saveEditMember(true)}
                  className="flex-1 rounded-lg bg-[#16A34A] text-white py-2.5 px-3 font-bold hover:bg-[#15803D] transition text-sm flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {savingEdit ? '⏳ சேமிக்கிறது...' : '✅ சேமித்து அனுமதி / Save & Approve'}
                </button>
              )}
              <button
                type="button"
                disabled={savingEdit}
                onClick={() => saveEditMember(false)}
                className="flex-1 rounded-lg bg-[#FFB347] text-black py-2.5 px-3 font-bold hover:opacity-90 transition text-sm flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {savingEdit ? '⏳ சேமிக்கிறது...' : '💾 மாற்றங்களை சேமி / Save Changes'}
              </button>
              <button
                type="button"
                disabled={savingEdit}
                onClick={() => setEditMember(null)}
                className="rounded-lg border border-gray-300 py-2.5 px-4 text-gray-600 hover:bg-gray-50 transition text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GALLERY ADD FORM MODAL ── */}
      {showGalleryForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4">
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl md:rounded-2xl shadow-2xl p-5 md:p-8 overflow-y-auto max-h-[90vh]">
            <button onClick={closeGalleryForm} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-black hover:bg-gray-200 text-sm">✕</button>
            <h3 className="text-lg md:text-xl font-bold text-[#003366] mb-4">Add Gallery Photo</h3>
            
            <form onSubmit={handleGallerySubmit} className="space-y-4 text-sm">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Title / தலைப்பு</label>
                <input
                  type="text"
                  required
                  value={newGalleryItem.title}
                  onChange={e => setNewGalleryItem(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-black focus:outline-none focus:border-[#FFB347] text-sm"
                  placeholder="e.g. Workshop event"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Category / வகை</label>
                <select
                  value={newGalleryItem.category}
                  onChange={e => setNewGalleryItem(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-black focus:outline-none focus:border-[#FFB347] text-sm"
                >
                  <option value="EVENTS">Events / நிகழ்ச்சிகள்</option>
                  <option value="WORKSHOPS">Workshops / பயிற்சி வகுப்புகள்</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Description / விளக்கம் (Optional)</label>
                <textarea
                  rows={2}
                  value={newGalleryItem.description || ''}
                  onChange={e => setNewGalleryItem(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-black focus:outline-none focus:border-[#FFB347] text-sm resize-none"
                  placeholder="Brief description..."
                />
              </div>

              {/* IMAGE UPLOAD UI SECTION */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{
                  fontSize: '12px', fontWeight: '600',
                  color: 'var(--text-muted)',
                  display: 'block', marginBottom: '4px'
                }}>படம் பதிவேற்று / Upload Image</label>

                {/* Upload box */}
                <div style={{
                  border: '2px dashed var(--border)',
                  borderRadius: '10px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: 'var(--bg-secondary)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'border 0.2s'
                }}
                  onMouseEnter={e =>
                    e.currentTarget.style.borderColor = '#FF6B00'}
                  onMouseLeave={e =>
                    e.currentTarget.style.borderColor =
                      'var(--border)'}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryImageUpload}
                    disabled={uploadingImage}
                    style={{
                      position: 'absolute', inset: 0,
                      opacity: 0, cursor: 'pointer',
                      width: '100%', height: '100%'
                    }}
                  />

                  {uploadingImage ? (
                    <div>
                      <div style={{
                        fontSize: '2rem', marginBottom: '8px'
                      }}>⏳</div>
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--text-muted)'
                      }}>
                        பதிவேற்றுகிறது... / Uploading...
                      </div>
                      {/* Progress bar */}
                      <div style={{
                        width: '100%', height: '4px',
                        background: 'var(--border)',
                        borderRadius: '2px',
                        marginTop: '12px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: '60%', height: '100%',
                          background: '#FF6B00',
                          borderRadius: '2px',
                          animation: 'pulse 1s infinite'
                        }} />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        fontSize: '2.5rem', marginBottom: '8px'
                      }}>📷</div>
                      <div style={{
                        fontSize: '14px', fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: '4px'
                      }}>
                        படங்களை இங்கே இழுக்கவும் அல்லது கிளிக் செய்யவும்
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)'
                      }}>
                        Drag & drop or click to upload one or more images
                        <br/>PNG, JPG, WEBP · Max 5MB per image
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview Grid for Uploaded Images */}
                {uploadedImageUrls.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold text-gray-500 uppercase">
                      பதிவேற்றப்பட்ட படங்கள் ({uploadedImageUrls.length}) / Uploaded Images
                    </p>
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-gray-200 rounded-lg">
                      {uploadedImageUrls.map((url, index) => (
                        <div key={index} className="relative group aspect-video rounded border overflow-hidden bg-gray-100">
                          <img
                            src={url}
                            alt={`Preview ${index}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeUploadedPreviewImage(url)}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] transition-colors"
                            title="Remove image"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>

              <div className="mt-5 flex gap-3">
                <button type="submit" disabled={uploadingImage || uploadedImageUrls.length === 0} className="flex-1 rounded-lg bg-[#FF6B00] text-white py-2.5 font-semibold hover:opacity-90 transition text-sm disabled:opacity-50">
                  Save Photo
                </button>
                <button type="button" onClick={closeGalleryForm} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-gray-600 hover:bg-gray-50 transition text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
