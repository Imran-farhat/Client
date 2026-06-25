import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/client';
import IDCard from '../components/IDCard';
import { generateMemberId } from '../utils/memberIdUtils';
import { printMemberForm } from '../utils/printMemberForm';
import PageLoader from '../components/PageLoader';

const TAMIL_NADU_DISTRICTS = [
  "அரியலூர்",
  "ஈரோடு",
  "காஞ்சிபுரம்",
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
  const str = String(aadhar)
  return 'XXXX XXXX ' + str.slice(-4)
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
  joinDate: formatDateDisplay(),
};

const NAV = [
  { id: 'overview', icon: '📊', label: 'Overview' },
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
    const { data } = await supabase
      .from('members')
      .select('id, member_id, user_id, full_name, posting, dob, blood_group, mobile, aadhar, district, address, nominee_name, nominee_phone, branch, join_date, registered_at, referrer')
      .order('registered_at', { ascending: false });
    if (data) setMembers(data);
  };
  const loadUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  };
  const loadGallery = async () => {
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    if (data) setGalleryItems(data);
  };

  const fetchSingleMemberPhoto = async (memberId) => {
    const { data } = await supabase
      .from('members')
      .select('photo_base64')
      .eq('member_id', memberId)
      .maybeSingle();
    return data?.photo_base64 || null;
  };

  const handleViewMember = async (member) => {
    setSelectedMember(member);
    if (!member.photo_base64) {
      const photo = await fetchSingleMemberPhoto(member.member_id);
      if (photo) {
        setSelectedMember(prev => prev && prev.member_id === member.member_id ? { ...prev, photo_base64: photo } : prev);
        setMembers(prev => prev.map(m => m.member_id === member.member_id ? { ...m, photo_base64: photo } : m));
      }
    }
  };

  const handleEditMemberClick = async (member) => {
    setEditMember({ ...member });
    if (!member.photo_base64) {
      const photo = await fetchSingleMemberPhoto(member.member_id);
      if (photo) {
        setEditMember(prev => prev && prev.member_id === member.member_id ? { ...prev, photo_base64: photo } : prev);
        setMembers(prev => prev.map(m => m.member_id === member.member_id ? { ...m, photo_base64: photo } : m));
      }
    }
  };

  const handlePrintMember = async (member) => {
    if (!member.photo_base64) {
      const photo = await fetchSingleMemberPhoto(member.member_id);
      if (photo) {
        printMemberForm({ ...member, photo_base64: photo });
        return;
      }
    }
    printMemberForm(member);
  };

  useEffect(() => {
    Promise.all([loadMembers(), loadUsers(), loadGallery()]).finally(() => setLoadingData(false));
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
      full_name: editMember.full_name,
      posting: editMember.posting,
      mobile: editMember.mobile,
      district: editMember.district,
      address: editMember.address,
      blood_group: editMember.blood_group,
      dob: editMember.dob,
      aadhar: editMember.aadhar,
      branch: editMember.branch,
      nominee_name: editMember.nominee_name,
    }).eq('member_id', editMember.member_id);
    setEditMember(null);
    await loadMembers();
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
  const toIdCardShape = (m) => m ? ({ memberId: m.member_id, fullName: m.full_name, posting: m.posting, dob: m.dob, bloodGroup: m.blood_group, mobile: m.mobile, district: m.district, address: m.address, nomineeName: m.nominee_name, joinDate: m.join_date, pledgeDistrict: m.district, pledgeBranch: m.branch, photoPreview: m.photo_base64 }) : null;

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
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = async () => {
      const compressed = await compressMemberPhoto(reader.result);
      setAdminPhotoPreview(compressed)
      setNewMember(prev => ({
        ...prev,
        photoPreview: compressed
      }))
    }
    reader.readAsDataURL(file)
  }

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
    const record = {
      member_id: memberId, user_id: null, full_name: newMember.fullName,
      posting: newMember.posting,
      dob: newMember.dob,
      blood_group: newMember.bloodGroup, mobile: newMember.mobile, aadhar: newMember.aadhaar,
      address: newMember.address, org_address: newMember.companyAddress || '', district: newMember.pledgeDistrict,
      branch: newMember.pledgeBranch || '', nominee_name: newMember.nomineeName || '',
      nominee_phone: newMember.nomineeMobile || '', join_date: joiningDate,
      referrer: newMember.referral || '', photo_base64: newMember.photoPreview || null,
      registered_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('members').insert(record).select().single();
    setRegSubmitting(false);
    if (error) { alert('Error: ' + error.message); return; }
    
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
    <div className="min-h-screen bg-[#F4F7FA] admin-dashboard">

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
                className={`w-full text-left px-4 py-3 rounded text-sm transition flex items-center ${
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
                        <th className="p-3 font-semibold">Aadhaar</th>
                        <th className="p-3 font-semibold">District</th>
                        <th className="p-3 font-semibold">Mobile</th>
                        <th className="p-3 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {loadingData
                        ? <tr><td colSpan="8" className="p-8 text-center text-gray-400">Loading...</td></tr>
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
                            <td className="p-3 font-mono text-xs">{m.aadhar ? 'XXXX XXXX ' + String(m.aadhar).slice(-4) : '-'}</td>
                            <td className="p-3 text-gray-600 text-xs">{m.district}</td>
                            <td className="p-3 text-gray-600 text-xs">{m.mobile}</td>
                            <td className="p-3 text-center">
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => handleViewMember(m)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition text-sm" title="View">👁️</button>
                                <button onClick={() => handleEditMemberClick(m)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition text-sm" title="Edit">✏️</button>
                                <button onClick={() => handlePrintMember(m)} style={{ background: 'transparent', border: '1px solid #003366', color: '#003366', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px' }} title="Print Form">🖨️</button>
                                <button onClick={() => deleteMember(m.member_id, m.user_id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition text-sm" title="Delete">🗑️</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                      {!loadingData && paginatedMembers.length === 0 && <tr><td colSpan="8" className="p-8 text-center text-gray-500">No members found.</td></tr>}
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
            <div className="space-y-3 text-sm">
              {[
                { key: 'full_name', label: 'பெயர் / Name', type: 'text' },
                { key: 'posting',   label: 'பதவி / Posting', type: 'text' },
                { key: 'dob',       label: 'பிறந்த தேதி / DOB', type: 'date' },
                { key: 'blood_group', label: 'இரத்த பிரிவு / Blood Group', type: 'text' },
                { key: 'mobile',    label: 'கைபேசி / Mobile', type: 'tel' },
                { key: 'aadhar',    label: 'ஆதார் / Aadhaar', type: 'text' },
                { key: 'address',   label: 'முகவரி / Address', type: 'text' },
                { key: 'branch',    label: 'கிளை / Branch', type: 'text' },
                { key: 'nominee_name', label: 'வாரிசுதாரர் / Nominee', type: 'text' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '12px', fontWeight: '600',
                    color: 'var(--text-muted)',
                    display: 'block', marginBottom: '4px'
                  }}>{field.label}</label>
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
