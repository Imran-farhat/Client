import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import IDCard from '../components/IDCard';
import OrgLogo from '../components/OrgLogo';
import { supabase } from '../supabase/client';
import { useAuth } from '../context/AuthContext';
import { generateMemberId } from '../utils/memberIdUtils';

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

const initialForm = {
  fullName: '',
  posting: '',
  address: '',
  companyAddress: '',
  bloodGroup: '',
  dob: '',
  aadhaar: '',
  mobile: '',
  nomineeName: '',
  nomineeMobile: '',
  referral: '',
  pledgeName: '',
  pledgeDistrict: '',
  pledgeBranch: '',
  profilePhoto: null,
  photoPreview: null,
  photoFile: null,
  photo_url: null,
  photo_base64: null,
};

const BiLabel = ({ tamil, english, required }) => (
  <label>
    <span style={{
      fontSize: '13px', fontWeight: '700',
      color: 'var(--text-primary)'
    }}>{tamil}</span>
    <span style={{
      fontSize: '11px', fontWeight: '400',
      color: 'var(--text-muted)', marginLeft: '5px'
    }}>/ {english}</span>
    {required && (
      <span style={{ color: '#FF6B00', marginLeft: '2px' }}>
        *
      </span>
    )}
  </label>
);

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateDisplay() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function Register() {
  const { currentUser, userProfile, refreshProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExplicitEdit = searchParams.get('mode') === 'edit';

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [member, setMember] = useState(null);
  const [memberId, setMemberId] = useState('TIWTN-2026-_____');
  const [existingMember, setExistingMember] = useState(null);
  const [cardReady, setCardReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const cardRef = useRef(null);
  const formRef = useRef(null);
  const joiningDate = useMemo(() => formatDateDisplay(), []);

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login', {
        state: {
          message: 'பதிவு செய்ய முதலில் உள்நுழையவும் / Please login to register',
          redirectTo: '/register'
        }
      });
    }
  }, [currentUser, loading, navigate]);

  // Load existing member record if available (for editing/correcting after rejection or pending)
  useEffect(() => {
    const loadExistingRecord = async () => {
      if (!currentUser) {
        setLoadingExisting(false);
        return;
      }

      try {
        let { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (!data && userProfile?.mobile) {
          const { data: data2 } = await supabase
            .from('members')
            .select('*')
            .eq('mobile', userProfile.mobile)
            .maybeSingle();
          data = data2;
        }

        if (data) {
          // If already approved and user didn't ask to explicitly edit, redirect to profile
          if (data.status === 'approved' && !isExplicitEdit) {
            navigate('/profile');
            return;
          }

          // Otherwise, user is either rejected, pending, or in edit mode
          setExistingMember(data);
          setMemberId(data.member_id);
          setForm({
            fullName: data.full_name || '',
            posting: data.posting || '',
            address: data.address || '',
            companyAddress: data.org_address || '',
            bloodGroup: data.blood_group || '',
            dob: data.dob || '',
            aadhaar: data.aadhar || '',
            mobile: data.mobile || '',
            nomineeName: data.nominee_name || '',
            nomineeMobile: data.nominee_phone || '',
            referral: data.referrer || '',
            pledgeName: data.full_name || '',
            pledgeDistrict: data.district || '',
            pledgeBranch: data.branch || '',
            profilePhoto: null,
            photoPreview: data.photo_url || data.photo_base64 || null,
            photoFile: null,
            photo_url: data.photo_url || null,
            photo_base64: data.photo_base64 || null,
          });
        }
      } catch (err) {
        console.error('Error fetching existing member record:', err);
      } finally {
        setLoadingExisting(false);
      }
    };

    if (!loading && currentUser) {
      loadExistingRecord();
    }
  }, [currentUser, userProfile, loading, isExplicitEdit, navigate]);

  const maskAadhar = (aadhar) => {
    return aadhar;
  };

  const saveToSupabase = async (formData, effectiveMemberId, photoUrl = null, isUpdate = false) => {
    try {
      console.log('Saving to Supabase...', effectiveMemberId, isUpdate ? '(UPDATE)' : '(INSERT)');
      console.log('Current user:', currentUser?.id);

      const memberRecord = {
        member_id: effectiveMemberId,
        user_id: currentUser?.id || null,
        full_name: formData.fullName,
        posting: formData.posting,
        dob: formData.dob,
        blood_group: formData.bloodGroup,
        mobile: formData.mobile,
        aadhar: maskAadhar(formData.aadhaar),
        address: formData.address,
        org_address: formData.companyAddress || '',
        district: formData.pledgeDistrict,
        branch: formData.pledgeBranch || '',
        nominee_name: formData.nomineeName || '',
        nominee_phone: formData.nomineeMobile || '',
        join_date: joiningDate,
        referrer: formData.referral || '',
        photo_url: photoUrl || formData.photo_url || null,
        photo_base64: photoUrl ? null : (formData.photoPreview || formData.photo_base64 || null),
        status: 'pending', // Re-submission goes to pending review
        rejection_reason: null, // Clear any previous rejection reason
        registered_at: new Date().toISOString()
      };

      console.log('Member record:', memberRecord);

      let saveError = null;
      let finalMemberId = effectiveMemberId;

      if (isUpdate) {
        // Update existing member record using SAME original member_id
        const { error: updateErr } = await supabase
          .from('members')
          .update(memberRecord)
          .eq('member_id', effectiveMemberId);
        saveError = updateErr;
      } else {
        // Insert new member record with auto-retry if member_id collides
        let currentId = effectiveMemberId;
        let insertSuccess = false;
        let retryCount = 0;

        while (!insertSuccess && retryCount < 10) {
          memberRecord.member_id = currentId;
          const { error: insertErr } = await supabase
            .from('members')
            .insert(memberRecord);

          if (!insertErr) {
            insertSuccess = true;
            finalMemberId = currentId;
            saveError = null;
          } else if (insertErr.message?.includes('members_member_id_key') || insertErr.message?.includes('duplicate key') || insertErr.code === '23505') {
            console.warn(`member_id ${currentId} collided, retrying with next sequence...`);
            retryCount++;
            currentId = await generateMemberId(formData.pledgeDistrict, retryCount);
          } else {
            saveError = insertErr;
            break;
          }
        }
      }

      if (saveError) {
        console.error('Supabase save error:', saveError);
        alert('பதிவு சேமிக்கப்படவில்லை: ' + saveError.message);
        return { success: false, memberId: finalMemberId };
      }

      console.log('Saved successfully with ID:', finalMemberId);

      // Update user profile if logged in
      if (currentUser?.id) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            has_registered: true,
            member_id: finalMemberId,
            name: formData.fullName,
            mobile: formData.mobile
          })
          .eq('id', currentUser.id);

        if (updateError) {
          console.warn('User update warning:', updateError.message);
        }
        await refreshProfile();
      }

      // Clean up legacy localStorage entries
      localStorage.removeItem('tiwtn_registered');
      localStorage.removeItem('tiwtn_member_data');

      return { success: true, memberId: finalMemberId };
    } catch (err) {
      console.error('Save error:', err);
      alert('பிழை: ' + err.message);
      return false;
    }
  };

  const sendAdminNotification = async (formData, effectiveMemberId, isUpdate = false) => {
    try {
      const payload = new FormData();
      payload.append(
        'access_key',
        import.meta.env.VITE_WEB3FORMS_KEY
      );
      payload.append(
        'subject',
        isUpdate
          ? `விண்ணப்பம் திருத்தப்பட்டு சமர்ப்பிக்கப்பட்டது / Application Corrected: ${formData.fullName} | ${effectiveMemberId}`
          : `புதிய உறுப்பினர் பதிவு: ${formData.fullName} | ${effectiveMemberId}`
      );
      payload.append('from_name', 'TIWTN Registration System');
      payload.append('email', 'idhreesufiyaidhreesufiya@gmail.com');
      payload.append('message', `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${isUpdate ? 'உறுப்பினர் விண்ணப்பம் திருத்தப்பட்டு மீண்டும் சமர்ப்பிக்கப்பட்டது' : 'புதிய உறுப்பினர் பதிவு விவரங்கள்'}
${isUpdate ? 'MEMBER APPLICATION CORRECTED & RE-SUBMITTED' : 'NEW MEMBER REGISTRATION DETAILS'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

உறுப்பினர் எண் / Member ID : ${effectiveMemberId}
பெயர் / Full Name          : ${formData.fullName}
பதவி / Posting            : ${formData.posting}
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

  const handlePhotoUpload = (e) => {
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

    // Show local preview immediately (UX)
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({
        ...prev,
        photoPreview: reader.result,  // for display
        profilePhoto: file,           // for validation
        photoFile: file               // actual file for upload
      }));
    };
    reader.readAsDataURL(file);
  };

  const uploadPhotoToStorage = async (file, currentMemberId) => {
    if (!file) return null;
    try {
      // Compress to JPEG (max 800px, 75% quality) before uploading
      const compressed = await compressImageFile(file);
      const path = `members/${currentMemberId}`; // no extension!
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
      // Append cache-buster so browser fetches the fresh image (upsert keeps same URL)
      return `${urlData.publicUrl}?t=${Date.now()}`;
    } catch (err) {
      console.error('Storage upload failed:', err);
      return null;
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'இந்த தகவல் அவசியம்';
    if (!form.posting?.trim()) nextErrors.posting = 'பதவி அவசியம் / Posting required';
    if (!form.address.trim()) nextErrors.address = 'இந்த தகவல் அவசியம்';
    if (!form.companyAddress.trim()) nextErrors.companyAddress = 'இந்த தகவல் அவசியம்';
    if (!form.bloodGroup) nextErrors.bloodGroup = 'இந்த தகவல் அவசியம்';
    if (!form.dob) nextErrors.dob = 'இந்த தகவல் அவசியம்';
    if (!form.aadhaar.match(/^\d{12}$/)) nextErrors.aadhaar = 'சரியான ஆதார் எண் உள்ளிடுக';
    if (!form.mobile.match(/^\d{10}$/)) nextErrors.mobile = 'சரியான செல் நம்பர் உள்ளிடுக';
    if (!form.nomineeName.trim()) nextErrors.nomineeName = 'இந்த தகவல் அவசியம்';
    if (form.nomineeMobile && !form.nomineeMobile.match(/^\d{10}$/)) nextErrors.nomineeMobile = 'சரியான செல் நம்பர் உள்ளிடுக';
    if (!form.pledgeName.trim()) nextErrors.pledgeName = 'இந்த தகவல் அவசியம்';
    if (!form.pledgeDistrict || form.pledgeDistrict === '') nextErrors.pledgeDistrict = 'மாவட்டம் தேர்வு செய்க';
    if (!form.pledgeBranch.trim()) nextErrors.pledgeBranch = 'இந்த தகவல் அவசியம்';
    
    // Photo validation: allow existing photo or new upload
    if (!form.profilePhoto && !form.photoPreview && !form.photo_url) {
      nextErrors.profilePhoto = 'படத்தை பதிவேற்றவும்';
    } else if (form.profilePhoto) {
      if (!form.profilePhoto.type?.startsWith('image/')) {
        nextErrors.profilePhoto = 'படத்தை பதிவேற்றவும் (Image only)';
      } else if (form.profilePhoto.size > 2_000_000) {
        nextErrors.profilePhoto = 'படத்தை 2MB limit';
      }
    }
    return nextErrors;
  };

  const checkDuplicate = async (mobile, aadhar, currentMemberId = null) => {
    // Check mobile: exclude own member record and own user account
    let mobileQuery = supabase
      .from('members')
      .select('member_id, user_id')
      .eq('mobile', mobile);

    if (currentMemberId) {
      mobileQuery = mobileQuery.neq('member_id', currentMemberId);
    }
    if (currentUser?.id) {
      mobileQuery = mobileQuery.neq('user_id', currentUser.id);
    }

    const { data: mobileCheck } = await mobileQuery.maybeSingle();

    if (mobileCheck) {
      throw new Error(
        'இந்த கைபேசி எண் ஏற்கனவே வேறொரு பதிவில் உள்ளது / ' +
        'This mobile number is already registered with another member. ' +
        'Member ID: ' + mobileCheck.member_id
      );
    }

    // Check Aadhaar: exclude own member record and own user account
    let aadharQuery = supabase
      .from('members')
      .select('member_id, user_id')
      .eq('aadhar', aadhar);

    if (currentMemberId) {
      aadharQuery = aadharQuery.neq('member_id', currentMemberId);
    }
    if (currentUser?.id) {
      aadharQuery = aadharQuery.neq('user_id', currentUser.id);
    }

    const { data: aadharCheck } = await aadharQuery.maybeSingle();

    if (aadharCheck) {
      throw new Error(
        'இந்த ஆதார் எண் ஏற்கனவே வேறொரு பதிவில் உள்ளது / ' +
        'This Aadhaar is already registered with another member.'
      );
    }
  };

  const handleSubmit = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const nextErrors = validate();
      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors);
        return;
      }

      const isUpdate = !!existingMember;
      const targetMemberId = existingMember ? existingMember.member_id : await generateMemberId(form.pledgeDistrict);

      // Check duplicates excluding own record
      await checkDuplicate(form.mobile, form.aadhaar, existingMember?.member_id);

      // Upload photo to Storage if a new file was chosen
      let photoUrl = form.photo_url || null;
      if (form.photoFile) {
        const uploaded = await uploadPhotoToStorage(form.photoFile, targetMemberId);
        if (uploaded) photoUrl = uploaded;
      }

      const memberData = {
        ...form,
        joiningDate,
        memberId: targetMemberId,
        photo_url: photoUrl,
        photo_base64: photoUrl ? null : (form.photoPreview || null)
      };

      // Save to Supabase (update if existing member, insert if new)
      const saveResult = await saveToSupabase(form, targetMemberId, photoUrl, isUpdate);
      console.log('Save result:', saveResult);

      if (saveResult?.success) {
        const assignedId = saveResult.memberId || targetMemberId;
        memberData.memberId = assignedId;
        
        await sendAdminNotification(form, assignedId, isUpdate);
        
        // Show pending screen
        setErrors({});
        setMemberId(assignedId);
        setMember(memberData);
        setShowPending(true);
        setCardReady(false);
      } else {
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('பிழை ஏற்பட்டது / Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setErrors({});
    setMember(null);
    setMemberId('TIWTN-2026-_____');
    setCardReady(false);
    setShowPending(false);
  };

  const downloadForm = async () => {
    const element = document.getElementById('printable-form');
    if (!element) return;
    element.style.transform = 'none';
    element.style.backdropFilter = 'none';
    element.style.webkitBackdropFilter = 'none';
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.getElementById('printable-form');
          if (clonedEl) {
            clonedEl.style.transform = 'none';
            clonedEl.style.backdropFilter = 'none';
            clonedEl.style.webkitBackdropFilter = 'none';
            clonedEl.style.boxShadow = 'none';
            clonedEl.style.borderRadius = '0';
            const allText = clonedEl.querySelectorAll('*');
            allText.forEach(el => {
              el.style.webkitPrintColorAdjust = 'exact';
            });
          }
        },
      });
      const link = document.createElement('a');
      link.download = `TIWTN_${form.fullName.replace(/\s+/g, '_')}_Form.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Form download failed', e);
    }
    element.style.transform = '';
    element.style.backdropFilter = '';
    element.style.webkitBackdropFilter = '';
  };

  const errorBorder = (field) => {
    return errors[field] ? '1.5px solid #E53E3E' : '1.5px solid #D1C8BC';
  };

  if (loading || loadingExisting) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center',
        alignItems: 'center', height: '60vh',
        color: '#FF6B00', fontSize: '16px'
      }}>ஏற்றுகிறது... / Loading...</div>
    );
  }

  if (!currentUser) return null;

  return (
    <section className="bg-secondary px-6 py-16 text-primary md:px-10 tamil-font">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="rounded-[16px] p-8" style={{ background: '#003366', boxShadow: '0 4px 24px rgba(0,51,102,0.08)' }}>
          <div className="flex items-center gap-4">
            <OrgLogo size={64} />
            <div>
              <p className="text-sm uppercase tracking-[0.3em]" style={{ color: '#FFB347' }}>REGISTER</p>
              <h1 className="mt-2 text-3xl font-display md:text-5xl" style={{ color: '#FFFFFF' }}>உறுப்பினர் பதிவு செய்யவும்</h1>
            </div>
          </div>
          <div className="mt-4" style={{ height: '1px', background: 'rgba(255,255,255,0.3)' }} />
          <p className="mt-4 max-w-3xl text-lg leading-8" style={{ color: '#FFB347' }}>தென் இந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கத்திற்கு உறுப்பினர்களாக இணைந்து பயன்களைப் பெறுங்கள்.</p>
        </div>

        {showPending ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '500px', margin: '0 auto' }}>
            {/* Pending icon */}
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: '#FEF3C7', border: '3px solid #F59E0B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', margin: '0 auto 1.5rem'
            }}>⏳</div>

            <h2 style={{
              fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)',
              marginBottom: '0.5rem', fontFamily: 'Catamaran, sans-serif'
            }}>விண்ணப்பம் பெறப்பட்டது!</h2>

            <p style={{ fontSize: '14px', color: '#92400E', fontWeight: '700', marginBottom: '0.5rem' }}>
              Application Received Successfully
            </p>

            <div style={{
              background: '#FEF3C7', border: '1px solid #F59E0B',
              borderRadius: '10px', padding: '1rem 1.5rem',
              margin: '1.5rem 0', textAlign: 'left'
            }}>
              <div style={{ fontSize: '13px', color: '#92400E', lineHeight: '1.8', fontFamily: 'Catamaran, sans-serif' }}>
                ✅ உங்கள் விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது.<br/>
                ✅ நிர்வாகி சரிபார்த்த பின்னர் உங்கள் அட்டை கிடைக்கும்.<br/>
                ✅ அனுமதி கிடைத்தவுடன் உங்கள் சுயவிவரத்தில் காட்டப்படும்.<br/>
                <br/>
                ✅ Your application has been submitted.<br/>
                ✅ ID card will be available after admin approval.<br/>
                ✅ You will see it in your profile once approved.
              </div>
            </div>

            {/* Member ID preview */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '0.8rem 1.2rem', marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                உங்கள் விண்ணப்ப எண் / Your Application ID
              </div>
              <div style={{
                fontFamily: 'Courier New, monospace', fontSize: '14px',
                fontWeight: '900', color: '#FF6B00', letterSpacing: '1px'
              }}>{member?.memberId || memberId}</div>
            </div>

            <button
              onClick={() => navigate('/profile')}
              style={{
                width: '100%', padding: '14px', background: '#FF6B00',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '15px', fontWeight: '800', cursor: 'pointer',
                fontFamily: 'Catamaran, sans-serif'
              }}
            >
              சுயவிவரம் காண்க / View Profile →
            </button>
          </div>
        ) : !member ? (
          <div ref={formRef} className="register-form rounded-[16px] border border-[#E5DDD0] bg-card" style={{ padding: '2rem', boxShadow: '0 4px 24px rgba(0,51,102,0.08)' }}>
            <div className="space-y-8">
              <div className="flex flex-col gap-4 rounded-[16px] p-4 sm:flex-row sm:items-center" style={{ background: '#003366' }}>
                <OrgLogo size={48} />
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்</p>
                  <p className="text-sm" style={{ color: '#FFB347' }}>மாநில தலைமை நிர்வாசம் அலுவலகம்</p>
                  <p className="text-sm" style={{ color: '#FFB347' }}>133/34 1A, 1A பெங்களூர்  ஹைவே</p>
                  <p className="text-sm" style={{ color: '#FFB347' }}>சென்னை – 600124, தமிழ்நாடு.</p>
                </div>
              </div>
              <div className="border-t border-[#E5DDD0]" />
              <p className="text-center text-lg font-semibold underline decoration-amber decoration-2 underline-offset-4" style={{ color: '#1A1A2E' }}>(உறுப்பினர் படிவம்)</p>

              {/* EDIT / CORRECTION BANNER IF REJECTED OR EDITING */}
              {existingMember && (
                <div style={{
                  background: existingMember.status === 'rejected' ? '#FEF2F2' : '#EFF6FF',
                  border: existingMember.status === 'rejected' ? '1.5px solid #EF4444' : '1.5px solid #3B82F6',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: '6px'
                  }}>
                    <span style={{
                      fontWeight: '800',
                      color: existingMember.status === 'rejected' ? '#DC2626' : '#1D4ED8',
                      fontSize: '14px'
                    }}>
                      {existingMember.status === 'rejected'
                        ? '⚠️ விண்ணப்பத்தை திருத்துதல் / Correcting Rejected Application'
                        : '✏️ விண்ணப்ப விவரங்களை புதுப்பித்தல் / Edit Application'}
                    </span>
                    <span style={{
                      background: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontFamily: 'Courier New, monospace',
                      fontWeight: '800',
                      fontSize: '12px',
                      color: '#FF6B00'
                    }}>
                      ID: {existingMember.member_id}
                    </span>
                  </div>

                  {existingMember.status === 'rejected' && existingMember.rejection_reason && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      background: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #FCA5A5'
                    }}>
                      <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: '700', marginBottom: '2px' }}>
                        நிராகரிப்பு காரணம் / Rejection Reason:
                      </div>
                      <div style={{ fontSize: '13px', color: '#1F2937', fontWeight: '600' }}>
                        {existingMember.rejection_reason}
                      </div>
                    </div>
                  )}

                  <p style={{
                    fontSize: '12px',
                    color: existingMember.status === 'rejected' ? '#B91C1C' : '#1E40AF',
                    marginTop: '8px',
                    lineHeight: '1.5'
                  }}>
                    💡 தவறான விவரங்கள் அல்லது புகைப்படத்தை திருத்தி கீழே உள்ள பட்டனை அழுத்தி மீண்டும் சமர்ப்பிக்கவும். உங்கள் பழைய உறுப்பினர் எண் ({existingMember.member_id}) மாறாது.
                  </p>
                </div>
              )}

              <div className="space-y-4 rounded-[12px] p-5" style={{ border: '1.5px solid #E5DDD0' }}>
                <label className="block">
                  <BiLabel tamil="முழு பெயர்" english="Full Name" required />
                  <div className={`rounded-[8px] transition-all duration-200 ${errors.fullName ? 'animate-shake' : ''}`} style={{ marginTop: '4px' }}>
                    <input
                      value={form.fullName}
                      onChange={handleChange('fullName')}
                      placeholder="பெயர் / Full Name"
                      style={{ height: '44px', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('fullName'), width: '100%', backgroundColor: '#FFFFFF', color: '#1A1A2E', fontFamily: 'Catamaran, sans-serif', outline: 'none', WebkitTextFillColor: '#1A1A2E', caretColor: '#FF6B00' }}
                      className="focus:border-amber"
                    />
                  </div>
                  {errors.fullName && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.fullName}</p>}
                </label>

                <label className="block">
                  <BiLabel tamil="பதவி" english="Posting" required />
                  <div className={`rounded-[8px] transition-all duration-200 ${errors.posting ? 'animate-shake' : ''}`} style={{ marginTop: '4px' }}>
                    <input
                      value={form.posting}
                      onChange={handleChange('posting')}
                      placeholder="பதவி / Posting (வெல்டர் / Welder)"
                      style={{ height: '44px', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('posting'), width: '100%', backgroundColor: '#FFFFFF', color: '#1A1A2E', fontFamily: 'Catamaran, sans-serif', outline: 'none', WebkitTextFillColor: '#1A1A2E', caretColor: '#FF6B00' }}
                      className="focus:border-amber"
                    />
                  </div>
                  {errors.posting && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.posting}</p>}
                </label>

                <label className="block">
                  <BiLabel tamil="சரியான முகவரி" english="Correct Address" required />
                  <div style={{ marginTop: '4px' }}>
                    <textarea
                      rows="2"
                      value={form.address}
                      onChange={handleChange('address')}
                      placeholder="முகவரி / Address"
                      style={{ padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('address'), width: '100%', resize: 'vertical', backgroundColor: '#FFFFFF', color: '#1A1A2E', fontFamily: 'Catamaran, sans-serif', outline: 'none', minHeight: '44px', WebkitTextFillColor: '#1A1A2E' }}
                      className="focus:border-amber"
                    />
                  </div>
                  {errors.address && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.address}</p>}
                </label>

                <label className="block">
                  <BiLabel tamil="நிறுவனத்தின் முகவரி" english="Organization Address" />
                  <div style={{ marginTop: '4px' }}>
                    <textarea
                      rows="2"
                      value={form.companyAddress}
                      onChange={handleChange('companyAddress')}
                      placeholder="நிறுவன முகவரி / Organization Address"
                      style={{ padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('companyAddress'), width: '100%', resize: 'vertical', backgroundColor: '#FFFFFF', color: '#1A1A2E', fontFamily: 'Catamaran, sans-serif', outline: 'none', minHeight: '44px', WebkitTextFillColor: '#1A1A2E' }}
                      className="focus:border-amber"
                    />
                  </div>
                  {errors.companyAddress && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.companyAddress}</p>}
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <BiLabel tamil="இரத்த பிரிவு" english="Blood Group" required />
                    <div style={{ marginTop: '4px' }}>
                      <input
                        type="text"
                        placeholder="இரத்த பிரிவு / Blood Group"
                        value={form.bloodGroup}
                        onChange={handleChange('bloodGroup')}
                        style={{ height: '44px', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('bloodGroup'), width: '100%', backgroundColor: '#FFFFFF', color: '#1A1A2E', fontFamily: 'Catamaran, sans-serif', outline: 'none', WebkitTextFillColor: '#1A1A2E', caretColor: '#FF6B00' }}
                        className="focus:border-amber"
                      />
                    </div>
                    {errors.bloodGroup && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.bloodGroup}</p>}
                  </label>

                  <label className="block">
                    <BiLabel tamil="பிறந்த தேதி" english="Date of Birth" required />
                    <div style={{ marginTop: '4px' }}>
                      <input
                        type="date"
                        value={form.dob}
                        onChange={handleChange('dob')}
                        style={{ height: '44px', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('dob'), width: '100%', backgroundColor: '#FFFFFF', color: '#1A1A2E', fontFamily: 'Catamaran, sans-serif', outline: 'none', WebkitTextFillColor: '#1A1A2E', caretColor: '#FF6B00' }}
                        className="focus:border-amber"
                      />
                    </div>
                    {errors.dob && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.dob}</p>}
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <BiLabel tamil="ஆதார் எண்" english="Aadhaar Number" required />
                    <div style={{ marginTop: '4px' }}>
                      <input
                        value={form.aadhaar}
                        inputMode="numeric"
                        maxLength={12}
                        onChange={handleChange('aadhaar')}
                        placeholder="12 இலக்கங்கள் / 12 digits"
                        style={{ height: '44px', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('aadhaar'), width: '100%', backgroundColor: '#FFFFFF', color: '#1A1A2E', fontFamily: 'Catamaran, sans-serif', outline: 'none', WebkitTextFillColor: '#1A1A2E', caretColor: '#FF6B00' }}
                        className="focus:border-amber"
                      />
                    </div>
                    {errors.aadhaar && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.aadhaar}</p>}
                  </label>

                  <label className="block">
                    <BiLabel tamil="செல் நம்பர்" english="Mobile Number" required />
                    <div style={{ marginTop: '4px' }}>
                      <input
                        value={form.mobile}
                        inputMode="numeric"
                        maxLength={10}
                        onChange={handleChange('mobile')}
                        placeholder="10 இலக்கங்கள் / 10 digits"
                        style={{ height: '44px', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('mobile'), width: '100%', backgroundColor: '#FFFFFF', color: '#1A1A2E', fontFamily: 'Catamaran, sans-serif', outline: 'none', WebkitTextFillColor: '#1A1A2E', caretColor: '#FF6B00' }}
                        className="focus:border-amber"
                      />
                    </div>
                    {errors.mobile && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.mobile}</p>}
                  </label>
                </div>

                <label className="block">
                  <BiLabel tamil="வாரிசுதாரர் பெயர்" english="Nominee Name" />
                  <div style={{ marginTop: '4px' }}>
                    <input
                      value={form.nomineeName}
                      onChange={handleChange('nomineeName')}
                      placeholder="வாரிசுதாரர் பெயர் / Nominee Name"
                      style={{ height: '44px', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('nomineeName'), width: '100%', backgroundColor: '#FFFFFF', color: '#1A1A2E', fontFamily: 'Catamaran, sans-serif', outline: 'none', WebkitTextFillColor: '#1A1A2E', caretColor: '#FF6B00' }}
                      className="focus:border-amber"
                    />
                  </div>
                  {errors.nomineeName && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.nomineeName}</p>}
                </label>

                <label className="block">
                  <BiLabel tamil="வாரிசுதாரர் செல்நம்பர்" english="Nominee Mobile" />
                  <div style={{ marginTop: '4px' }}>
                    <input
                      value={form.nomineeMobile}
                      inputMode="numeric"
                      maxLength={10}
                      onChange={handleChange('nomineeMobile')}
                      placeholder="10 இலக்கங்கள் / 10 digits"
                      style={{ height: '44px', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('nomineeMobile'), width: '100%', backgroundColor: '#FFFFFF', color: '#1A1A2E', fontFamily: 'Catamaran, sans-serif', outline: 'none', WebkitTextFillColor: '#1A1A2E', caretColor: '#FF6B00' }}
                      className="focus:border-amber"
                    />
                  </div>
                  {errors.nomineeMobile && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.nomineeMobile}</p>}
                </label>
              </div>

              <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
                <div className="w-full rounded-[12px] p-5 text-center" style={{ border: '1.5px solid #E5DDD0' }}>
                  <p className="mb-3 text-sm font-semibold" style={{ color: '#2C3E6B' }}>உறுப்பினர் படம்</p>
                  <label className="group relative mx-auto block cursor-pointer" style={{ width: '120px', height: '140px' }}>
                    {getPhotoSrc(form) ? (
                      <img src={getPhotoSrc(form)} alt="Member" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '2px solid #003366' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', border: '2px dashed #CCCCCC', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#888888', fontSize: '12px' }}>
                        <span style={{ fontSize: '24px' }}>📷</span>
                        <span>படம் பதிவேற்று</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" capture={false} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', zIndex: 2 }} onChange={handlePhotoUpload} />
                  </label>
                  {errors.profilePhoto && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '6px', textAlign: 'center' }}>{errors.profilePhoto}</p>}
                </div>

                <div className="w-full rounded-[12px] p-4 text-center" style={{ background: '#F0F7FF', border: '1.5px solid #003366' }}>
                  <p className="mb-2 text-xs" style={{ color: '#888888' }}>உறுப்பினர் பதிவு எண்</p>
                  <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: '14px', letterSpacing: '1px', color: '#003366', padding: '8px', borderTop: '1px solid #003366' }}>
                    {memberId === 'TIWTN-2026-_____' ? '-- -- -- -- --' : memberId}
                  </div>
                </div>
              </div>

              <p className="text-center text-sm" style={{ color: '#888888' }}>அனைவருக்கும் சம உரிமை:</p>

              <div className="rounded-[12px] p-4" style={{ border: '1.5px solid #E5DDD0', marginBottom: '8px' }}>
                <label className="block">
                  <BiLabel tamil="மாவட்டம்" english="District" required />
                  <div style={{ marginTop: '4px' }}>
                    <select
                      value={form.pledgeDistrict}
                      onChange={handleChange('pledgeDistrict')}
                      style={{
                        height: '44px',
                        backgroundColor: '#FFFFFF',
                        border: errors.pledgeDistrict ? '1.5px solid #E53E3E' : '1.5px solid var(--border, #D1C8BC)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '14px',
                        color: '#1A1A2E',
                        fontFamily: 'Catamaran, sans-serif',
                        width: '100%',
                        outline: 'none',
                        cursor: 'pointer',
                        appearance: 'auto'
                      }}
                    >
                      <option value="" style={{ color: '#1A1A2E', backgroundColor: '#FFFFFF' }}>-- மாவட்டம் தேர்வு செய்க / Select District --</option>
                      {TAMIL_NADU_DISTRICTS.map((district) => (
                        <option key={district} value={district} style={{ color: '#1A1A2E', backgroundColor: '#FFFFFF' }}>{district}</option>
                      ))}
                    </select>
                  </div>
                  {errors.pledgeDistrict && (
                    <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.pledgeDistrict}</p>
                  )}
                </label>
              </div>

              <div className="rounded-[12px] p-6" style={{ background: '#FFF8F0', border: '1.5px solid #FFB347' }}>
                <div className="mb-4 text-center">
                  <p className="text-lg font-semibold underline decoration-amber decoration-2 underline-offset-4" style={{ color: '#003366' }}>உறுதிமொழி</p>
                </div>
                <p className="text-[13px] leading-[1.8] md:text-sm" style={{ color: '#1A1A2E' }}>
                  ஐயா,
                  <input
                    value={form.pledgeName}
                    onChange={handleChange('pledgeName')}
                    placeholder="Name"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #003366',
                      color: '#1A1A2E',
                      WebkitTextFillColor: '#1A1A2E',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      padding: '4px 10px',
                      width: '200px',
                      borderRadius: '8px',
                      display: 'inline-block',
                      outline: 'none',
                      margin: '0 4px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                  />
                  ஆகிய நான் தென் இந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கத்தின்
                  {' '}<strong>{form.pledgeDistrict || '___________'}</strong>{' '}
                  மாவட்டம்
                  <input
                    value={form.pledgeBranch}
                    onChange={handleChange('pledgeBranch')}
                    placeholder="Branch"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #003366',
                      color: '#1A1A2E',
                      WebkitTextFillColor: '#1A1A2E',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      padding: '4px 10px',
                      width: '160px',
                      borderRadius: '8px',
                      display: 'inline-block',
                      outline: 'none',
                      margin: '0 4px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                  />
                  கிளைசங்கத்தில் உறுப்பினராக சேர்ந்து பணியாற்ற சம்மதிக்கின்றேன்.
                </p>
                <p className="mt-4 text-[13px] leading-[1.8] md:text-sm" style={{ color: '#1A1A2E' }}>
                  மேலும் சங்கத்தின் சட்ட திட்டங்களுக்கு கட்டுப்பட்டு நடப்பேன் எனவும்,
                  சங்கம் விதிக்கும் சந்தா தொகையை கட்ட சம்மதிக்கின்றேன் எனவும்,
                  சங்க வளர்ச்சிக்காக பாடுபடுவேன் எனவும் உறுதி கூறுகின்றேன்.
                </p>
                <p className="mt-5 text-right text-sm" style={{ color: '#1A1A2E' }}>இங்ஙனம்,<br />தங்கள் உண்மையுள்ள,</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-3 rounded-[12px] p-4" style={{ border: '1.5px solid #E5DDD0' }}>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-semibold" style={{ color: '#2C3E6B' }}>நாள்:</span>
                    <span style={{ color: '#1A1A2E' }}>{joiningDate}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 rounded-[12px] p-4" style={{ border: '1.5px solid #E5DDD0' }}>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-semibold" style={{ color: '#2C3E6B' }}>பரிந்துரை / Referral:</span>
                    <input
                      value={form.referral}
                      onChange={handleChange('referral')}
                      placeholder="பரிந்துரை / Referral name"
                      style={{
                        border: '1.5px solid #E5DDD0',
                        backgroundColor: '#FFFFFF',
                        color: '#1A1A2E',
                        WebkitTextFillColor: '#1A1A2E',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        flex: 1
                      }}
                    />
                  </div>
                  <div className="mt-3 pt-3 text-sm" style={{ borderTop: '1px solid #E5DDD0' }}>
                    <div className="font-semibold" style={{ color: '#2C3E6B' }}>உறுப்பினர் கையொப்பம்</div>
                    <div className="mt-4" style={{ height: '1px', background: '#E5DDD0', width: '100%' }} />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[12px] p-4 text-center text-sm" style={{ border: '1.5px solid #E5DDD0' }}>
                  <div className="mb-3 font-semibold" style={{ color: '#1A1A2E' }}>மாநில தலைவர்</div>
                  <div style={{ height: '1px', background: '#E5DDD0' }} />
                </div>
                <div className="rounded-[12px] p-4 text-center text-sm" style={{ border: '1.5px solid #E5DDD0' }}>
                  <div className="mb-3 font-semibold" style={{ color: '#1A1A2E' }}>மாநில செயலாளர்</div>
                  <div style={{ height: '1px', background: '#E5DDD0' }} />
                </div>
                <div className="rounded-[12px] p-4 text-center text-sm" style={{ border: '1.5px solid #E5DDD0' }}>
                  <div className="mb-3 font-semibold" style={{ color: '#1A1A2E' }}>மாநில பொருளாளர்</div>
                  <div style={{ height: '1px', background: '#E5DDD0' }} />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="mt-8 inline-flex h-[52px] w-full items-center justify-center rounded-[12px] px-6 text-sm font-semibold transition-all"
              style={{
                background: '#FF6B00',
                color: '#FFFFFF',
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(255, 107, 0, 0.25)'
              }}
            >
              {isSubmitting ? (
                'பதிவு செய்கிறது... / Submitting...'
              ) : existingMember ? (
                <>
                  🔄 திருத்தி மீண்டும் சமர்ப்பிக்க
                  <span className="ml-3 text-xs uppercase tracking-[0.2em]">Save & Re-Submit</span>
                </>
              ) : (
                <>
                  பதிவு செய்க
                  <span className="ml-3 text-xs uppercase tracking-[0.2em]">Register Now</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            <div id="printable-form" style={{ background: '#FFFFFF', padding: '40px', width: '794px', minHeight: '1123px', position: 'relative', margin: '0 auto', borderRadius: '0', boxShadow: 'none', transform: 'none', backdropFilter: 'none', fontFamily: "'Noto Sans Tamil', 'DM Sans', sans-serif" }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '2px solid #003366', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src="/logo.png" width="60" height="60" style={{ borderRadius: '50%', border: '2px solid #FF6B00', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none' }} />
                  <div>
                    <p style={{ fontSize: '18px', fontWeight: 800, color: '#003366', margin: 0 }}>தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்</p>
                    <p style={{ fontSize: '11px', color: '#666666', margin: '4px 0 0 0' }}>Thennindia Welding Thozhilaalargal Nala Sangam — உறுப்பினர் படிவம் / MEMBERSHIP FORM</p>
                  </div>
                </div>
                {getPhotoSrc(form) && (
                  <div style={{ width: '96px', textAlign: 'center', flexShrink: 0 }}>
                    <img src={getPhotoSrc(form)} alt="Member" crossOrigin="anonymous" style={{ width: '96px', height: '112px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #003366' }} />
                    <p style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>உறுப்பினர் படம்</p>
                  </div>
                )}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr><td style={{ padding: '8px 12px', fontWeight: 600, color: '#003366', width: '200px', borderBottom: '1px solid #CCCCCC' }}>முழு பெயர்</td><td style={{ padding: '8px 12px', color: '#003366', borderBottom: '1px solid #CCCCCC' }}>{form.fullName}</td></tr>
                  <tr><td style={{ padding: '8px 12px', fontWeight: 600, color: '#003366', width: '200px', borderBottom: '1px solid #CCCCCC' }}>பதவி</td><td style={{ padding: '8px 12px', color: '#003366', borderBottom: '1px solid #CCCCCC' }}>{form.posting}</td></tr>
                  <tr><td style={{ padding: '8px 12px', fontWeight: 600, color: '#003366', width: '200px', borderBottom: '1px solid #CCCCCC' }}>சரியான முகவரி</td><td style={{ padding: '8px 12px', color: '#003366', borderBottom: '1px solid #CCCCCC' }}>{form.address}</td></tr>
                  <tr><td style={{ padding: '8px 12px', fontWeight: 600, color: '#003366', width: '200px', borderBottom: '1px solid #CCCCCC' }}>நிறுவனத்தின் முகவரி</td><td style={{ padding: '8px 12px', color: '#003366', borderBottom: '1px solid #CCCCCC' }}>{form.companyAddress}</td></tr>
                  <tr><td style={{ padding: '8px 12px', fontWeight: 600, color: '#003366', width: '200px', borderBottom: '1px solid #CCCCCC' }}>இரத்த பிரிவு</td><td style={{ padding: '8px 12px', color: '#003366', borderBottom: '1px solid #CCCCCC' }}>{form.bloodGroup}</td></tr>
                  <tr><td style={{ padding: '8px 12px', fontWeight: 600, color: '#003366', width: '200px', borderBottom: '1px solid #CCCCCC' }}>பிறந்த தேதி</td><td style={{ padding: '8px 12px', color: '#003366', borderBottom: '1px solid #CCCCCC' }}>{form.dob}</td></tr>
                  <tr><td style={{ padding: '8px 12px', fontWeight: 600, color: '#003366', width: '200px', borderBottom: '1px solid #CCCCCC' }}>ஆதார் எண்</td><td style={{ padding: '8px 12px', color: '#003366', borderBottom: '1px solid #CCCCCC' }}>{form.aadhaar}</td></tr>
                  <tr><td style={{ padding: '8px 12px', fontWeight: 600, color: '#003366', width: '200px', borderBottom: '1px solid #CCCCCC' }}>செல் நம்பர்</td><td style={{ padding: '8px 12px', color: '#003366', borderBottom: '1px solid #CCCCCC' }}>{form.mobile}</td></tr>
                  <tr><td style={{ padding: '8px 12px', fontWeight: 600, color: '#003366', width: '200px', borderBottom: '1px solid #CCCCCC' }}>வாரிசுதாரர் பெயர்</td><td style={{ padding: '8px 12px', color: '#003366', borderBottom: '1px solid #CCCCCC' }}>{form.nomineeName}</td></tr>
                  <tr><td style={{ padding: '8px 12px', fontWeight: 600, color: '#003366', width: '200px', borderBottom: '1px solid #CCCCCC' }}>வாரிசுதாரர் செல்நம்பர்</td><td style={{ padding: '8px 12px', color: '#003366', borderBottom: '1px solid #CCCCCC' }}>{form.nomineeMobile}</td></tr>
                  <tr><td style={{ padding: '8px 12px', fontWeight: 600, color: '#003366', width: '200px', borderBottom: '1px solid #CCCCCC' }}>பரிந்துரை</td><td style={{ padding: '8px 12px', color: '#003366', borderBottom: '1px solid #CCCCCC' }}>{form.referral || '-'}</td></tr>
                  <tr><td style={{ padding: '8px 12px', fontWeight: 600, color: '#003366', width: '200px', borderBottom: '1px solid #CCCCCC' }}>நாள்</td><td style={{ padding: '8px 12px', color: '#003366', borderBottom: '1px solid #CCCCCC' }}>{joiningDate}</td></tr>
                  <tr><td style={{ padding: '8px 12px', fontWeight: 600, color: '#003366', width: '200px', borderBottom: '1px solid #CCCCCC' }}>உறுப்பினர் எண்</td><td style={{ padding: '8px 12px', color: '#003366', borderBottom: '1px solid #CCCCCC', fontFamily: "'Courier Prime', monospace", letterSpacing: '2px' }}>{memberId}</td></tr>
                </tbody>
              </table>

              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #CCCCCC' }}>
                <p style={{ fontWeight: 600, color: '#003366', fontSize: '14px', marginBottom: '8px' }}>உறுதிமொழி / PLEDGE</p>
                <p style={{ color: '#333', fontSize: '13px', lineHeight: 1.8 }}>
                  ஐயா, <strong>{form.pledgeName}</strong> ஆகிய நான் தென் இந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கத்தின் <strong>{form.pledgeDistrict}</strong> மாவட்டம் <strong>{form.pledgeBranch}</strong> கிளைசங்கத்தில் உறுப்பினராக சேர்ந்து பணியாற்ற சம்மதிக்கின்றேன்.
                </p>
                <p style={{ color: '#333', fontSize: '13px', lineHeight: 1.8 }}>
                  மேலும் சங்கத்தின் சட்ட திட்டங்களுக்கு கட்டுப்பட்டு நடப்பேன் எனவும், சங்கம் விதிக்கும் சந்தா தொகையை கட்ட சம்மதிக்கின்றேன் எனவும், சங்க வளர்ச்சிக்காக பாடுபடுவேன் எனவும் உறுதி கூறுகின்றேன்.
                </p>
                <p style={{ color: '#333', fontSize: '13px', textAlign: 'right', marginTop: '16px' }}>இங்ஙனம்,<br />தங்கள் உண்மையுள்ள,</p>
              </div>

              <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #CCCCCC' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ width: '160px', height: '1px', background: '#003366', margin: '0 auto 8px' }} />
                  <p style={{ color: '#666', fontSize: '11px' }}>மாநில தலைவர்</p>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ width: '160px', height: '1px', background: '#003366', margin: '0 auto 8px' }} />
                  <p style={{ color: '#666', fontSize: '11px' }}>மாநில செயலாளர்</p>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ width: '160px', height: '1px', background: '#003366', margin: '0 auto 8px' }} />
                  <p style={{ color: '#666', fontSize: '11px' }}>மாநில பொருளாளர்</p>
                </div>
              </div>

              <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px', textAlign: 'center', borderTop: '2px solid #003366', paddingTop: '12px' }}>
                <p style={{ color: '#888', fontSize: '10px', letterSpacing: '1px' }}>தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம் · Thennindia Welding Thozhilaalargal Nala Sangam</p>
              </div>
            </div>

            <div ref={cardRef}>
              <IDCard member={member} onReset={handleReset} />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button type="button" onClick={downloadForm} className="button-amber inline-flex h-[52px] items-center justify-center px-8 text-sm font-semibold text-black">
                Download Filled Form
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default Register;
