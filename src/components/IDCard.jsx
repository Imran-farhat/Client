import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import balajiSign from '../assets/balaji_clean.png';
import idhreesSign from '../assets/idhrees_clean.png';
import muraliSign from '../assets/murali_clean.png';

const CARD_W = 240;
const CARD_H = 380;

const AUTHORITIES = [
  {
    sign: balajiSign,
    nameTamil: 'அ. பாலாஜி',
    role: 'மாநில தலைவர்',
    roleEn: 'State President'
  },
  {
    sign: idhreesSign,
    nameTamil: 'ம. முகமது இத்ரீஸ்',
    role: 'மாநில செயலாளர்',
    roleEn: 'State Secretary'
  },
  {
    sign: muraliSign,
    nameTamil: 'அ. முரளிதரன்',
    role: 'மாநில பொருளாளர்',
    roleEn: 'State Treasurer'
  }
];

function TricolorStrip() {
  return (
    <div style={{ display: 'flex', width: '100%', height: '5px' }}>
      <div style={{ flex: 1, background: '#FF9933', height: '5px' }} />
      <div style={{ flex: 1, background: '#FFFFFF', height: '5px', borderTop: '0.5px solid #DDD', borderBottom: '0.5px solid #DDD' }} />
      <div style={{ flex: 1, background: '#138808', height: '5px' }} />
    </div>
  );
}

function LogoFallback() {
  return (
    <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid #FF6B00', background: '#003366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFB347', fontWeight: 700, fontSize: '10px' }}>TIWTN</div>
  );
}

