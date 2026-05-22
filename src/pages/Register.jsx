import { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import IDCard from '../components/IDCard';
import OrgLogo from '../components/OrgLogo';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const initialForm = {
  fullName: '',
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
};

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
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [member, setMember] = useState(null);
  const [memberId, setMemberId] = useState('TIWTN-2025-_____');
  const [cardReady, setCardReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const cardRef = useRef(null);
  const formRef = useRef(null);
  const joiningDate = useMemo(() => formatDateDisplay(), []);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, profilePhoto: file, photoPreview: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setForm((prev) => ({ ...prev, profilePhoto: null, photoPreview: null }));
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
    if (!form.address.trim()) nextErrors.address = 'இந்த தகவல் அவசியம்';
    if (!form.companyAddress.trim()) nextErrors.companyAddress = 'இந்த தகவல் அவசியம்';
    if (!form.bloodGroup) nextErrors.bloodGroup = 'இந்த தகவல் அவசியம்';
    if (!form.dob) nextErrors.dob = 'இந்த தகவல் அவசியம்';
    if (!form.aadhaar.match(/^\d{12}$/)) nextErrors.aadhaar = 'சரியான ஆதார் எண் உள்ளிடுக';
    if (!form.mobile.match(/^\d{10}$/)) nextErrors.mobile = 'சரியான செல் நம்பர் உள்ளிடுக';
    if (!form.nomineeName.trim()) nextErrors.nomineeName = 'இந்த தகவல் அவசியம்';
    if (form.nomineeMobile && !form.nomineeMobile.match(/^\d{10}$/)) nextErrors.nomineeMobile = 'சரியான செல் நம்பர் உள்ளிடுக';
    if (!form.pledgeName.trim()) nextErrors.pledgeName = 'இந்த தகவல் அவசியம்';
    if (!form.pledgeDistrict.trim()) nextErrors.pledgeDistrict = 'இந்த தகவல் அவசியம்';
    if (!form.pledgeBranch.trim()) nextErrors.pledgeBranch = 'இந்த தகவல் அவசியம்';
    if (!form.profilePhoto) nextErrors.profilePhoto = 'படத்தை பதிவேற்றவும்';
    else if (!form.profilePhoto.type.startsWith('image/')) nextErrors.profilePhoto = 'படத்தை பதிவேற்றவும்';
    else if (form.profilePhoto.size > 2_000_000) nextErrors.profilePhoto = 'படத்தை 2MB limit';
    return nextErrors;
  };

  const createMemberId = () => {
    return `TIWTN-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000)).padStart(5, '0')}`;
  };

  const handleSubmit = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setSubmitting(true);
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setTimeout(() => setSubmitting(false), 400);
      return;
    }
    const generatedId = createMemberId();
    const memberData = {
      ...form,
      joiningDate,
      memberId: generatedId,
    };
    setErrors({});
    setMemberId(generatedId);
    setMember(memberData);
    setCardReady(false);
    setTimeout(() => setCardReady(true), 300);
    setSubmitting(false);
  };

  const handleReset = () => {
    setForm(initialForm);
    setErrors({});
    setMember(null);
    setMemberId('TIWTN-2025-_____');
    setCardReady(false);
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

        {!member ? (
          <form ref={formRef} className="register-form rounded-[16px] border border-[#E5DDD0] bg-card" style={{ padding: '2rem', boxShadow: '0 4px 24px rgba(0,51,102,0.08)' }}>
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

              <div className="space-y-4 rounded-[12px] p-5" style={{ border: '1.5px solid #E5DDD0' }}>
                <label className="block">
                  <span className="text-sm font-semibold" style={{ color: '#2C3E6B' }}>முழு பெயர் :</span>
                  <div className={`rounded-[8px] transition-all duration-200 ${errors.fullName ? 'animate-shake' : ''}`} style={{ marginTop: '4px' }}>
                    <input
                      value={form.fullName}
                      onChange={handleChange('fullName')}
                      style={{ height: '44px', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('fullName'), width: '100%', background: 'var(--input-bg)', color: 'var(--input-text)', fontFamily: "'Catamaran', sans-serif", outline: 'none' }}
                      className="focus:border-amber"
                    />
                  </div>
                  {errors.fullName && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.fullName}</p>}
                </label>

                <label className="block">
                  <span className="text-sm font-semibold" style={{ color: '#2C3E6B' }}>சரியான முகவரி :</span>
                  <div style={{ marginTop: '4px' }}>
                    <textarea
                      rows="2"
                      value={form.address}
                      onChange={handleChange('address')}
                      style={{ padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('address'), width: '100%', resize: 'vertical', background: 'var(--input-bg)', color: 'var(--input-text)', fontFamily: "'Catamaran', sans-serif", outline: 'none', minHeight: '44px' }}
                      className="focus:border-amber"
                    />
                  </div>
                  {errors.address && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.address}</p>}
                </label>

                <label className="block">
                  <span className="text-sm font-semibold" style={{ color: '#2C3E6B' }}>நிறுவனத்தின் முகவரி :</span>
                  <div style={{ marginTop: '4px' }}>
                    <textarea
                      rows="2"
                      value={form.companyAddress}
                      onChange={handleChange('companyAddress')}
                      style={{ padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('companyAddress'), width: '100%', resize: 'vertical', background: 'var(--input-bg)', color: 'var(--input-text)', fontFamily: "'Catamaran', sans-serif", outline: 'none', minHeight: '44px' }}
                      className="focus:border-amber"
                    />
                  </div>
                  {errors.companyAddress && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.companyAddress}</p>}
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold" style={{ color: '#2C3E6B' }}>இரத்த பிரிவு :</span>
                    <div style={{ marginTop: '4px' }}>
                      <select
                        value={form.bloodGroup}
                        onChange={handleChange('bloodGroup')}
                        style={{ height: '44px', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('bloodGroup'), width: '100%', background: 'var(--input-bg)', color: 'var(--input-text)', fontFamily: "'Catamaran', sans-serif", outline: 'none' }}
                        className="focus:border-amber"
                      >
                        <option value="">Select</option>
                        {bloodGroups.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                    {errors.bloodGroup && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.bloodGroup}</p>}
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold" style={{ color: '#2C3E6B' }}>வயது பிறந்த தேதி :</span>
                    <div style={{ marginTop: '4px' }}>
                      <input
                        type="date"
                        value={form.dob}
                        onChange={handleChange('dob')}
                        style={{ height: '44px', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('dob'), width: '100%', background: 'var(--input-bg)', color: 'var(--input-text)', fontFamily: "'Catamaran', sans-serif", outline: 'none' }}
                        className="focus:border-amber"
                      />
                    </div>
                    {errors.dob && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.dob}</p>}
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold" style={{ color: '#2C3E6B' }}>ஆதார் எண் :</span>
                    <div style={{ marginTop: '4px' }}>
                      <input
                        value={form.aadhaar}
                        inputMode="numeric"
                        maxLength={12}
                        onChange={handleChange('aadhaar')}
                        placeholder="12 digits"
                        style={{ height: '44px', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('aadhaar'), width: '100%', background: 'var(--input-bg)', color: 'var(--input-text)', fontFamily: "'Catamaran', sans-serif", outline: 'none' }}
                        className="focus:border-amber"
                      />
                    </div>
                    {errors.aadhaar && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.aadhaar}</p>}
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold" style={{ color: '#2C3E6B' }}>செல் நம்பர் :</span>
                    <div style={{ marginTop: '4px' }}>
                      <input
                        value={form.mobile}
                        inputMode="numeric"
                        maxLength={10}
                        onChange={handleChange('mobile')}
                        placeholder="10 digits"
                        style={{ height: '44px', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('mobile'), width: '100%', background: 'var(--input-bg)', color: 'var(--input-text)', fontFamily: "'Catamaran', sans-serif", outline: 'none' }}
                        className="focus:border-amber"
                      />
                    </div>
                    {errors.mobile && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.mobile}</p>}
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold" style={{ color: '#2C3E6B' }}>வாரிசுதாரர் பெயர் :</span>
                  <div style={{ marginTop: '4px' }}>
                    <input
                      value={form.nomineeName}
                      onChange={handleChange('nomineeName')}
                      style={{ height: '44px', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('nomineeName'), width: '100%', background: 'var(--input-bg)', color: 'var(--input-text)', fontFamily: "'Catamaran', sans-serif", outline: 'none' }}
                      className="focus:border-amber"
                    />
                  </div>
                  {errors.nomineeName && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>{errors.nomineeName}</p>}
                </label>

                <label className="block">
                  <span className="text-sm font-semibold" style={{ color: '#2C3E6B' }}>வாரிசுதாரர் செல்நம்பர் :</span>
                  <div style={{ marginTop: '4px' }}>
                    <input
                      value={form.nomineeMobile}
                      inputMode="numeric"
                      maxLength={10}
                      onChange={handleChange('nomineeMobile')}
                      placeholder="10 digits"
                      style={{ height: '44px', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: errorBorder('nomineeMobile'), width: '100%', background: 'var(--input-bg)', color: 'var(--input-text)', fontFamily: "'Catamaran', sans-serif", outline: 'none' }}
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
                    {form.photoPreview ? (
                      <img src={form.photoPreview} alt="Member" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '2px solid #003366' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', border: '2px dashed #CCCCCC', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#888888', fontSize: '12px' }}>
                        <span style={{ fontSize: '24px' }}>📷</span>
                        <span>படம் பதிவேற்று</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" capture={false} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', zIndex: 2 }} onChange={handlePhotoChange} />
                  </label>
                  {errors.profilePhoto && <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '6px', textAlign: 'center' }}>{errors.profilePhoto}</p>}
                </div>

                <div className="w-full rounded-[12px] p-4 text-center" style={{ background: '#F0F7FF', border: '1.5px solid #003366' }}>
                  <p className="mb-2 text-xs" style={{ color: '#888888' }}>உறுப்பினர் பதிவு எண்</p>
                  <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: '14px', letterSpacing: '1px', color: '#003366', padding: '8px', borderTop: '1px solid #003366' }}>
                    {memberId === 'TIWTN-2025-_____' ? '-- -- -- -- --' : memberId}
                  </div>
                </div>
              </div>

              <p className="text-center text-sm" style={{ color: '#888888' }}>அனைவருக்கும் சம உரிமை:</p>

              <div className="rounded-[12px] p-6" style={{ background: '#FFF8F0', border: '1.5px solid #FFB347' }}>
                <div className="mb-4 text-center">
                  <p className="text-lg font-semibold underline decoration-amber decoration-2 underline-offset-4" style={{ color: '#003366' }}>உறுதிமொழி</p>
                </div>
                <p className="text-[13px] leading-[1.8] md:text-sm" style={{ color: '#1A1A2E' }}>
                  ஐயா,
                  <input value={form.pledgeName} onChange={handleChange('pledgeName')} placeholder="Name" style={{ background: 'transparent', border: 'none', borderBottom: '1.5px solid #003366', color: '#1A1A2E', fontFamily: 'inherit', fontSize: 'inherit', padding: '0 4px', width: '180px', borderRadius: '0', display: 'inline', outline: 'none' }} />
                  ஆகிய நான் தென் இந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கத்தின்
                  <input value={form.pledgeDistrict} onChange={handleChange('pledgeDistrict')} placeholder="District" style={{ background: 'transparent', border: 'none', borderBottom: '1.5px solid #003366', color: '#1A1A2E', fontFamily: 'inherit', fontSize: 'inherit', padding: '0 4px', width: '120px', borderRadius: '0', display: 'inline', outline: 'none' }} />
                  மாவட்டம்
                  <input value={form.pledgeBranch} onChange={handleChange('pledgeBranch')} placeholder="Branch" style={{ background: 'transparent', border: 'none', borderBottom: '1.5px solid #003366', color: '#1A1A2E', fontFamily: 'inherit', fontSize: 'inherit', padding: '0 4px', width: '140px', borderRadius: '0', display: 'inline', outline: 'none' }} />
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
                    <span className="font-semibold" style={{ color: '#2C3E6B' }}>பரிந்துரை:</span>
                    <input value={form.referral} onChange={handleChange('referral')} placeholder="Referrer" style={{ border: 'none', background: 'transparent', color: '#1A1A2E', padding: '0', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit', flex: 1 }} />
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

            <button type="button" onClick={handleSubmit} className="mt-8 inline-flex h-[52px] w-full items-center justify-center rounded-[12px] px-6 text-sm font-semibold transition-all hover:opacity-90" style={{ background: '#FF6B00', color: '#FFFFFF' }}>
              பதிவு செய்க
              <span className="ml-3 text-xs uppercase tracking-[0.2em]">Register Now</span>
            </button>
          </form>
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
                {form.photoPreview && (
                  <div style={{ width: '96px', textAlign: 'center', flexShrink: 0 }}>
                    <img src={form.photoPreview} alt="Member" style={{ width: '96px', height: '112px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #003366' }} />
                    <p style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>உறுப்பினர் படம்</p>
                  </div>
                )}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr><td style={{ padding: '8px 12px', fontWeight: 600, color: '#003366', width: '200px', borderBottom: '1px solid #CCCCCC' }}>முழு பெயர்</td><td style={{ padding: '8px 12px', color: '#003366', borderBottom: '1px solid #CCCCCC' }}>{form.fullName}</td></tr>
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
