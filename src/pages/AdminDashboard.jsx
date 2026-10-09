import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/client';
import IDCard from '../components/IDCard';
import ImageCropperModal from '../components/ImageCropperModal';
import { generateMemberId, DISTRICT_LIST, TAMIL_NADU_DISTRICTS } from '../utils/memberIdUtils';
import { printMemberForm } from '../utils/printMemberForm';
import { bulkDownloadMembers } from '../utils/bulkDownload.jsx';
import PageLoader from '../components/PageLoader';
import { uploadToCloudinary, deleteOldStoragePhoto } from '../utils/cloudinary';

const getPhotoSrc = (member) =>
  member?.photoPreview ||
  member?.photo_url ||
  member?.photo_base64 ||
  null;

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
  const [loadingData, setLoadingData]       = useState(false);
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

  // Photo Cropper Modal State
  const [cropperState, setCropperState] = useState({
    isOpen: false,
    imageSrc: null,
    member: null,
    target: null, // 'edit' | 'register' | 'direct'
    title: null
  });
  const [savingDirectCrop, setSavingDirectCrop] = useState(false);

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

    if (file.size > 15 * 1024 * 1024) {
      alert('புகைப்படம் 15MB-க்குள் இருக்க வேண்டும் / Photo size must be less than 15MB');
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
    // First fetch page 0 to get total count and first batch immediately
    const pageSize = 1000;
    const { data: firstPage, error: firstError } = await supabase
      .from('members')
      .select('id, member_id, user_id, full_name, posting, dob, blood_group, mobile, aadhar, district, address, org_address, nominee_name, nominee_phone, branch, join_date, registered_at, referrer, photo_url, status, rejection_reason, approved_at, approved_by')
      .order('registered_at', { ascending: false })
      .range(0, pageSize - 1);

    if (firstError) {
      console.error('Error loading members:', firstError);
      return;
    }

    const firstBatch = firstPage || [];
    // Only set first batch immediately if we don't have members loaded yet (prevents list shrinking/flashing during refreshes)
    setMembers(prev => prev.length === 0 ? firstBatch : prev);

    if (firstBatch.length < pageSize) {
      setMembers(firstBatch);
      return; // All loaded in one shot
    }

    // If there are more pages, fetch them all in parallel
    const additionalPages = [];
    for (let page = 1; page <= 9; page++) {
      additionalPages.push(
        supabase
          .from('members')
          .select('id, member_id, user_id, full_name, posting, dob, blood_group, mobile, aadhar, district, address, org_address, nominee_name, nominee_phone, branch, join_date, registered_at, referrer, photo_url, status, rejection_reason, approved_at, approved_by')
          .order('registered_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1)
      );
    }

    const results = await Promise.all(additionalPages);
    let allData = [...firstBatch];
    for (const { data } of results) {
      if (!data || data.length === 0) break;
      allData.push(...data);
      if (data.length < pageSize) break;
    }
    setMembers(allData);
  };
  const loadUsers = async () => {
    const pageSize = 1000;
    const { data: firstPage, error: firstError } = await supabase
      .from('users')
      .select('id, email, name, role, has_registered, created_at')
      .order('created_at', { ascending: false })
      .range(0, pageSize - 1);

    if (firstError) {
      console.error('Error loading users:', firstError);
      return;
    }

    const firstBatch = firstPage || [];
    setUsers(firstBatch);

    if (firstBatch.length < pageSize) return; // All loaded in one batch

    // Fetch remaining batches in parallel
    const additionalPages = [];
    for (let page = 1; page <= 15; page++) {
      additionalPages.push(
        supabase
          .from('users')
          .select('id, email, name, role, has_registered, created_at')
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1)
      );
    }

    const results = await Promise.all(additionalPages);
    let allExtra = [];
    for (const { data } of results) {
      if (!data || data.length === 0) break;
      allExtra = [...allExtra, ...data];
      if (data.length < pageSize) break;
    }
    if (allExtra.length > 0) {
      setUsers(prev => [...prev, ...allExtra]);
    }
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
    setEditPhotoPreview(member.photo_url || member.photo_base64 || null);
    setEditPhotoFile(null);
    if (!member.photo_url && !member.photo_base64) {
      const photos = await fetchSingleMemberPhoto(member.member_id);
      if (photos.photo_url || photos.photo_base64) {
        setEditPhotoPreview(photos.photo_url || photos.photo_base64 || null);
        setEditMember(prev => prev && prev.member_id === member.member_id ? { ...prev, ...photos, _original_photo_url: photos.photo_url, _original_photo_base64: photos.photo_base64 } : prev);
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
    // Fetch members and users in parallel, gallery separately — all non-blocking
    Promise.all([loadMembers(), loadUsers()]);
    loadGallery();
    
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

  // Lazy-load photos for Rejected applications
  useEffect(() => {
    if (activeTab === 'rejected') {
      const targetList = members.filter(m => m.status === 'rejected').slice(0, 30);
      const missingPhotos = targetList.filter(m => !m.photo_url && !m.photo_base64);
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
  }, [activeTab, rejectedSearchQuery, rejectedDistrictFilter, members.length]);

  // Lazy-load photos for Pending applications
  useEffect(() => {
    if (activeTab === 'pending') {
      const pendingList = members.filter(m => m.status === 'pending');
      const missingPhotos = pendingList.filter(m => !m.photo_url && !m.photo_base64);
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
      const matchSearch = !q ||
        m.full_name?.toLowerCase().includes(q) ||
        m.mobile?.includes(q) ||
        m.member_id?.toLowerCase().includes(q) ||
        m.aadhar?.includes(q);
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
    const memberToDelete = members.find(m => m.member_id === memberId);
    setMembers(prev => prev.filter(m => m.member_id !== memberId));
    setSelectedMember(null);
    try {
      if (memberToDelete?.photo_url) {
        deleteOldStoragePhoto(memberToDelete.photo_url);
      }
      await supabase.from('members').delete().eq('member_id', memberId);
      if (userId) await supabase.from('users').update({ has_registered: false, member_id: null }).eq('id', userId);
    } catch (err) {
      console.error('Delete error:', err);
      loadMembers();
    }
  };

  const approveMember = async (member) => {
    // Optimistic UI update
    setMembers(prev => prev.map(m => m.member_id === member.member_id ? {
      ...m,
      status: 'approved',
      rejection_reason: null,
      approved_at: new Date().toISOString(),
      approved_by: userProfile?.name || 'Admin'
    } : m));

    if (selectedMember && (selectedMember.member_id === member.member_id || (member.id && selectedMember.id === member.id))) {
      setSelectedMember(prev => ({
        ...prev,
        status: 'approved',
        rejection_reason: null,
        approved_at: new Date().toISOString(),
        approved_by: userProfile?.name || 'Admin'
      }));
    }

    try {
      const { error } = await supabase
        .from('members')
        .update({
          status: 'approved',
          rejection_reason: null,
          approved_at: new Date().toISOString(),
          approved_by: userProfile?.name || 'Admin'
        })
        .eq('member_id', member.member_id);

      if (error) throw error;

      // Background email notification
      try {
        const payload = new FormData();
        payload.append('access_key', import.meta.env.VITE_WEB3FORMS_KEY);
        payload.append('subject', '✅ உறுப்பினர் அனுமதி / Membership Approved: ' + member.full_name);
        payload.append('from_name', 'TIWTN Admin');
        payload.append('message',
          'அன்புள்ள ' + member.full_name + ',\n\n' +
          'உங்கள் தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்க உறுப்பினர் விண்ணப்பம் அனுமதிக்கப்பட்டது!\n\n' +
          'உறுப்பினர் எண் / Member ID: ' + member.member_id + '\n' +
          'மாவட்டம் / District: ' + member.district + '\n\n' +
          'Dear ' + member.full_name + ',\n\nYour membership has been APPROVED!\n' +
          'Login to download your ID card:\nhttps://www.thennindiaweldingthozhilaalargalnalasangam.org/profile\n\n- TIWTN Admin Team'
        );
        fetch('https://api.web3forms.com/submit', { method: 'POST', body: payload }).catch(() => {});
      } catch (err) {}
    } catch (err) {
      console.error('Approve error:', err);
      loadMembers();
      alert('Error approving member: ' + err.message);
    }
  };

  const rejectMember = async (member) => {
    const reason = window.prompt(
      'நிராகரிப்பு காரணம் / Rejection reason for ' + member.full_name + ':\n(This will be shown to the member)'
    );
    if (reason === null) return;
    if (!reason.trim()) { alert('காரணம் உள்ளிடவும் / Please enter a reason'); return; }

    const cleanReason = reason.trim();
    // Optimistic UI update
    setMembers(prev => prev.map(m => m.member_id === member.member_id ? {
      ...m,
      status: 'rejected',
      rejection_reason: cleanReason
    } : m));

    if (selectedMember && (selectedMember.member_id === member.member_id || (member.id && selectedMember.id === member.id))) {
      setSelectedMember(prev => ({
        ...prev,
        status: 'rejected',
        rejection_reason: cleanReason
      }));
    }

    try {
      const { error } = await supabase
        .from('members')
        .update({ status: 'rejected', rejection_reason: cleanReason })
        .eq('member_id', member.member_id);

      if (error) throw error;

      // Background email notification
      try {
        const payload = new FormData();
        payload.append('access_key', import.meta.env.VITE_WEB3FORMS_KEY);
        payload.append('subject', '❌ விண்ணப்பம் நிராகரிப்பு / Application Rejected: ' + member.full_name);
        payload.append('from_name', 'TIWTN Admin');
        payload.append('message',
          'அன்புள்ள ' + member.full_name + ',\n\n' +
          'உங்கள் விண்ணப்பம் தற்போது நிராகரிக்கப்பட்டது.\n\n' +
          'காரணம் / Reason: ' + cleanReason + '\n\n' +
          'Dear ' + member.full_name + ',\nYour membership application was rejected.\nReason: ' + cleanReason + '\n\nRe-apply at:\nhttps://www.thennindiaweldingthozhilaalargalnalasangam.org/profile\n\n- TIWTN Admin Team'
        );
        fetch('https://api.web3forms.com/submit', { method: 'POST', body: payload }).catch(() => {});
      } catch (err) {}
    } catch (err) {
      console.error('Reject error:', err);
      loadMembers();
      alert('Error rejecting member: ' + err.message);
    }
  };

  const statusBadge = (status) => {
    const cfg = {
      approved: { bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46', text: '✅ Approved' },
      pending:  { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', text: '⏳ Pending' },
      rejected: { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B', text: '❌ Rejected' },
    };
    const c = cfg[status] || cfg.pending;
    return (
      <span style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: '800',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
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
      const oldPhotoUrl = editMember._original_photo_url || editMember.photo_url;

      // If admin selected a new photo file
      if (editPhotoFile) {
        try {
          // Compress before upload
          const compressed = await compressImageFile(editPhotoFile);

          // 1. Upload to Cloudinary (Primary)
          const cloudinaryUrl = await uploadToCloudinary(compressed, effectiveMemberId);
          if (cloudinaryUrl) {
            newPhotoUrl = cloudinaryUrl.includes('?') ? cloudinaryUrl : `${cloudinaryUrl}?t=${Date.now()}`;
            newPhotoBase64 = null;
            // Clean up old storage photo
            if (oldPhotoUrl && oldPhotoUrl !== newPhotoUrl) {
              deleteOldStoragePhoto(oldPhotoUrl);
            }
          } else {
            // 2. Fallback to Supabase Storage
            const path = `members/${effectiveMemberId}_${Date.now()}.jpg`;
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

            newPhotoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
            newPhotoBase64 = null;
            if (oldPhotoUrl && oldPhotoUrl !== newPhotoUrl) {
              deleteOldStoragePhoto(oldPhotoUrl);
            }
          }
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
        photo_url: newPhotoUrl || editMember.photo_url || editMember._original_photo_url || null,
        photo_base64: (newPhotoUrl || editMember.photo_url || editMember._original_photo_url) ? null : (newPhotoBase64 || editMember.photo_base64 || editMember._original_photo_base64 || null)
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

      // Optimistic UI: immediately update the member in local state without waiting for full reload
      const updatedMemberData = {
        ...editMember,
        ...updatePayload,
        photo_url: updatePayload.photo_url,
        photo_base64: updatePayload.photo_base64,
        status: andApprove ? 'approved' : editMember.status,
        rejection_reason: andApprove ? null : editMember.rejection_reason,
      };
      setMembers(prev => prev.map(m =>
        m.id === editMember.id || m.member_id === oldMemberId ? updatedMemberData : m
      ));

      if (selectedMember && (selectedMember.member_id === oldMemberId || selectedMember.member_id === effectiveMemberId || (editMember.id && selectedMember.id === editMember.id))) {
        setSelectedMember(updatedMemberData);
      }

      setEditMember(null);
      setEditPhotoPreview(null);
      setEditPhotoFile(null);

      // Background reload to sync latest DB state
      loadMembers();
      if (andApprove) loadUsers();
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

  // ── Photo Cropper Handlers ────────────────────────────────────
  const openCropper = ({ imageSrc, member = null, target = 'direct', title = null }) => {
    const src = imageSrc || getPhotoSrc(member);
    if (!src) {
      alert('பயிர் செய்ய புகைப்படம் இல்லை / No photo available to crop');
      return;
    }
    setCropperState({
      isOpen: true,
      imageSrc: src,
      member,
      target,
      title
    });
  };

  const closeCropper = () => {
    setCropperState({
      isOpen: false,
      imageSrc: null,
      member: null,
      target: null,
      title: null
    });
  };

  const handleCropperComplete = (croppedBlob, croppedDataUrl, croppedFile) => {
    if (cropperState.target === 'edit') {
      setEditPhotoPreview(croppedDataUrl);
      setEditPhotoFile(croppedFile);
    } else if (cropperState.target === 'register') {
      setAdminPhotoPreview(croppedDataUrl);
      setNewMember(prev => ({
        ...prev,
        photoPreview: croppedDataUrl,
        photoFile: croppedFile
      }));
    }
    closeCropper();
  };

  const handleDirectCropSave = async (croppedBlob, croppedDataUrl, croppedFile, andApprove = false) => {
    const targetMember = cropperState.member;
    if (!targetMember) return;

    setSavingDirectCrop(true);
    try {
      const effectiveMemberId = targetMember.member_id;
      const oldPhotoUrl = targetMember.photo_url;
      let newPhotoUrl = null;

      // Compress and upload
      const compressed = await compressImageFile(croppedFile);

      // 1. Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(compressed, effectiveMemberId);
      if (cloudinaryUrl) {
        newPhotoUrl = cloudinaryUrl.includes('?') ? cloudinaryUrl : `${cloudinaryUrl}?t=${Date.now()}`;
        if (oldPhotoUrl && oldPhotoUrl !== newPhotoUrl) {
          deleteOldStoragePhoto(oldPhotoUrl);
        }
      } else {
        // 2. Supabase Storage fallback
        const path = `members/${effectiveMemberId}_${Date.now()}.jpg`;
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
        newPhotoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        if (oldPhotoUrl && oldPhotoUrl !== newPhotoUrl) {
          deleteOldStoragePhoto(oldPhotoUrl);
        }
      }

      const updatePayload = {
        photo_url: newPhotoUrl,
        photo_base64: null
      };

      if (andApprove) {
        updatePayload.status = 'approved';
        updatePayload.rejection_reason = null;
        updatePayload.approved_at = new Date().toISOString();
        updatePayload.approved_by = userProfile?.name || 'Admin';
      }

      let query = supabase.from('members').update(updatePayload);
      if (targetMember.id) {
        query = query.eq('id', targetMember.id);
      } else {
        query = query.eq('member_id', effectiveMemberId);
      }

      const { error: updateError } = await query;
      if (updateError) throw updateError;

      // If approved, send Web3Forms email notification
      if (andApprove) {
        try {
          const payload = new FormData();
          payload.append('access_key', import.meta.env.VITE_WEB3FORMS_KEY);
          payload.append('subject', '✅ உறுப்பினர் அனுமதி / Membership Approved: ' + targetMember.full_name);
          payload.append('from_name', 'TIWTN Admin');
          payload.append('message',
            'அன்புள்ள ' + targetMember.full_name + ',\n\n' +
            'உங்கள் தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்க உறுப்பினர் விண்ணப்பம் அனுமதிக்கப்பட்டது!\n\n' +
            'உறுப்பினர் எண் / Member ID: ' + effectiveMemberId + '\n' +
            'மாவட்டம் / District: ' + targetMember.district + '\n\n' +
            'Dear ' + targetMember.full_name + ',\n\nYour membership has been APPROVED!\n' +
            'Login to download your ID card:\nhttps://www.thennindiaweldingthozhilaalargalnalasangam.org/profile\n\n- TIWTN Admin Team'
          );
          await fetch('https://api.web3forms.com/submit', { method: 'POST', body: payload });
        } catch (err) {
          console.error('Email notification error:', err);
        }
      }

      // Update in local states
      setMembers(prev => prev.map(m => {
        if (m.member_id === effectiveMemberId || (targetMember.id && m.id === targetMember.id)) {
          return {
            ...m,
            photo_url: newPhotoUrl,
            photo_base64: null,
            ...(andApprove ? { status: 'approved', rejection_reason: null } : {})
          };
        }
        return m;
      }));

      if (selectedMember && selectedMember.member_id === effectiveMemberId) {
        setSelectedMember(prev => ({
          ...prev,
          photo_url: newPhotoUrl,
          photo_base64: null,
          ...(andApprove ? { status: 'approved', rejection_reason: null } : {})
        }));
      }

      if (editMember && editMember.member_id === effectiveMemberId) {
        setEditMember(prev => ({
          ...prev,
          photo_url: newPhotoUrl,
          photo_base64: null,
          ...(andApprove ? { status: 'approved', rejection_reason: null } : {})
        }));
        setEditPhotoPreview(newPhotoUrl);
      }

      closeCropper();
      await loadMembers();
      alert(andApprove ? '✅ படம் பயிர் செய்யப்பட்டு அனுமதிக்கப்பட்டது! / Cropped & Approved!' : '✅ புகைப்படம் பயிர் செய்யப்பட்டு சேமிக்கப்பட்டது! / Photo Cropped & Saved!');
    } catch (err) {
      console.error('Direct crop save failed:', err);
      alert('பயிர் செய்த படத்தை சேமிப்பதில் பிழை / Save failed: ' + err.message);
    } finally {
      setSavingDirectCrop(false);
    }
  };

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
    if (file.size > 15 * 1024 * 1024) {
      alert('புகைப்படம் 15MB-க்குள் இருக்க வேண்டும் / Max 15MB');
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

    try {
      // Check duplicate Aadhaar in members (Aadhaar must be strictly unique per person)
      const { data: dupAadhaars } = await supabase
        .from('members')
        .select('member_id, full_name')
        .eq('aadhar', newMember.aadhaar)
        .limit(1);

      const dupAadhaar = dupAadhaars && dupAadhaars.length > 0 ? dupAadhaars[0] : null;

      if (dupAadhaar) {
        alert(`இந்த ஆதார் எண் ஏற்கனவே பதிவாகியுள்ளது / This Aadhaar is already registered.\nMember: ${dupAadhaar.full_name} (${dupAadhaar.member_id})`);
        setRegSubmitting(false);
        return;
      }

      const memberId = await generateMemberId(newMember.pledgeDistrict);

      let photoUrl = null;
      if (newMember.photoFile) {
        try {
          const file = newMember.photoFile;
          // Compress before upload
          const compressed = await compressImageFile(file);

          // 1. Upload to Cloudinary
          const cloudinaryUrl = await uploadToCloudinary(compressed, memberId);
          if (cloudinaryUrl) {
            photoUrl = cloudinaryUrl;
          } else {
            // 2. Fallback to Supabase Storage
            const path = `members/${memberId}`;
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
            photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
          }
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
        status: 'pending',
        registered_at: new Date().toISOString(),
      };
      let currentMemberId = memberId;
      let insertSuccess = false;
      let retryCount = 0;

      while (!insertSuccess && retryCount < 10) {
        record.member_id = currentMemberId;
        const { error: insertErr } = await supabase.from('members').insert(record);

        if (!insertErr) {
          insertSuccess = true;
          break;
        }

        const isConflict =
          insertErr.code === '23505' ||
          insertErr.message?.includes('members_member_id_key') ||
          insertErr.message?.includes('unique constraint') ||
          insertErr.message?.includes('duplicate key');

        if (isConflict) {
          retryCount++;
          await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
          currentMemberId = await generateMemberId(newMember.pledgeDistrict, retryCount);
        } else {
          throw insertErr;
        }
      }

    // Fix: mark matching user as registered (find by mobile number)
    if (newMember.mobile) {
      const { data: matchedUsers } = await supabase
        .from('users')
        .select('id, member_id')
        .eq('mobile', newMember.mobile);

      // Only link to an unlinked user with this mobile number
      const unlinkedUser = matchedUsers?.find(u => !u.member_id);
      const userIdToUpdate = unlinkedUser?.id || (matchedUsers?.length === 1 ? matchedUsers[0].id : null);
      // Link user_id in members table too!
      if (userIdToUpdate) {
        await supabase
          .from('users')
          .update({ has_registered: true, member_id: currentMemberId })
          .eq('id', userIdToUpdate);
        await supabase
          .from('members')
          .update({ user_id: userIdToUpdate })
          .eq('member_id', currentMemberId);
        loadUsers();
      }
    }

      // Send admin notification safely in background (non-blocking)
      sendAdminNotification(newMember, currentMemberId).catch(err => console.warn('Email notification error:', err));

      // Set success state with the created member record and optimistically update members list
      setRegSuccess(record);
      setMembers(prev => [record, ...prev]);
      loadMembers();
    } catch (err) {
      console.error('Admin reg error:', err);
      alert('Error: ' + err.message);
    } finally {
      setRegSubmitting(false);
    }
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

    // 1. Upload to Cloudinary (Primary — 25GB Storage, Fast Global CDN)
    try {
      const cloudinaryUrl = await uploadToCloudinary(compressedFile, `gallery_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
      if (cloudinaryUrl) {
        return cloudinaryUrl;
      }
    } catch (cErr) {
      console.warn('Cloudinary upload fallback to Supabase:', cErr);
    }

    // 2. Fallback to Supabase Storage if Cloudinary is unavailable
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


  return (
    <div className="min-h-screen admin-dashboard" style={{
      background: '#F8FAFC',
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(0, 51, 102, 0.04) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(255, 107, 0, 0.04) 0px, transparent 50%)'
    }}>

      {/* ── MOBILE TOP BAR ── */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-[#070F1E] border-b border-white/10 px-4 py-3 md:hidden shadow-xl">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5 ring-1 ring-amber-500/30" />
          <div>
            <span className="font-extrabold text-white text-sm tracking-wide">TIWTN Admin</span>
            <span className="block text-[10px] text-emerald-400 font-semibold leading-tight">● Online</span>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(o => !o)} className="text-white text-xl p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition">
          {sidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* ── MOBILE DRAWER OVERLAY ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      )}

      <div className="flex">
        {/* ── SIDEBAR ── */}
        <aside className={`
          fixed top-0 left-0 h-full w-64 z-20 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:w-[260px] md:h-screen md:sticky md:top-0
        `} style={{
          background: 'linear-gradient(180deg, #070F1E 0%, #0A192F 45%, #071322 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.25)'
        }}>

          {/* Sidebar header */}
          <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3.5 flex-shrink-0">
            <img src="/logo.png" alt="TIWTN Logo" className="w-11 h-11 rounded-xl object-contain ring-2 ring-amber-500/40 shadow-lg bg-white/10 p-1 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-black text-white text-sm tracking-wide truncate">TIWTN Admin</div>
              <div className="text-[11px] text-amber-300/80 font-medium truncate">தென்னிந்திய வெல்டிங் சங்கம்</div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold tracking-wider uppercase mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 admin-pulse-dot" />
                Live Console
              </div>
            </div>
          </div>

          {/* Admin Profile Card */}
          <div className="mx-3.5 mt-3.5 mb-2 p-3 rounded-xl" style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)'
          }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B00] to-[#FFB347] flex items-center justify-center font-black text-white text-xs shadow-md flex-shrink-0">
                {(userProfile?.name || userProfile?.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Super Admin</span>
                </div>
                <div className="text-xs text-white/90 font-semibold truncate mt-0.5" title={userProfile?.email}>
                  {userProfile?.email || userProfile?.name || 'Administrator'}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto admin-sidebar-scroll">
            {NAV.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => goTab(tab.id)}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center gap-3 relative group"
                  style={isActive ? {
                    background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.22) 0%, rgba(255, 179, 71, 0.1) 100%)',
                    color: '#FFFFFF',
                    borderLeft: '4px solid #FF6B00',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 14px rgba(255, 107, 0, 0.15)',
                    fontWeight: '700',
                    paddingLeft: '11px'
                  } : {
                    color: 'rgba(255, 255, 255, 0.65)',
                    fontWeight: '500'
                  }}>
                  <span className="text-lg transition-transform group-hover:scale-110">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                  {tab.id === 'pending' && pendingCount > 0 && (
                    <span className="ml-auto bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full px-2 py-0.5 text-[11px] font-black shadow-md shadow-red-500/40 animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                  {tab.id === 'rejected' && rejectedCount > 0 && (
                    <span className="ml-auto bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-full px-2 py-0.5 text-[11px] font-black shadow-md shadow-red-600/40 animate-pulse">
                      {rejectedCount}
                    </span>
                  )}
                </button>
              );
            })}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '10px 0' }} />
            <button onClick={() => { exportCSV(); setSidebarOpen(false); }}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm flex items-center gap-3 transition-colors hover:bg-white/5 hover:text-white"
              style={{ color: 'rgba(255,255,255,0.6)' }}>
              <span className="text-lg">📥</span>
              <span>Export CSV Data</span>
            </button>
          </nav>

          {/* Footer */}
          <div className="p-3.5 border-t border-white/10 flex-shrink-0 space-y-2">
            <button onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{ color: '#F87171', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}>
              <span>🚪</span> <span className="font-bold">Logout</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 p-4 md:p-8">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-6xl">
              {/* Executive Header Banner */}
              <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200/60 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <span>🏛️</span> தென்னிந்திய வெல்டிங் நலச்சங்கம் · Administrative Portal
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                    Dashboard Overview
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' })}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 admin-pulse-dot" />
                      Realtime Live Sync
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                  <button onClick={() => goTab('register')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
                    style={{ background: 'linear-gradient(135deg, #FF6B00, #E55A00)', boxShadow: '0 4px 12px rgba(255, 107, 0, 0.3)' }}>
                    <span>➕</span> புது உறுப்பினர் / Register
                  </button>
                  <button onClick={() => exportCSV()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition">
                    <span>📥</span> CSV
                  </button>
                  <button onClick={() => { loadMembers(); loadUsers(); }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#003366] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition">
                    <span className={loadingData ? 'animate-spin' : ''}>↻</span> Refresh
                  </button>
                </div>
              </div>

              {/* Bento-Grid Stat Cards */}
              {(() => {
                const notRegistered = users.filter(u => !u.has_registered).length;
                const legacyPhotos  = members.filter(m => m.photo_base64 && !m.photo_url).length;
                const cards = [
                  {
                    label: 'Total Members',
                    tamil: 'மொத்த உறுப்பினர்கள்',
                    value: members.length,
                    sub: 'All time registrations',
                    tag: '📈 Total Roster',
                    accent: '#FF6B00',
                    shadow: 'rgba(255, 107, 0, 0.35)',
                    iconBg: 'linear-gradient(135deg, #FF6B00, #FF8C00)',
                    icon: '👥'
                  },
                  {
                    label: 'Registered Today',
                    tamil: 'இன்று இணைந்தவர்கள்',
                    value: todayCount,
                    sub: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' }),
                    tag: '⚡ New Inflow',
                    accent: '#10B981',
                    shadow: 'rgba(16, 185, 129, 0.35)',
                    iconBg: 'linear-gradient(135deg, #10B981, #059669)',
                    icon: '✅'
                  },
                  {
                    label: 'Districts Covered',
                    tamil: 'மாவட்டங்கள்',
                    value: activeDistricts,
                    sub: `of ${TAMIL_NADU_DISTRICTS.length} total districts`,
                    tag: '📍 40/40 Covered',
                    accent: '#2563EB',
                    shadow: 'rgba(37, 99, 235, 0.35)',
                    iconBg: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    icon: '🗺️'
                  },
                  {
                    label: 'Signed-Up Users',
                    tamil: 'இணைய கணக்குகள்',
                    value: users.length,
                    sub: 'Accounts created',
                    tag: '👤 Portal Accounts',
                    accent: '#7C3AED',
                    shadow: 'rgba(124, 58, 237, 0.35)',
                    iconBg: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                    icon: '👤'
                  },
                  {
                    label: 'Pending Approval',
                    tamil: 'அனுமதி நிலுவை',
                    value: pendingCount,
                    sub: pendingCount > 0 ? 'Awaiting admin review' : 'All applications reviewed',
                    tag: pendingCount > 0 ? '⏳ Action Required' : '✓ All Clear',
                    accent: '#F59E0B',
                    shadow: 'rgba(245, 158, 11, 0.35)',
                    iconBg: pendingCount > 0 ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'linear-gradient(135deg, #10B981, #059669)',
                    icon: pendingCount > 0 ? '⏳' : '✅',
                    isAlert: pendingCount > 0,
                    onClick: pendingCount > 0 ? () => goTab('pending') : undefined
                  },
                  {
                    label: 'Rejected Applications',
                    tamil: 'நிராகரிக்கப்பட்டவை',
                    value: rejectedCount,
                    sub: rejectedCount > 0 ? 'Fix info / photo & approve' : 'Zero rejected',
                    tag: rejectedCount > 0 ? '❌ Requires Action' : '✓ All Good',
                    accent: '#DC2626',
                    shadow: 'rgba(220, 38, 38, 0.35)',
                    iconBg: rejectedCount > 0 ? 'linear-gradient(135deg, #DC2626, #B91C1C)' : 'linear-gradient(135deg, #10B981, #059669)',
                    icon: rejectedCount > 0 ? '❌' : '✅',
                    isAlert: rejectedCount > 0,
                    onClick: rejectedCount > 0 ? () => goTab('rejected') : undefined
                  },
                  {
                    label: 'Pending Registration',
                    tamil: 'விண்ணப்பிக்காதோர்',
                    value: notRegistered,
                    sub: notRegistered > 0 ? 'Signed-up but no form' : 'All accounts submitted',
                    tag: '📋 Unregistered',
                    accent: '#EA580C',
                    shadow: 'rgba(234, 88, 12, 0.35)',
                    iconBg: notRegistered > 0 ? 'linear-gradient(135deg, #EA580C, #C2410C)' : 'linear-gradient(135deg, #10B981, #059669)',
                    icon: notRegistered > 0 ? '⏳' : '🎉'
                  },
                  {
                    label: 'Legacy Storage Photos',
                    tamil: 'பழைய படங்கள்',
                    value: legacyPhotos,
                    sub: legacyPhotos > 0 ? 'Pending cloud sync' : '100% Cloud Synced',
                    tag: legacyPhotos > 0 ? '🖼️ Syncing' : '☁️ 100% Cloud',
                    accent: '#0D9488',
                    shadow: 'rgba(13, 148, 136, 0.35)',
                    iconBg: legacyPhotos > 0 ? 'linear-gradient(135deg, #0D9488, #0F766E)' : 'linear-gradient(135deg, #10B981, #059669)',
                    icon: legacyPhotos > 0 ? '🖼️' : '☁️'
                  },
                ];

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                    {cards.map(card => (
                      <div key={card.label}
                        className="admin-card-hover relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm transition-all flex flex-col justify-between group cursor-pointer"
                        style={{
                          borderTop: `4px solid ${card.accent}`
                        }}
                        onClick={card.onClick}
                      >
                        {/* Subtle ambient watermark glow */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none" style={{ background: card.accent }} />

                        {/* Top row: Icon + Tag */}
                        <div className="flex items-center justify-between gap-2 relative z-10">
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: card.iconBg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '20px',
                            boxShadow: `0 8px 16px -4px ${card.shadow}`
                          }}>
                            {card.icon}
                          </div>
                          <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
                            card.isAlert
                              ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {card.tag}
                          </span>
                        </div>

                        {/* Middle Metric: Number + Label */}
                        <div className="mt-4 relative z-10">
                          <div className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none" style={{ color: card.accent }}>
                            {loadingData ? '—' : (card.value || 0).toLocaleString('en-IN')}
                          </div>
                          <div className="text-sm font-bold text-slate-800 mt-2">
                            {card.label}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">
                            {card.tamil}
                          </div>
                        </div>

                        {/* Bottom row: Subtitle + Action link */}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 relative z-10">
                          <span className="truncate">{card.sub}</span>
                          {card.onClick && (
                            <span className="text-xs font-bold text-[#FF6B00] flex items-center gap-0.5 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-1">
                              View →
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* ── LIVE CLOUD STORAGE & DATABASE MONITOR ── */}
              {(() => {
                // Cloudinary Photo Storage (25 GB capacity = 25,600 MB)
                const memberPhotosCount = members.filter(m => m.photo_url || m.photo_base64).length;
                const galleryPhotosCount = galleryItems.length;
                const totalPhotos = memberPhotosCount + galleryPhotosCount;
                const estimatedPhotoStorageMB = Math.round((memberPhotosCount * 65 + galleryPhotosCount * 120) / 1024);
                const cloudTotalCapacityMB = 25600; // 25 GB Cloudinary Free Tier
                const cloudStoragePct = Math.max(0.1, Number(((estimatedPhotoStorageMB / cloudTotalCapacityMB) * 100).toFixed(2)));
                const remainingPhotoSlots = Math.max(0, Math.round((cloudTotalCapacityMB * 1024 - (memberPhotosCount * 65 + galleryPhotosCount * 120)) / 65));

                // Supabase Database Capacity (500 MB capacity)
                const dbTotalRecords = members.length + users.length;
                const estimatedDbMB = Number(((dbTotalRecords * 2.5) / 1024).toFixed(2));
                const dbCapacityMB = 500;
                const dbStoragePct = Math.max(0.1, Number(((estimatedDbMB / dbCapacityMB) * 100).toFixed(2)));

                return (
                  <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-sm mt-2">
                    {/* Widget Header */}
                    <div className="flex flex-wrap gap-3 justify-between items-center pb-4 mb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center text-xl text-white shadow-md">
                          ☁️
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-base">
                            Live Cloud Storage & Database Telemetry
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Real-time tracking of Cloudinary CDN image assets and Supabase SQL database quotas
                          </p>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 admin-pulse-dot" />
                        Live & Healthy
                      </div>
                    </div>

                    {/* Dual Metric Gauges */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Metric 1: Cloudinary CDN */}
                      <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              🖼️ Photo Assets (Cloudinary CDN)
                            </span>
                            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded-full">
                              25 GB Free Plan
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 mb-2.5">
                            Used: <strong className="text-slate-900">{estimatedPhotoStorageMB} MB</strong> / 25,600 MB ({totalPhotos} photos hosted)
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(1, cloudStoragePct))}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 font-medium mt-3 pt-2 border-t border-slate-200/60">
                          <span className="font-bold text-emerald-600">{cloudStoragePct}% used</span>
                          <span>~{remainingPhotoSlots.toLocaleString()} photo slots remaining</span>
                        </div>
                      </div>

                      {/* Metric 2: Supabase Database */}
                      <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              🗄️ SQL Database (Supabase)
                            </span>
                            <span className="text-[11px] font-extrabold text-sky-700 bg-sky-100/80 border border-sky-200 px-2 py-0.5 rounded-full">
                              500 MB Free Tier
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 mb-2.5">
                            Used: <strong className="text-slate-900">{estimatedDbMB} MB</strong> / 500 MB ({dbTotalRecords} total database rows)
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(1, dbStoragePct))}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 font-medium mt-3 pt-2 border-t border-slate-200/60">
                          <span className="font-bold text-sky-600">{dbStoragePct}% used</span>
                          <span>{Math.round(500 - estimatedDbMB)} MB remaining</span>
                        </div>
                      </div>
                    </div>
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
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-4 md:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50/60 to-white">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <span>📋</span> Recent Registrations / சமீபத்திய பதிவுகள்
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Latest {Math.min(members.length, 8)} of {members.length} registered members
                    </p>
                  </div>
                  <button onClick={() => goTab('members')}
                    className="text-xs font-bold text-[#FF6B00] bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl px-3.5 py-1.5 transition flex items-center gap-1">
                    View Complete Directory →
                  </button>
                </div>

                {loadingData ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    <span className="inline-block animate-spin mr-2">↻</span> Loading members…
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {members.slice(0, 8).map((m, idx) => {
                      const photoSrc = getPhotoSrc(m);
                      return (
                        <div key={idx}
                          className="p-3.5 md:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition cursor-pointer group"
                          onClick={() => handleViewMember(m)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {photoSrc ? (
                              <img src={photoSrc} alt="" crossOrigin="anonymous"
                                className="w-11 h-11 rounded-full object-cover ring-2 ring-amber-400/60 shadow-sm flex-shrink-0" />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FFB347] text-white flex items-center justify-center font-black text-base flex-shrink-0 shadow-sm">
                                {m.full_name?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 text-sm truncate group-hover:text-[#FF6B00] transition-colors">
                                {m.full_name}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                                <span className="font-semibold text-slate-700">{m.district}</span>
                                <span>•</span>
                                <span>{m.posting || 'Member'}</span>
                                <span>•</span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-bold text-slate-600">{m.blood_group || '—'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <span className="font-mono text-xs font-bold text-[#003366] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md inline-block">
                              {m.member_id}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1 font-medium">{m.join_date}</div>
                          </div>
                        </div>
                      );
                    })}
                    {!loadingData && members.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                        No registrations yet.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Pending Registration Users ── */}
              {(() => {
                const pendingUsers = users.filter(u => !u.has_registered);
                if (pendingUsers.length === 0) return null;
                return (
                  <div className="bg-white rounded-2xl shadow-sm border border-rose-200/80 overflow-hidden">
                    <div className="p-4 md:p-5 border-b border-rose-100 bg-rose-50/50 flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <h3 className="font-extrabold text-rose-800 text-sm flex items-center gap-2">
                          <span>⏳</span> Users Pending Registration / உறுப்பினர் படிவம் முடிக்காதவர்கள்
                        </h3>
                        <p className="text-xs text-rose-600/80 mt-0.5">
                          {pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} signed up but haven't submitted member profile yet
                        </p>
                      </div>
                      <button onClick={() => goTab('register')} className="text-xs bg-[#003366] hover:bg-[#002244] text-white px-3.5 py-2 rounded-xl transition font-bold shadow-xs">
                        + Register On Behalf
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                      {pendingUsers.slice(0, 10).map((u, idx) => (
                        <div key={idx} className="p-3 px-5 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                          <div>
                            <div className="font-bold text-slate-800">{u.name || 'Unnamed User'}</div>
                            <div className="text-slate-500 font-mono text-[11px]">{u.email}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                            Not Registered
                          </span>
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
            <div className="space-y-5 max-w-5xl">
              {/* Header Banner */}
              <div className="bg-white rounded-2xl p-5 md:p-6 border border-amber-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <span>⏳</span> Action Required
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    அனுமதி நிலுவை / Pending Approval
                    <span className="text-sm font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-300">
                      {pendingCount}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    புதிய விண்ணப்பங்களை சரிபார்த்து அடையாள அட்டை அனுமதியளிக்கவும்
                  </p>
                </div>
              </div>

              {pendingCount === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center border border-slate-200/80 shadow-sm">
                  <div className="text-5xl animate-bounce">🎉</div>
                  <div className="text-base font-extrabold text-slate-800 mt-3">நிலுவையில் விண்ணப்பங்கள் இல்லை</div>
                  <div className="text-xs text-slate-400 mt-1">All membership applications have been reviewed!</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {members
                    .filter(m => m.status === 'pending')
                    .map(member => (
                    <div key={member.member_id}
                      className="bg-white rounded-2xl border border-amber-200/90 p-5 md:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-start relative overflow-hidden"
                      style={{ borderLeft: '5px solid #F59E0B' }}
                    >
                      {/* Photo with crop overlay */}
                      <div className="flex-shrink-0">
                        {getPhotoSrc(member) ? (
                          <div className="relative group cursor-pointer"
                            onClick={() => openCropper({ member, imageSrc: getPhotoSrc(member), target: 'direct', title: 'புகைப்படம் பயிர் செய் / Crop ID Photo' })}
                          >
                            <img
                              src={getPhotoSrc(member)}
                              crossOrigin="anonymous"
                              className="w-20 h-24 object-cover rounded-xl ring-2 ring-amber-400/80 shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-bold transition">
                              <span>✂️</span>
                              <span>பயிர் செய்</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-20 h-24 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FFB347] flex items-center justify-center text-2xl text-white font-black shadow-sm">
                            {member.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          <h3 className="text-lg font-black text-slate-900">
                            {member.full_name}
                          </h3>
                          <span className="font-mono text-xs font-bold text-[#003366] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                            {member.member_id}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                          {[
                            ['பதவி / Posting', member.posting],
                            ['மாவட்டம் / District', member.district],
                            ['கைபேசி / Mobile', member.mobile],
                            ['இரத்த பிரிவு / Blood', member.blood_group],
                            ['பிறந்த தேதி / DOB', member.dob],
                            ['கிளை / Branch', member.branch || '-'],
                            ['விண்ணப்பித்த தேதி', member.registered_at ? new Date(member.registered_at).toLocaleDateString('en-IN') : '-']
                          ].map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between sm:justify-start gap-2">
                              <span className="text-slate-500 font-medium">{label}:</span>
                              <span className="font-bold text-slate-900">{value || '-'}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 w-full md:w-44 flex-shrink-0">
                        <button
                          onClick={() => openCropper({ member, imageSrc: getPhotoSrc(member), target: 'direct', title: 'புகைப்படம் பயிர் செய் / Crop ID Photo' })}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] text-white font-bold text-xs shadow-sm hover:opacity-95 transition flex items-center justify-center gap-1.5">
                          ✂️ படம் பயிர் செய்
                        </button>
                        <button
                          onClick={() => handlePrintMember(member)}
                          className="w-full py-2 px-3 rounded-xl bg-[#003366] text-white font-bold text-xs shadow-sm hover:opacity-95 transition flex items-center justify-center gap-1.5">
                          🖨️ படிவம் காண்க
                        </button>
                        <button
                          onClick={() => approveMember(member)}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-md hover:opacity-95 transition flex items-center justify-center gap-1.5">
                          ✅ அனுமதி / Approve
                        </button>
                        <button
                          onClick={() => rejectMember(member)}
                          className="w-full py-1.5 px-3 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs transition flex items-center justify-center gap-1.5">
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
            <div className="space-y-6 max-w-6xl">
              {/* Header Banner */}
              <div className="bg-white rounded-2xl p-5 md:p-6 border border-rose-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <span>⚠️</span> Action Required · மறுஆய்வு தேவை
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Rejected Applications
                    <span className="text-sm font-bold bg-rose-100 text-rose-700 px-3 py-1 rounded-full border border-rose-200">
                      {rejectedCount}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    தவறான விவரம் அல்லது தெளிவற்ற புகைப்படம் காரணத்தால் நிராகரிக்கப்பட்டவர்கள். இங்கு நேரடியாக விவரங்களை திருத்தி அல்லது பயிர் செய்து உடனடியாக அனுமதிக்கலாம்.
                  </p>
                </div>

                {rejectedCount > 0 && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setRejectedDistrictFilter(''); setRejectedSearchQuery(''); }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition">
                      🔄 Reset Filters
                    </button>
                  </div>
                )}
              </div>

              {/* District & Search Filters Card */}
              <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                    <input
                      type="text"
                      placeholder="Search rejected by name, mobile, member ID, reason..."
                      value={rejectedSearchQuery}
                      onChange={e => setRejectedSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 text-sm"
                    />
                    {rejectedSearchQuery && (
                      <button onClick={() => setRejectedSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                        ✕
                      </button>
                    )}
                  </div>
                  <select
                    value={rejectedDistrictFilter}
                    onChange={e => setRejectedDistrictFilter(e.target.value)}
                    className="w-full sm:w-64 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 text-sm">
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
                  <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-500 mr-1">Districts:</span>
                    <button
                      type="button"
                      onClick={() => setRejectedDistrictFilter('')}
                      className={`text-xs px-3 py-1 rounded-xl font-bold transition ${
                        rejectedDistrictFilter === ''
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}>
                      All ({rejectedCount})
                    </button>
                    {rejectedDistrictsSummary.map(d => (
                      <button
                        key={d.name}
                        type="button"
                        onClick={() => setRejectedDistrictFilter(d.name)}
                        className={`text-xs px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1.5 ${
                          rejectedDistrictFilter === d.name
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/70 hover:bg-rose-100'
                        }`}>
                        <span>{d.name}</span>
                        <span className="text-[10px] bg-white/80 px-1.5 py-0.5 rounded-full font-black text-rose-900">
                          {d.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Members List */}
              {rejectedCount === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center border border-slate-200/80 shadow-sm">
                  <div className="text-5xl animate-bounce">🎉</div>
                  <div className="text-base font-extrabold text-slate-800 mt-3">நிராகரிக்கப்பட்ட விண்ணப்பங்கள் இல்லை</div>
                  <div className="text-xs text-slate-400 mt-1">No rejected applications at this time!</div>
                </div>
              ) : filteredRejectedMembers.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
                  <div className="text-3xl text-slate-400">🔍</div>
                  <div className="text-sm font-bold text-slate-700 mt-2">பொருந்தும் விண்ணப்பங்கள் இல்லை / No matching applications found</div>
                  <button onClick={() => { setRejectedDistrictFilter(''); setRejectedSearchQuery(''); }} className="mt-3 text-xs font-bold text-rose-600 underline">
                    Clear all search filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRejectedMembers.map(member => (
                    <div key={member.member_id}
                      className="bg-white rounded-2xl border border-rose-200/90 p-5 md:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-start relative overflow-hidden"
                      style={{ borderLeft: '5px solid #EF4444' }}
                    >
                      {/* Photo with Crop Overlay */}
                      <div className="flex-shrink-0">
                        {getPhotoSrc(member) ? (
                          <div
                            className="relative group cursor-pointer"
                            title="படம் பயிர் செய்ய கிளிக் செய்யவும் / Click to Crop Photo"
                            onClick={() => openCropper({ member, imageSrc: getPhotoSrc(member), target: 'direct', title: 'நிராகரிக்கப்பட்ட புகைப்படம் பயிர் செய் / Crop Rejected Photo' })}
                          >
                            <img
                              src={getPhotoSrc(member)}
                              crossOrigin="anonymous"
                              className="w-20 h-24 object-cover rounded-xl ring-2 ring-rose-400/80 shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-bold transition">
                              <span>✂️</span>
                              <span>பயிர் செய்</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-20 h-24 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-2xl text-white font-black shadow-sm">
                            {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="text-lg font-black text-slate-900">
                            {member.full_name}
                          </h3>
                          <span className="font-mono text-xs font-bold text-[#003366] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                            {member.member_id}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                            ❌ Rejected
                          </span>
                        </div>

                        {/* Prominent Rejection Reason Box */}
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-3 text-xs">
                          <div className="font-extrabold text-rose-800 flex items-center gap-1.5 mb-0.5">
                            <span>⚠️</span> நிராகரிப்பு காரணம் / Reason:
                          </div>
                          <div className="font-semibold text-rose-950">
                            {member.rejection_reason || 'Information or Photo mismatch'}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                          {[
                            ['மாவட்டம் / District', member.district],
                            ['பதவி / Posting', member.posting],
                            ['கைபேசி / Mobile', member.mobile],
                            ['ஆதார் / Aadhar', displayAadhar(member.aadhar)],
                            ['இரத்த பிரிவு / Blood', member.blood_group],
                            ['பிறந்த தேதி / DOB', member.dob],
                            ['கிளை / Branch', member.branch || '-'],
                          ].map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between sm:justify-start gap-2">
                              <span className="text-slate-500 font-medium">{label}:</span>
                              <span className="font-bold text-slate-900">{value || '-'}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 w-full md:w-44 flex-shrink-0">
                        <button
                          onClick={() => openCropper({ member, imageSrc: getPhotoSrc(member), target: 'direct', title: 'நிராகரிக்கப்பட்ட புகைப்படம் பயிர் செய் / Crop Rejected Photo' })}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] text-white font-bold text-xs shadow-sm hover:opacity-95 transition flex items-center justify-center gap-1.5">
                          ✂️ படம் பயிர் செய்
                        </button>
                        <button
                          onClick={() => handleEditMemberClick(member)}
                          className="w-full py-2 px-3 rounded-xl bg-[#003366] text-white font-bold text-xs shadow-sm hover:opacity-95 transition flex items-center justify-center gap-1.5">
                          ✏️ திருத்து & படம் ஏற்று
                        </button>
                        <button
                          onClick={() => approveMember(member)}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-md hover:opacity-95 transition flex items-center justify-center gap-1.5">
                          ✅ அனுமதி / Approve
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePrintMember(member)}
                            title="படிவம் காண்க"
                            className="flex-1 py-1.5 px-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition flex items-center justify-center gap-1">
                            🖨️ படிவம்
                          </button>
                          <button
                            onClick={() => deleteMember(member.member_id, member.user_id)}
                            title="விண்ணப்பத்தை நீக்கு"
                            className="py-1.5 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition">
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
            <div className="space-y-5 max-w-6xl">
              {/* Directory Header Banner */}
              <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <span>👥</span> Member Directory
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    All Members
                    <span className="text-sm font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                      {members.length.toLocaleString('en-IN')}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    தென்னிந்திய வெல்டிங் நலச்சங்க உறுப்பினர் பட்டியல் மற்றும் அடையாள அட்டை விவரங்கள்
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                  <button onClick={async () => {
                    setDownloadingZip(true);
                    setDownloadProgress({ current: 0, total: members.length });
                    await bulkDownloadMembers(members, (current, total) => {
                      setDownloadProgress({ current, total });
                    });
                    setDownloadingZip(false);
                  }} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 transition">
                    <span>🗂️</span> Download All (ZIP)
                  </button>
                  <button onClick={() => goTab('register')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#FF6B00] to-[#E55A00] shadow-md shadow-amber-500/20 transition">
                    <span>➕</span> Register Member
                  </button>
                  <button onClick={exportCSV}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition">
                    <span>📥</span> CSV
                  </button>
                </div>
              </div>

              {/* Search + filter bar */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                  <input type="text" placeholder="Search name, mobile, member ID, aadhaar…"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 text-sm"
                  />
                  {searchQuery && (
                    <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                      ✕
                    </button>
                  )}
                </div>
                <select value={districtFilter}
                  onChange={e => { setDistrictFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full sm:w-56 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 text-sm">
                  <option value="">All Districts ({members.length})</option>
                  {TAMIL_NADU_DISTRICTS.map(d => {
                    const count = members.filter(m => m.district === d).length;
                    return <option key={d} value={d}>{d} {count > 0 ? `(${count})` : ''}</option>;
                  })}
                </select>
              </div>

              {/* Progress Modal */}
              {downloadingZip && (
                <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-4 border border-slate-200">
                    <div className="text-4xl animate-bounce">🗂️</div>
                    <h3 className="text-xl font-extrabold text-[#003366]">Generating ZIP...</h3>
                    <p className="text-xs text-slate-500">
                      {downloadProgress.current === 'zipping' 
                        ? 'Compressing ID cards into a ZIP archive...' 
                        : (`Processing card ${downloadProgress.current} of ${downloadProgress.total}...`)}
                    </p>
                    {downloadProgress.current !== 'zipping' && downloadProgress.total > 0 && (
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mt-4 border border-slate-200">
                        <div className="bg-gradient-to-r from-[#FF6B00] to-[#FFB347] h-full rounded-full transition-all duration-300" 
                          style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Table wrapper */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#002244] to-[#003366] text-white text-[11px] uppercase tracking-wider">
                        <th className="p-3.5 font-bold">#</th>
                        <th className="p-3.5 font-bold">Photo</th>
                        <th className="p-3.5 font-bold">Name / பெயர்</th>
                        <th className="p-3.5 font-bold">Member ID</th>
                        <th className="p-3.5 font-bold">District</th>
                        <th className="p-3.5 font-bold">Mobile</th>
                        <th className="p-3.5 font-bold">Status</th>
                        <th className="p-3.5 font-bold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100">
                      {loadingData
                        ? <tr><td colSpan="8" className="p-12 text-center text-slate-400">Loading members…</td></tr>
                        : paginatedMembers.map((m, idx) => (
                          <tr key={m.member_id} className="hover:bg-slate-50/80 transition group">
                            <td className="p-3.5 text-xs text-slate-400 font-mono">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                            <td className="p-3.5">
                              {(() => {
                                const photoSrc = getPhotoSrc(m);
                                return photoSrc ? (
                                  <img src={photoSrc} alt="" crossOrigin="anonymous" className="w-10 h-12 rounded-lg object-cover ring-1 ring-slate-300 shadow-xs" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FFB347] text-white flex items-center justify-center font-black text-xs shadow-xs">
                                    {m.full_name?.charAt(0)?.toUpperCase()}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900 group-hover:text-[#FF6B00] transition-colors max-w-[160px] truncate">{m.full_name}</div>
                              <div className="text-[11px] text-slate-400">{m.posting || 'Member'}</div>
                            </td>
                            <td className="p-3.5 font-mono text-xs font-bold text-[#003366]">
                              <span className="bg-blue-50 border border-blue-200/80 rounded-md px-2 py-0.5">{m.member_id}</span>
                            </td>
                            <td className="p-3.5 text-xs font-medium text-slate-700">{m.district}</td>
                            <td className="p-3.5 text-xs font-mono text-slate-600">{m.mobile}</td>
                            <td className="p-3.5">{statusBadge(m.status || 'approved')}</td>
                            <td className="p-3.5 text-center">
                              <div className="flex gap-1.5 justify-center">
                                <button onClick={() => handleViewMember(m)} title="View ID Card" className="px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition font-bold text-xs shadow-xs">Card</button>
                                <button onClick={() => handleEditMemberClick(m)} title="Edit Member" className="px-2.5 py-1 rounded-lg border border-amber-300 font-bold text-xs shadow-xs transition hover:brightness-95" style={{ backgroundColor: '#FEF3C7', borderColor: '#FCD34D', color: '#92400E' }}>Edit</button>
                                <button onClick={() => handlePrintMember(m)} title="Print Form" className="px-2 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition font-bold text-xs shadow-xs">🖨️</button>
                                <button onClick={() => deleteMember(m.member_id, m.user_id)} title="Delete Member" className="px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition font-bold text-xs shadow-xs">Del</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                      {!loadingData && paginatedMembers.length === 0 && <tr><td colSpan="8" className="p-12 text-center text-slate-400">No members matching search query.</td></tr>}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
                  <span className="text-xs font-medium text-slate-600">
                    Showing <strong className="text-slate-900">{filteredMembers.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)}</strong> of <strong className="text-slate-900">{filteredMembers.length}</strong> members
                  </span>
                  <div className="flex items-center gap-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-white transition bg-white shadow-xs">
                      ← Prev
                    </button>
                    <span className="text-xs font-bold text-slate-700 px-2">
                      Page {currentPage} of {Math.max(1, totalPages)}
                    </span>
                    <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-white transition bg-white shadow-xs">
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── REGISTER ON BEHALF ── */}
          {activeTab === 'register' && (
            <div className="max-w-5xl space-y-6">
              {/* Header Banner */}
              <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <span>📝</span> Administrative Enrolment · நேரடி உறுப்பினர் பதிவு
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                    Register Member
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    நிர்வாகி மூலம் புதிய உறுப்பினரை நேரடியாக பதிவு செய்து அடையாள அட்டை உருவாக்கவும்.
                  </p>
                </div>
                {regSuccess ? (
                  <button onClick={resetRegForm} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF6B00] to-[#E55A00] shadow-md shadow-amber-500/20 transition">
                    <span>➕</span> Register Another
                  </button>
                ) : (
                  <button onClick={resetRegForm} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
                    <span>🔄</span> Reset Form
                  </button>
                )}
              </div>

              {regSuccess ? (
                <div className="bg-white rounded-2xl shadow-sm border border-emerald-200/80 p-6 md:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-emerald-100">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl shadow-sm">
                        ✅
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-slate-900">Successfully Registered!</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Member ID: <span className="font-mono font-bold text-[#003366] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md ml-1">{regSuccess.member_id}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handlePrintMember(regSuccess)} className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition">
                        🖨️ Print Form
                      </button>
                      <button onClick={resetRegForm} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF6B00] to-[#E55A00] shadow-md shadow-amber-500/20 transition">
                        + Register Another
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center overflow-x-auto py-2">
                    <div className="transform scale-75 md:scale-90 origin-top">
                      <IDCard member={toIdCardShape(regSuccess)} showReset={false} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 md:p-8 space-y-6">
                  {/* Section 1: Personal Details */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-2">
                      <span>👤</span> 1. தனிநபர் விவரங்கள் / Personal Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          முழு பெயர் / Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newMember.fullName}
                          onChange={handleRegChange('fullName')}
                          placeholder="e.g. A. முருகன்"
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition ${
                            regErrors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                          }`}
                        />
                        {regErrors.fullName && <p className="mt-1 text-xs text-rose-500 font-semibold">{regErrors.fullName}</p>}
                      </div>

                      {/* Posting */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          பதவி / Posting <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newMember.posting}
                          onChange={handleRegChange('posting')}
                          placeholder="வெல்டர் / Welder"
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition ${
                            regErrors.posting ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                          }`}
                        />
                        {regErrors.posting && <p className="mt-1 text-xs text-rose-500 font-semibold">{regErrors.posting}</p>}
                      </div>

                      {/* DOB */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          பிறந்த தேதி / DOB <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={newMember.dob}
                          onChange={handleRegChange('dob')}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition ${
                            regErrors.dob ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                          }`}
                        />
                        {regErrors.dob && <p className="mt-1 text-xs text-rose-500 font-semibold">{regErrors.dob}</p>}
                      </div>

                      {/* Blood Group */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          இரத்த பிரிவு / Blood Group <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. O+ve / B+ve"
                          value={newMember.bloodGroup}
                          onChange={handleRegChange('bloodGroup')}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition ${
                            regErrors.bloodGroup ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                          }`}
                        />
                        {regErrors.bloodGroup && <p className="mt-1 text-xs text-rose-500 font-semibold">{regErrors.bloodGroup}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Contact & Identity */}
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-2">
                      <span>📞</span> 2. தொடர்பு & அடையாளம் / Contact & Identity
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Mobile */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          கைபேசி / Mobile <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="10 digit number"
                          inputMode="numeric"
                          value={newMember.mobile}
                          onChange={handleRegChange('mobile')}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition font-mono ${
                            regErrors.mobile ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                          }`}
                        />
                        {regErrors.mobile && <p className="mt-1 text-xs text-rose-500 font-semibold">{regErrors.mobile}</p>}
                      </div>

                      {/* Aadhaar */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          ஆதார் எண் / Aadhaar <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={12}
                          placeholder="12 digit number"
                          inputMode="numeric"
                          value={newMember.aadhaar}
                          onChange={handleRegChange('aadhaar')}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition font-mono ${
                            regErrors.aadhaar ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                          }`}
                        />
                        {regErrors.aadhaar && <p className="mt-1 text-xs text-rose-500 font-semibold">{regErrors.aadhaar}</p>}
                      </div>

                      {/* Address */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          சரியான முகவரி / Address <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={newMember.address}
                          onChange={handleRegChange('address')}
                          placeholder="முழு முகவரி..."
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition resize-none ${
                            regErrors.address ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                          }`}
                        />
                        {regErrors.address && <p className="mt-1 text-xs text-rose-500 font-semibold">{regErrors.address}</p>}
                      </div>

                      {/* Company Address */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          நிறுவனத்தின் முகவரி / Org Address (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={newMember.companyAddress}
                          onChange={handleRegChange('companyAddress')}
                          placeholder="வேலை செய்யும் இடம் / பட்டறை முகவரி..."
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Union & Nominee Details */}
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-2">
                      <span>🏛️</span> 3. சங்கம் & வாரிசு விவரங்கள் / Union & Nominee
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* District */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          மாவட்டம் / District <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={newMember.pledgeDistrict}
                          onChange={handleRegChange('pledgeDistrict')}
                          translate="no"
                          className={`w-full notranslate rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition ${
                            regErrors.pledgeDistrict ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                          }`}
                        >
                          <option value="" translate="no" className="notranslate">-- Select District --</option>
                          {DISTRICT_LIST.map(d => (
                            <option key={d.ta} value={d.ta} translate="no" className="notranslate">
                              {d.ta} / {d.en}
                            </option>
                          ))}
                        </select>
                        {regErrors.pledgeDistrict && <p className="mt-1 text-xs text-rose-500 font-semibold">{regErrors.pledgeDistrict}</p>}
                      </div>

                      {/* Branch */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          கிளை சங்கம் / Branch
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. தாம்பரம்"
                          value={newMember.pledgeBranch}
                          onChange={handleRegChange('pledgeBranch')}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition"
                        />
                      </div>

                      {/* Joined Date */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          இணைந்த தேதி / Joined Date
                        </label>
                        <input
                          type="text"
                          value={newMember.joinDate}
                          onChange={handleRegChange('joinDate')}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition"
                        />
                      </div>

                      {/* Referral */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          பரிந்துரை / Referral
                        </label>
                        <input
                          type="text"
                          placeholder="பரிந்துரைத்தவர் பெயர்..."
                          value={newMember.referral}
                          onChange={handleRegChange('referral')}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition"
                        />
                      </div>

                      {/* Nominee Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          வாரிசுதாரர் பெயர் / Nominee Name
                        </label>
                        <input
                          type="text"
                          placeholder="வாரிசு பெயர்..."
                          value={newMember.nomineeName}
                          onChange={handleRegChange('nomineeName')}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition"
                        />
                      </div>

                      {/* Nominee Mobile */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          வாரிசுதாரர் கைபேசி / Nominee Mobile
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="10 digit number"
                          inputMode="numeric"
                          value={newMember.nomineeMobile}
                          onChange={handleRegChange('nomineeMobile')}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Photo upload & Member ID Box */}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                      {/* Photo Upload Box */}
                      <div className="rounded-2xl p-5 border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                        <p className="text-xs font-bold text-slate-700 mb-3">
                          உறுப்பினர் புகைப்படம் / Photo Upload
                        </p>
                        <div className="flex flex-col items-center gap-2.5">
                          <label className="group relative block cursor-pointer w-24 h-28 rounded-xl overflow-hidden ring-2 ring-slate-200 hover:ring-[#FF6B00] transition shadow-sm">
                            {adminPhotoPreview ? (
                              <img
                                src={adminPhotoPreview}
                                alt="Member"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-white flex flex-col items-center justify-center gap-1.5 text-slate-400">
                                <span className="text-2xl">📷</span>
                                <span className="text-[11px] font-bold">Upload</span>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-[2]"
                              onChange={handleAdminPhoto}
                            />
                          </label>

                          {adminPhotoPreview && (
                            <button
                              type="button"
                              onClick={() => openCropper({ imageSrc: adminPhotoPreview, target: 'register', title: 'பதிவு புகைப்படம் பயிர் செய் / Crop Member Photo' })}
                              className="px-3 py-1.5 bg-[#FF6B00] hover:bg-[#e66000] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                            >
                              ✂️ படம் பயிர் செய் / Crop
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ID Preview Box */}
                      <div className="rounded-2xl p-6 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border border-blue-200/80 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl mb-1">🪪</span>
                        <p className="text-[11px] text-blue-900/70 uppercase tracking-wider font-bold">
                          உறுப்பினர் பதிவு எண் முன்னோட்டம் / Member ID Preview
                        </p>
                        <div className="font-mono text-base font-black text-[#003366] bg-white border border-blue-200 px-4 py-2 rounded-xl mt-2.5 tracking-wider shadow-xs">
                          TIWTN-2026-XXXXX
                        </div>
                        <p className="text-[10px] text-blue-600/70 mt-2 font-medium">
                          Auto-generated upon registration
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit button */}
                  <div className="pt-2">
                    <button
                      onClick={handleRegSubmit}
                      disabled={regSubmitting}
                      className="w-full rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E55A00] text-white py-3.5 font-black text-sm hover:opacity-95 shadow-lg shadow-amber-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {regSubmitting ? (
                        <>
                          <span className="animate-spin">↻</span>
                          <span>பதிவு செய்யப்படுகிறது / Registering...</span>
                        </>
                      ) : (
                        <>
                          <span>✅</span>
                          <span>உறுப்பினரை பதிவு செய்க / Register Member</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ALL USERS ── */}
          {activeTab === 'users' && (
            <div className="space-y-6 max-w-6xl">
              {/* Header Banner */}
              <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <span>👥</span> User Accounts · பயனர் கணக்குகள்
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    All Users
                    <span className="text-sm font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                      {users.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    வலைத்தளத்தில் கணக்கு உருவாக்கிய பயனர்கள் மற்றும் அவர்களின் நிர்வாக அனுமதிகள் (Roles).
                  </p>
                </div>
              </div>

              {/* Table Wrapper */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#002244] to-[#003366] text-white text-[11px] uppercase tracking-wider">
                        <th className="p-3.5 font-bold">#</th>
                        <th className="p-3.5 font-bold">User</th>
                        <th className="p-3.5 font-bold">Email</th>
                        <th className="p-3.5 font-bold">Role / அதிகாரம்</th>
                        <th className="p-3.5 font-bold">Registration Status</th>
                        <th className="p-3.5 font-bold text-center">Change Role</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100">
                      {loadingData
                        ? <tr><td colSpan="6" className="p-12 text-center text-slate-400">Loading user accounts…</td></tr>
                        : users.map((u, idx) => (
                          <tr key={u.id} className="hover:bg-slate-50/80 transition group">
                            <td className="p-3.5 text-xs text-slate-400 font-mono">{idx + 1}</td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                                  {u.name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="font-bold text-slate-900 group-hover:text-[#FF6B00] transition-colors truncate max-w-[150px]">
                                  {u.name || 'Unnamed User'}
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 text-xs font-mono text-slate-600 max-w-[180px] truncate">{u.email}</td>
                            <td className="p-3.5">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {u.role === 'admin' ? '👑 Admin' : '👤 Member'}
                              </span>
                            </td>
                            <td className="p-3.5">
                              {u.has_registered ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ✅ Registered
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  ⏳ Unregistered
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              <select
                                value={u.role}
                                onChange={e => changeUserRole(u.id, e.target.value)}
                                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 bg-white shadow-xs"
                              >
                                <option value="member">member</option>
                                <option value="admin">admin</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      }
                      {!loadingData && users.length === 0 && (
                        <tr><td colSpan="6" className="p-12 text-center text-slate-400">No users found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── BY DISTRICT ── */}
          {activeTab === 'district' && (
            <div className="space-y-6 max-w-6xl">
              {/* Header Banner */}
              <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <span>🗺️</span> Regional Analytics · மாவட்ட வாரியாக
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Members by District
                    <span className="text-sm font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                      {districtsCount.filter(d => d.count > 0).length} / {districtsCount.length} Active
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    தமிழ்நாட்டின் அனைத்து மாவட்டங்களிலும் உள்ள உறுப்பினர்களின் புள்ளிவிவரங்கள்
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition">
                    <span>📥</span> Export CSV
                  </button>
                </div>
              </div>

              {/* Status filter tabs */}
              <div className="flex items-center gap-2 flex-wrap bg-white p-2 md:p-2.5 rounded-2xl border border-slate-200/80 shadow-sm">
                {[
                  { id: 'all', label: 'All Members', count: members.length, color: '#003366' },
                  { id: 'approved', label: 'Approved', count: approvedCount, color: '#10B981' },
                  { id: 'pending', label: 'Pending', count: pendingCount, color: '#F59E0B' },
                  { id: 'rejected', label: 'Rejected', count: rejectedCount, color: '#EF4444' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDistrictTabStatusFilter(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      districtTabStatusFilter === tab.id
                        ? 'bg-[#003366] text-white shadow-sm'
                        : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      districtTabStatusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-white text-slate-800 shadow-xs'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Districts Bento Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
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
                      className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between group ${
                        hasCount
                          ? districtTabStatusFilter === 'rejected'
                            ? 'bg-white border-rose-200/90 shadow-xs hover:shadow-md hover:border-rose-400 admin-card-hover'
                            : 'bg-white border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-400 admin-card-hover'
                          : 'bg-slate-50/60 border-slate-200/50 opacity-40 cursor-not-allowed'
                      }`}>
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <span className={`font-bold text-xs md:text-sm leading-tight truncate ${
                            hasCount ? 'text-slate-900 group-hover:text-[#FF6B00]' : 'text-slate-400'
                          }`}>
                            {d.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {districtTabStatusFilter === 'rejected' ? 'Rejected' :
                           districtTabStatusFilter === 'pending' ? 'Pending' :
                           districtTabStatusFilter === 'approved' ? 'Approved' : 'Enrolled'}
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className={`text-base md:text-lg font-black ${
                          hasCount
                            ? districtTabStatusFilter === 'rejected'
                              ? 'text-rose-600'
                              : 'text-[#003366]'
                            : 'text-slate-400'
                        }`}>
                          {displayCount.toLocaleString('en-IN')}
                        </span>

                        {/* Badges for pending/rejected in All view */}
                        {districtTabStatusFilter === 'all' && (d.pending > 0 || d.rejected > 0) ? (
                          <div className="flex items-center gap-1 text-[9px] font-bold">
                            {d.pending > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                ⏳ {d.pending}
                              </span>
                            )}
                            {d.rejected > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                                ❌ {d.rejected}
                              </span>
                            )}
                          </div>
                        ) : hasCount ? (
                          <span className="text-[11px] font-bold text-slate-400 group-hover:text-[#FF6B00] transition-colors">
                            View →
                          </span>
                        ) : null}
                      </div>
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
              <div className="space-y-6 max-w-6xl">
                {/* Header Banner */}
                <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                      <span>🖼️</span> Media Assets · புகைப்படத் தொகுப்பு
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      Gallery Management
                      <span className="text-sm font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                        {adminAlbums.length} Albums · {galleryItems.length} Photos
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      நிகழ்ச்சிகள் மற்றும் பயிற்சி பட்டறைகளின் புகைப்பட ஆல்பங்களை நிர்வகிக்கவும்.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowGalleryForm(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#003366] to-[#002244] shadow-md shadow-blue-900/20 hover:opacity-95 transition"
                  >
                    <span>➕</span> Add Photos
                  </button>
                </div>

                {adminAlbums.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center border border-slate-200/80 shadow-sm">
                    <div className="text-4xl text-slate-300">📷</div>
                    <div className="text-base font-extrabold text-slate-800 mt-3">புகைப்படங்கள் இல்லை / No albums yet</div>
                    <p className="text-xs text-slate-400 mt-1">Click &quot;Add Photos&quot; to upload your first event gallery album.</p>
                  </div>
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

        </main>
      </div>

      {/* ── VIEW MODAL ── */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col md:flex-row overflow-hidden max-h-[92vh]">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 z-20 text-xs font-bold transition"
            >
              ✕
            </button>

            {/* Left Column: Member Information */}
            <div className="p-6 md:p-8 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-[#003366] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                  {selectedMember.member_id}
                </span>
                {statusBadge(selectedMember.status || 'approved')}
              </div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-5">
                {selectedMember.full_name}
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 p-4 rounded-2xl border border-slate-100 mb-6">
                {[
                  ['பதவி / Posting', selectedMember.posting],
                  ['கைபேசி / Mobile', selectedMember.mobile],
                  ['பிறந்த தேதி / DOB', selectedMember.dob],
                  ['இரத்த பிரிவு / Blood', selectedMember.blood_group],
                  ['மாவட்டம் / District', selectedMember.district],
                  ['ஆதார் / Aadhar', displayAadhar(selectedMember.aadhar)],
                  ['கிளை / Branch', selectedMember.branch],
                  ['வாரிசுதாரர் / Nominee', selectedMember.nominee_name],
                  ['வாரிசு கைபேசி / Nominee Phone', selectedMember.nominee_phone],
                  ['இணைந்த தேதி / Joined', selectedMember.join_date],
                  ['பரிந்துரை / Referrer', selectedMember.referrer],
                ].map(([label, val]) => (
                  <div key={label} className="min-w-0">
                    <p className="text-slate-400 text-[10px] uppercase font-bold mb-0.5 truncate">{label}</p>
                    <p className="font-bold text-slate-900 text-xs truncate">{val || '-'}</p>
                  </div>
                ))}
                <div className="col-span-2 pt-2 border-t border-slate-200/60">
                  <p className="text-slate-400 text-[10px] uppercase font-bold mb-0.5">முகவரி / Address</p>
                  <p className="font-semibold text-slate-800 text-xs">{selectedMember.address || '-'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => openCropper({ member: selectedMember, imageSrc: getPhotoSrc(selectedMember), target: 'direct', title: 'உறுப்பினர் புகைப்படம் பயிர் செய் / Crop ID Photo' })}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E55A00] text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:opacity-95 transition flex items-center justify-center gap-1.5"
                >
                  ✂️ Crop Photo
                </button>
                <button
                  onClick={() => { handleEditMemberClick(selectedMember); setSelectedMember(null); }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#003366] text-white font-bold text-xs shadow-md shadow-blue-900/20 hover:opacity-95 transition flex items-center justify-center gap-1.5"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handlePrintMember(selectedMember)}
                  className="py-2.5 px-3.5 rounded-xl border border-slate-200 text-slate-700 bg-slate-100 hover:bg-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  🖨️ Print
                </button>
                <button
                  onClick={() => deleteMember(selectedMember.member_id, selectedMember.user_id)}
                  className="py-2.5 px-3.5 rounded-xl border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Right Column: ID Card Preview */}
            <div className="p-6 md:p-8 bg-slate-50 flex items-center justify-center overflow-x-auto md:min-w-[340px] border-t md:border-t-0 md:border-l border-slate-100">
              <div className="transform scale-80 md:scale-95 origin-center shadow-lg rounded-2xl">
                <IDCard member={toIdCardShape(selectedMember)} showReset={false} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-5 md:p-7 overflow-y-auto max-h-[92vh]">
            <button
              onClick={() => setEditMember(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 z-10 text-xs font-bold transition"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-[#003366] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                {editMember.member_id}
              </span>
              {statusBadge(editMember.status || 'pending')}
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4">Edit Member Details</h3>

            {/* Edit Photo Input Section */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4 flex items-center gap-4">
              {/* Preview */}
              <div className="flex-shrink-0 relative">
                {editPhotoPreview ? (
                  <div
                    className="relative group cursor-pointer"
                    title="படம் பயிர் செய்ய கிளிக் செய்யவும் / Click to Crop Photo"
                    onClick={() => openCropper({ imageSrc: editPhotoPreview, member: editMember, target: 'edit', title: 'புகைப்படம் பயிர் செய் / Crop Photo' })}
                  >
                    <img
                      src={editPhotoPreview}
                      className="w-18 h-22 object-cover rounded-xl ring-2 ring-amber-400 shadow-sm"
                      style={{ width: '72px', height: '88px' }}
                    />
                    <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition">
                      <span>✂️</span>
                      <span>Crop</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-18 h-22 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FFB347] text-white flex items-center justify-center font-black text-xl shadow-sm" style={{ width: '72px', height: '88px' }}>
                    {editMember?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-800 mb-0.5">
                  படம் மாற்று / Change Photo
                </div>
                <div className="text-[11px] text-slate-400 mb-2.5">
                  JPG, PNG · Auto-compressed to Cloud
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#003366] text-white text-xs font-bold cursor-pointer hover:bg-[#002244] transition shadow-xs">
                    📷 தேர்வு / Choose
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditPhotoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {editPhotoPreview && (
                    <button
                      type="button"
                      onClick={() => openCropper({ imageSrc: editPhotoPreview, member: editMember, target: 'edit', title: 'புகைப்படம் பயிர் செய் / Crop Photo' })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FF6B00] text-white text-xs font-bold hover:bg-[#e66000] transition shadow-xs"
                    >
                      ✂️ பயிர் / Crop
                    </button>
                  )}

                  {editPhotoFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditPhotoPreview(
                          editMember._original_photo_url ||
                          editMember._original_photo_base64 ||
                          null
                        );
                        setEditPhotoFile(null);
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-rose-300 text-rose-600 text-xs font-bold hover:bg-rose-50 transition"
                    >
                      ↩ Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Rejection reason banner if rejected */}
            {editMember.rejection_reason && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1">
                  <span>❌</span> நிராகரிப்பு காரணம் / Rejection Reason:
                </div>
                <div className="text-xs text-rose-950 font-medium bg-white/70 p-2.5 rounded-xl border border-rose-100">
                  {editMember.rejection_reason}
                </div>
                <div className="text-[11px] text-rose-600 mt-1.5 font-medium">
                  💡 விவரங்களை திருத்தி / புதிய புகைப்படத்தை பதிவேற்றி கீழே உள்ள <b>&quot;சேமித்து அனுமதி&quot;</b> பட்டனை அழுத்தவும்.
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
                <div key={field.key}>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {field.label}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      rows={2}
                      value={editMember[field.key] || ''}
                      onChange={e => setEditMember(prev => ({
                        ...prev, [field.key]: e.target.value
                      }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition resize-none"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={editMember[field.key] || ''}
                      onChange={e => setEditMember(prev => ({
                        ...prev, [field.key]: e.target.value
                      }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition"
                    />
                  )}
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  மாவட்டம் / District
                </label>
                <select 
                  value={editMember.district || ''} 
                  onChange={e => setEditMember(prev => ({ ...prev, district: e.target.value }))}
                  translate="no"
                  className="w-full notranslate rounded-xl border border-slate-200 px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 text-sm"
                >
                  <option value="" translate="no" className="notranslate">-- Select District --</option>
                  {DISTRICT_LIST.map(d => (
                    <option key={d.ta} value={d.ta} translate="no" className="notranslate">
                      {d.ta} / {d.en}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Member ID Sync Tool */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#003366]">
                    உறுப்பினர் எண் / Member ID
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#003366]">
                    Current ID
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editMember.member_id || ''}
                    onChange={e => setEditMember(prev => ({ ...prev, member_id: e.target.value }))}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 font-mono text-xs font-bold bg-white focus:outline-none focus:border-[#003366]"
                    placeholder="e.g. TIWTN-2026-CHN-001"
                  />
                  <button
                    type="button"
                    disabled={regeneratingId || !editMember.district}
                    onClick={() => handleRegenerateDistrictId(editMember.district)}
                    className="px-3 py-2 text-xs font-bold rounded-xl bg-[#003366] text-white hover:bg-[#002244] transition flex items-center gap-1 shadow-xs whitespace-nowrap disabled:opacity-50"
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
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2.5 px-3 font-bold hover:opacity-95 transition text-xs md:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {savingEdit ? '⏳ சேமிக்கிறது...' : '✅ சேமித்து அனுமதி / Save & Approve'}
                </button>
              )}
              <button
                type="button"
                disabled={savingEdit}
                onClick={() => saveEditMember(false)}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E55A00] text-white py-2.5 px-3 font-bold hover:opacity-95 transition text-xs md:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                {savingEdit ? '⏳ சேமிக்கிறது...' : '💾 மாற்றங்களை சேமி / Save Changes'}
              </button>
              <button
                type="button"
                disabled={savingEdit}
                onClick={() => setEditMember(null)}
                className="rounded-xl border border-slate-200 py-2.5 px-4 text-slate-600 hover:bg-slate-100 transition text-xs md:text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GALLERY ADD FORM MODAL ── */}
      {showGalleryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-5 md:p-7 overflow-y-auto max-h-[92vh]">
            <button
              onClick={closeGalleryForm}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 z-10 text-xs font-bold transition"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-slate-900 mb-4">Add Gallery Photos</h3>
            
            <form onSubmit={handleGallerySubmit} className="space-y-4 text-sm">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 uppercase">
                  Title / தலைப்பு <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newGalleryItem.title}
                  onChange={e => setNewGalleryItem(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 text-sm"
                  placeholder="e.g. Coimbatore Workshop 2026"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 uppercase">
                  Category / வகை
                </label>
                <select
                  value={newGalleryItem.category}
                  onChange={e => setNewGalleryItem(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 font-semibold focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 text-sm"
                >
                  <option value="EVENTS">Events / நிகழ்ச்சிகள்</option>
                  <option value="WORKSHOPS">Workshops / பயிற்சி வகுப்புகள்</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 uppercase">
                  Description / விளக்கம் (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newGalleryItem.description || ''}
                  onChange={e => setNewGalleryItem(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 text-sm resize-none"
                  placeholder="Brief description of the event..."
                />
              </div>

              {/* IMAGE UPLOAD UI SECTION */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600 uppercase">
                  படங்கள் பதிவேற்று / Upload Images
                </label>

                {/* Upload box */}
                <div
                  className="border-2 border-dashed border-slate-200 hover:border-[#FF6B00] rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition relative cursor-pointer"
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryImageUpload}
                    disabled={uploadingImage}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />

                  {uploadingImage ? (
                    <div>
                      <div className="text-3xl mb-2">⏳</div>
                      <div className="text-xs font-bold text-slate-700">
                        பதிவேற்றுகிறது... / Uploading to Cloud...
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                        <div className="w-2/3 h-full bg-gradient-to-r from-[#FF6B00] to-[#FFB347] animate-pulse" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-2">📷</div>
                      <div className="text-sm font-bold text-slate-800 mb-0.5">
                        படங்களை இங்கே இழுக்கவும் அல்லது கிளிக் செய்யவும்
                      </div>
                      <div className="text-xs text-slate-400">
                        PNG, JPG, WEBP · Auto-compressed to Cloudinary CDN
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview Grid for Uploaded Images */}
                {uploadedImageUrls.length > 0 && (
                  <div className="mt-3.5">
                    <p className="mb-2 text-xs font-bold text-slate-500 uppercase">
                      பதிவேற்றப்பட்ட படங்கள் ({uploadedImageUrls.length}) / Uploaded Images
                    </p>
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50">
                      {uploadedImageUrls.map((url, index) => (
                        <div key={index} className="relative group aspect-video rounded-lg border border-slate-200 overflow-hidden bg-white shadow-xs">
                          <img
                            src={url}
                            alt={`Preview ${index}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeUploadedPreviewImage(url)}
                            className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] transition-colors"
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

              <div className="mt-5 flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={uploadingImage || uploadedImageUrls.length === 0}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E55A00] text-white py-3 font-black text-sm hover:opacity-95 shadow-md shadow-amber-500/20 transition disabled:opacity-50"
                >
                  Save Album
                </button>
                <button
                  type="button"
                  onClick={closeGalleryForm}
                  className="rounded-xl border border-slate-200 py-3 px-5 text-slate-600 hover:bg-slate-100 transition text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PHOTO CROPPER MODAL ── */}
      {cropperState.isOpen && (
        <ImageCropperModal
          imageSrc={cropperState.imageSrc}
          member={cropperState.member}
          title={cropperState.title}
          onCropComplete={handleCropperComplete}
          onDirectSave={cropperState.target === 'direct' ? handleDirectCropSave : null}
          onClose={closeCropper}
          saving={savingDirectCrop}
        />
      )}

    </div>
  );
}

export default AdminDashboard;