function CardFront({ member }) {
  const fields = [
    { label: 'Name', value: member.fullName || '-' },
    { label: 'D.O.B', value: member.dob || '-' },
    { label: 'Mobile', value: member.mobile || '-' },
    { label: 'District', value: member.pledgeDistrict || member.district || '-' },
    { label: 'Address', value: member.address || '-' },
    { label: 'Joined', value: member.joiningDate || member.joinDate || '-' },
  ];

  const fieldRow = (label, value, bg) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '24px',
      padding: '4px 8px',
      background: bg,
      borderBottom: '1px solid #E8EDF3'
    }}>
      <div style={{ width: '60px', flexShrink: 0, fontSize: '9px', fontWeight: '700', color: '#555', textAlign: 'left' }}>{label}</div>
      <div style={{ width: '15px', flexShrink: 0, fontSize: '9px', color: '#BBB', textAlign: 'center' }}>:</div>
      <div style={{ width: '125px', flexShrink: 0, fontSize: '10px', fontWeight: '800', color: '#003366', wordBreak: 'break-word', lineHeight: '1.25', textAlign: 'left' }}>{value}</div>
    </div>
  );

  return (
    <div id="id-card-front" style={{
      width: '240px',
      minHeight: '420px',
      height: 'auto',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      background: '#FFFFFF',
      borderRadius: '10px',
      border: '1px solid #CCCCCC',
      fontFamily: 'Catamaran, sans-serif',
      flexShrink: 0
    }}>
      {/* Left orange accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px', background: '#FF6B00', zIndex: 2 }} />

      {/* Top tricolor */}
      <div style={{ display: 'flex', height: '5px', flexShrink: 0 }}>
        <div style={{ flex: 1, background: '#FF9933' }} />
        <div style={{ flex: 1, background: '#FFFFFF', borderTop: '0.5px solid #DDD', borderBottom: '0.5px solid #DDD' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

      {/* Navy header */}
      <div style={{ background: '#003366', padding: '5px 8px 5px 13px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <img src={'/logo.png'} alt="TIWTN" style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #FF6B00', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
        <div>
          <div style={{ fontSize: '7.5px', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.3' }}>தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்</div>
          <div style={{ fontSize: '5.5px', color: '#B8C9E0', letterSpacing: '0.4px', marginTop: '1px' }}>WELDING PROFESSIONALS WELFARE ASSOCIATION</div>
        </div>
      </div>

      {/* Orange title bar */}
      <div style={{ background: '#FF6B00', textAlign: 'center', padding: '3px', fontSize: '7px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '1px', flexShrink: 0 }}>
        உறுப்பினர் அட்டை / MEMBER IDENTITY CARD
      </div>

      {/* ── PHOTO (Centered) ── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 5px', borderBottom: '1px solid #E0E0E0', background: '#FFFFFF' }}>
        {member.photoPreview ? (
          <img src={member.photoPreview} alt="Member"
            style={{ width: '65px', height: '78px', objectFit: 'cover', border: '1.5px solid #003366', borderRadius: '3px', display: 'block', margin: '0 auto' }} />
        ) : (
          <div style={{ width: '65px', height: '78px', border: '1.5px dashed #003366', borderRadius: '3px', background: '#F0F4F8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '7px', gap: '3px', margin: '0 auto' }}>
            <span style={{ fontSize: '16px' }}>👤</span>PHOTO
          </div>
        )}
      </div>

      {/* ── All 6 fields (full width) ── */}
      <div style={{ borderBottom: '1px solid #E0E0E0', flex: 1 }}>
        {fields.map((f, i) =>
          fieldRow(f.label, f.value, i % 2 === 0 ? '#FFFFFF' : '#F4F7FB')
        )}
      </div>

      {/* ── Member ID bar ── */}
      <div style={{ padding: '4px 8px 4px 13px', background: '#EBF0F8', borderBottom: '1px solid #D8E2EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '6px', color: '#888', marginBottom: '1px', letterSpacing: '0.3px' }}>உறுப்பினர் எண் / Member ID</div>
          <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: '9px', fontWeight: '700', color: '#003366', letterSpacing: '1px' }}>
            {member.memberId || 'TIWTN-2026-XXXXX'}
          </div>
        </div>
        <img src={'/logo.png'} alt="TIWTN" style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid #FF6B00', opacity: 0.75 }} onError={(e) => { e.target.style.display = 'none'; }} />
      </div>

      {/* ── Signature section ── */}
      <div style={{
        padding: '5px 6px 5px 11px',
        background: '#FAFAFA',
        borderTop: '1px solid #E0E0E0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexShrink: 0
      }}>
        {AUTHORITIES.map((auth, i) => (
          <div key={i} style={{ width: '32%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {/* Name */}
            <div style={{ fontSize: '6.5px', fontWeight: '800', color: '#003366', lineHeight: '1.3', wordBreak: 'keep-all', whiteSpace: 'normal' }}>{auth.nameTamil}</div>
            {/* Tamil role */}
            <div style={{ fontSize: '6px', color: '#444', lineHeight: '1.3' }}>{auth.role}</div>
            {/* English role */}
            <div style={{ fontSize: '5px', color: '#888', marginBottom: '4px' }}>{auth.roleEn}</div>
            {/* Signature image */}
            <img src={auth.sign} alt="" crossOrigin="anonymous"
              style={{ width: '66px', height: '24px', objectFit: 'contain', display: 'block', filter: 'brightness(0)', opacity: 1 }} />
            {/* Signature line */}
            <div style={{ width: '100%', borderTop: '1px solid #444', marginTop: '2px' }} />
          </div>
        ))}
      </div>

      {/* Bottom tricolor */}
      <div style={{ display: 'flex', height: '5px', width: '100%', flexShrink: 0 }}>
        <div style={{ flex: 1, background: '#FF9933' }} />
        <div style={{ flex: 1, background: '#FFFFFF', borderTop: '0.5px solid #DDD', borderBottom: '0.5px solid #DDD' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>
    </div>
  );
}

function CardBack({ member }) {
  return (
    <div id="id-card-back" style={{
      width: '240px',
      minHeight: '420px',
      height: 'auto',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      background: '#FFFFFF',
      borderRadius: '10px',
      border: '1px solid #CCCCCC',
      fontFamily: 'Catamaran, sans-serif',
      flexShrink: 0
    }}>
      {/* Left orange accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px', background: '#FF6B00', zIndex: 2 }} />

      {/* 1. Tricolor top */}
      <div style={{ display: 'flex', height: '5px', flexShrink: 0 }}>
        <div style={{ flex: 1, background: '#FF9933' }} />
        <div style={{ flex: 1, background: '#FFFFFF', borderTop: '0.5px solid #DDD', borderBottom: '0.5px solid #DDD' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

      {/* 2. Navy header — same as front */}
      <div style={{ background: '#003366', padding: '6px 8px 6px 13px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <img src={'/logo.png'} alt="TIWTN" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #FF6B00', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
        <div>
          <div style={{ fontSize: '8px', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.3' }}>தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்</div>
          <div style={{ fontSize: '6px', color: '#B8C9E0', letterSpacing: '0.5px', marginTop: '1px' }}>WELDING PROFESSIONALS WELFARE ASSOCIATION</div>
        </div>
      </div>

      {/* 3. Orange title bar */}
      <div style={{ background: '#FF6B00', textAlign: 'center', padding: '3px 0', fontSize: '7px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '1px', flexShrink: 0 }}></div>

      {/* 4. Content body */}
      <div style={{ minHeight: '285px', padding: '10px 8px 10px 13px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>

        {/* QR + address */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <svg width="60" height="60" viewBox="0 0 60 60" style={{ border: '1px solid #CCC', borderRadius: '3px', padding: '3px' }}>
              <rect x="2" y="2" width="16" height="16" fill="none" stroke="#003366" strokeWidth="2" />
              <rect x="6" y="6" width="8" height="8" fill="#003366" />
              <rect x="42" y="2" width="16" height="16" fill="none" stroke="#003366" strokeWidth="2" />
              <rect x="46" y="6" width="8" height="8" fill="#003366" />
              <rect x="2" y="42" width="16" height="16" fill="none" stroke="#003366" strokeWidth="2" />
              <rect x="6" y="46" width="8" height="8" fill="#003366" />
              <rect x="24" y="4" width="4" height="4" fill="#003366" />
              <rect x="30" y="4" width="4" height="4" fill="#003366" />
              <rect x="24" y="10" width="4" height="4" fill="#003366" />
              <rect x="4" y="24" width="4" height="4" fill="#003366" />
              <rect x="10" y="30" width="4" height="4" fill="#003366" />
              <rect x="24" y="24" width="4" height="4" fill="#003366" />
              <rect x="30" y="30" width="4" height="4" fill="#003366" />
              <rect x="36" y="24" width="4" height="4" fill="#003366" />
              <rect x="42" y="30" width="4" height="4" fill="#003366" />
              <rect x="48" y="24" width="4" height="4" fill="#003366" />
              <rect x="24" y="42" width="4" height="4" fill="#003366" />
              <rect x="30" y="48" width="4" height="4" fill="#003366" />
              <rect x="36" y="42" width="4" height="4" fill="#003366" />
            </svg>
            <div style={{ fontSize: '6px', color: '#888', marginTop: '2px' }}>Scan to verify</div>
          </div>
          <div>
            <div style={{ fontSize: '6px', color: '#888', letterSpacing: '0.5px', marginBottom: '3px' }}>அலுவல முகவரி / OFFICE ADDRESS</div>
            <div style={{ fontSize: '8px', fontWeight: '700', color: '#003366', lineHeight: '1.5' }}>
              தென்னிந்திய வெல்டிங்<br />
              தொழிலாளர்கள் நலச்சங்கம்<br />
              133/34, 1A, 1A பெங்களூர்<br />
              ஹைவே, சென்னை – 600124,<br />
              தமிழ்நாடு.
            </div>
          </div>
        </div>

        {/* Nominee + blood row */}
        <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #E0E0E0', paddingTop: '8px' }}>
          <div>
            <div style={{ fontSize: '6px', color: '#888' }}>வாரிசுதாரர் / NOMINEE</div>
            <div style={{ fontSize: '9px', fontWeight: '800', color: '#003366' }}>{member.nomineeName || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '6px', color: '#888' }}>இரத்த பிரிவு / BLOOD</div>
            <div style={{ fontSize: '9px', fontWeight: '800', color: '#003366' }}>{member.bloodGroup || '-'}</div>
          </div>
        </div>

        {/* Aadhaar */}
        <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: '8px' }}>
          <div style={{ fontSize: '6px', color: '#888', marginBottom: '2px' }}>ஆதார் எண் / AADHAAR</div>
          <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: '10px', fontWeight: '700', color: '#003366', letterSpacing: '1px' }}>{member.aadhaar || '-'}</div>
        </div>

        {/* Disclaimer */}
        <div style={{ padding: '8px', background: '#FFF8F0', border: '1px solid #FFB347', borderRadius: '5px' }}>
          <div style={{ fontSize: '8px', color: '#333', lineHeight: '1.6' }}>
            இந்த அட்டை சங்கத்தின் சொத்து.<br />
            தொலைந்தால் திருப்பித் தரவும்.
          </div>
          <div style={{ fontSize: '7px', color: '#666', marginTop: '3px' }}>
            If found, please return to the above address.
          </div>
        </div>

        {/* Watermark */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.04, pointerEvents: 'none', zIndex: 0 }}>
          <img src={'/logo.png'} alt="watermark" style={{ width: '160px', height: '160px' }} />
        </div>

      </div>

      {/* 5. Tricolor bottom — flow, last child */}
      <div style={{ display: 'flex', height: '5px', width: '100%', marginTop: 'auto', flexShrink: 0 }}>
        <div style={{ flex: 1, background: '#FF9933' }} />
        <div style={{ flex: 1, background: '#FFFFFF', borderTop: '0.5px solid #DDD', borderBottom: '0.5px solid #DDD' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>
    </div>
  );
}

function IDCard({ member, onReset }) {
  const frontRef = useRef(null);
  const backRef = useRef(null);

  const downloadOpts = {
    scale: 4,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#FFFFFF',
    logging: false,
    onclone: (doc) => {
      doc.querySelectorAll('[id^="id-card"]').forEach(el => {
        el.style.transform = 'none';
        el.style.backdropFilter = 'none';
        el.style.opacity = '1';
      });
    },
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const preloadImages = async (sources) => {
    await Promise.all(
      sources.map((src) =>
        new Promise((res, rej) => {
          const img = new Image();
          img.onload = res;
          img.onerror = rej;
          img.crossOrigin = 'anonymous';
          img.src = src;
        })
      )
    );
  };

  const downloadCard = async () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position:fixed;
      left:-99999px;
      top:0;
      width:240px;
      z-index:-999;
      pointer-events:none;
      background:#FFFFFF;
    `;
    document.body.appendChild(wrap);

    const src = document.getElementById('id-card-front');
    const clone = src.cloneNode(true);
    clone.id = 'dl-front-clone';
    clone.style.cssText = `
      width:240px;
      height:auto;
      min-height:0;
      max-height:none;
      overflow:visible;
      transform:none;
      position:relative;
      opacity:1;
      display:flex;
      flex-direction:column;
      background:#FFFFFF;
      border-radius:10px;
      font-family:Catamaran,sans-serif;
    `;
    clone.querySelectorAll('*').forEach(el => {
      el.style.transform = 'none';
      el.style.backdropFilter = 'none';
      el.style.webkitBackdropFilter = 'none';
    });
    clone.querySelectorAll('img').forEach(img => {
      img.style.opacity = '1';
      img.style.visibility = 'visible';
      img.crossOrigin = 'anonymous';
    });
    wrap.appendChild(clone);

    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 600));

    // Measure natural height, then lock it so html2canvas sees exactly this
    const cardH = Math.max(Math.ceil(clone.getBoundingClientRect().height || clone.scrollHeight), 420);
    clone.style.height = cardH + 'px';
    clone.style.overflow = 'hidden';
    await new Promise(r => setTimeout(r, 50));

    const canvas = await html2canvas(clone, {
      scale: 4,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      width: 240,
      height: cardH,
      windowWidth: 1200,
      windowHeight: 3000
    });

    document.body.removeChild(wrap);

    const link = document.createElement('a');
    link.download = `TIWTN_${member.fullName}_IDCard.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadBoth = async () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position:fixed;
      left:-99999px;
      top:0;
      width:280px;
      z-index:-999;
      pointer-events:none;
      background:#F5F5F5;
      display:flex;
      flex-direction:column;
      gap:20px;
      padding:20px;
    `;
    document.body.appendChild(wrap);

    const cloneCard = (id) => {
      const src = document.getElementById(id);
      const clone = src.cloneNode(true);
      clone.id = id + '-clone';
      clone.style.cssText = `
        width:240px;
        height:auto;
        min-height:0;
        max-height:none;
        overflow:visible;
        transform:none;
        position:relative;
        opacity:1;
        display:flex;
        flex-direction:column;
        background:#FFFFFF;
        border-radius:10px;
        font-family:Catamaran,sans-serif;
      `;
      clone.querySelectorAll('*').forEach(el => {
        el.style.transform = 'none';
        el.style.backdropFilter = 'none';
        el.style.webkitBackdropFilter = 'none';
      });
      clone.querySelectorAll('img').forEach(img => {
        img.style.opacity = '1';
        img.crossOrigin = 'anonymous';
      });
      return clone;
    };

    const frontClone = cloneCard('id-card-front');
    const backClone = cloneCard('id-card-back');
    wrap.appendChild(frontClone);
    wrap.appendChild(backClone);

    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 600));

    // ── KEY FIX ──────────────────────────────────────────────────────
    // Measure the FRONT card's natural height — it is always the reference.
    // Then FORCE BOTH clones to that exact pixel height before capture.
    // html2canvas must receive the same `height` for both calls so both
    // canvases are exactly the same pixel size. No post-capture normalization needed.
    const cardH = Math.max(
      Math.ceil(frontClone.getBoundingClientRect().height || frontClone.scrollHeight),
      420
    );

    frontClone.style.height = cardH + 'px';
    frontClone.style.overflow = 'hidden';
    backClone.style.height = cardH + 'px';
    backClone.style.overflow = 'hidden';

    // One frame for layout to settle after forcing heights
    await new Promise(r => setTimeout(r, 80));

    const captureOpts = {
      scale: 4,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      width: 240,
      height: cardH,          // ← same value for BOTH
      windowWidth: 1200,
      windowHeight: 3000
    };

    const frontCanvas = await html2canvas(frontClone, captureOpts);
    const backCanvas = await html2canvas(backClone, captureOpts);

    document.body.removeChild(wrap);

    // Both canvases are now guaranteed identical size — combine directly
    const gap = 60;
    const cw = frontCanvas.width;   // 960 at scale:4
    const ch = frontCanvas.height;  // cardH × 4

    const combined = document.createElement('canvas');
    combined.width = cw;
    combined.height = ch + gap + ch;

    const ctx = combined.getContext('2d');
    ctx.fillStyle = '#DDDDDD';
    ctx.fillRect(0, 0, combined.width, combined.height);
    ctx.drawImage(frontCanvas, 0, 0);
    ctx.drawImage(backCanvas, 0, ch + gap);

    const link = document.createElement('a');
    link.download = `TIWTN_${member.fullName}_IDCard_BothSides.png`;
    link.href = combined.toDataURL('image/png', 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: '24px', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>முன்பக்கம் (Front)</p>
          <div ref={frontRef} className="id-card-display"><CardFront member={member} /></div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>பின்பக்கம் (Back)</p>
          <div ref={backRef} className="id-card-display"><CardBack member={member} /></div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
        <button type="button" onClick={downloadCard} style={{ height: '52px', padding: '0 28px', borderRadius: '12px', border: 'none', background: '#FF6B00', color: '#000000', fontSize: '14px', fontWeight: 600, cursor: 'pointer', minWidth: '200px' }}>
          அட்டை பதிவிறக்கு / Download Front
        </button>
        <button type="button" onClick={downloadBoth} style={{ height: '52px', padding: '0 28px', borderRadius: '12px', border: '1.5px solid #FF6B00', background: '#FFFFFF', color: '#FF6B00', fontSize: '14px', fontWeight: 600, cursor: 'pointer', minWidth: '220px' }}>
          இரு பக்கமும் பதிவிறக்கு / Download Both Sides
        </button>
        <button type="button" onClick={onReset} style={{ height: '52px', padding: '0 28px', borderRadius: '12px', border: '1.5px solid #CCCCCC', background: '#FFFFFF', color: '#003366', fontSize: '14px', fontWeight: 600, cursor: 'pointer', minWidth: '200px' }}>
          மேலும் ஒருவரை பதிவு / Register Another
        </button>
      </div>

      <style>{`
        @media (max-width: 1024px) { .id-card-display { transform: scale(0.85); transform-origin: top center; } }
        @media (max-width: 480px) { .id-card-display { transform: scale(0.45); transform-origin: top center; } }
      `}</style>
    </div>
  );
}

export default IDCard;
