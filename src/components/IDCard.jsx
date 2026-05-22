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
  const rows = [
    { label: 'Name', value: member.fullName || '-' },
    { label: 'D.O.B', value: member.dob || '-' },
    { label: 'Mobile', value: member.mobile || '-' },
    { label: 'District', value: member.pledgeDistrict || member.district || '-' },
    { label: 'Address', value: member.address || '-' },
    { label: 'Joined', value: member.joiningDate || member.joinDate || '-' },
  ];

  return (
    <div id="id-card-front" style={{
      width: '240px',
      height: '380px',
      background: '#FFFFFF',
      borderRadius: '10px',
      overflow: 'hidden',
      position: 'relative',
      border: '1px solid #CCCCCC',
      fontFamily: 'Catamaran, sans-serif',
      flexShrink: 0
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px', background: '#FF6B00', zIndex: 2 }} />

      <div style={{ display: 'flex', height: '5px' }}>
        <div style={{ flex: 1, background: '#FF9933' }} />
        <div style={{ flex: 1, background: '#FFFFFF', borderTop: '0.5px solid #DDD', borderBottom: '0.5px solid #DDD' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

      <div style={{ background: '#003366', padding: '6px 8px 6px 13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src={'/logo.png'} alt="TIWTN" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #FF6B00', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
        <div>
          <div style={{ fontSize: '8px', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.3' }}>தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்</div>
          <div style={{ fontSize: '6px', color: '#B8C9E0', letterSpacing: '0.5px', marginTop: '1px' }}>WELDING PROFESSIONALS WELFARE ASSOCIATION</div>
        </div>
      </div>

      <div style={{ background: '#FF6B00', textAlign: 'center', padding: '3px', fontSize: '7px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '1px' }}>உறுப்பினர் அட்டை / MEMBER IDENTITY CARD</div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '5px 0 4px', borderBottom: '1px solid #E0E0E0' }}>
        {member.photoPreview ? (
          <img src={member.photoPreview} alt="Member" style={{ width: '65px', height: '78px', objectFit: 'cover', border: '1.5px solid #003366', borderRadius: '2px' }} />
        ) : (
          <div style={{ width: '65px', height: '78px', borderRadius: '2px', border: '1.5px solid #003366', background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '8px' }}>PHOTO</div>
        )}
      </div>

      <div style={{ padding: '5px 8px 5px 13px', borderBottom: '1px solid #E0E0E0', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '2px' }}>
            <div style={{
              width: '55px',
              flexShrink: 0,
              fontSize: '7px',
              fontWeight: '700',
              color: '#555555',
              lineHeight: '1.3'
            }}>{row.label}</div>
            <div style={{ fontSize: '8px', color: '#333', fontWeight: '600', flexShrink: 0 }}>:</div>
            <div style={{ fontSize: '8px', fontWeight: '800', color: '#003366', flex: 1, wordBreak: 'break-word' }}>{row.value}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '4px 8px 4px 13px', background: '#F0F4F8', borderBottom: '1px solid #E0E0E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '6px', color: '#888', marginBottom: '1px' }}>உறுப்பினர் எண் / Member ID</div>
          <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: '9px', fontWeight: '700', color: '#003366', letterSpacing: '1px' }}>{member.memberId || 'TIWTN-2026-XXXXX'}</div>
        </div>
        <img src={'/logo.png'} alt="TIWTN" style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid #FF6B00', opacity: 0.8 }} onError={(e) => { e.target.style.display = 'none'; }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '6px 6px 4px 11px', background: '#FFFFFF' }}>
        {AUTHORITIES.map((auth, i) => (
          <div key={i} style={{ textAlign: 'center', width: '30%' }}>
            <div style={{ height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={auth.sign}
                alt=""
                crossOrigin="anonymous"
                style={{
                  maxWidth: '68px',
                  maxHeight: '32px',
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(0)',
                  opacity: 1
                }}
              />
            </div>
            <div style={{ borderTop: '1px solid #333', paddingTop: '2px' }}>
              <div style={{ fontSize: '8px', fontWeight: '800', color: '#003366' }}>{auth.nameTamil}</div>
              <div style={{ fontSize: '7px', color: '#555' }}>{auth.role}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', height: '5px' }}>
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
      width: `${CARD_W}px`,
      height: `${CARD_H}px`,
      background: '#FFFFFF',
      borderRadius: '10px',
      overflow: 'hidden',
      position: 'relative',
      border: '1px solid #CCCCCC',
      fontFamily: 'Catamaran, sans-serif',
      flexShrink: 0
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px', background: '#FF6B00', zIndex: 2 }} />

      <div style={{ display: 'flex', height: '5px' }}>
        <div style={{ flex: 1, background: '#FF9933' }} />
        <div style={{ flex: 1, background: '#FFFFFF', borderTop: '0.5px solid #DDD', borderBottom: '0.5px solid #DDD' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

      <div style={{ background: '#003366', padding: '6px 8px 6px 13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src={'/logo.png'} alt="TIWTN" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #FF6B00', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
        <div style={{ fontSize: '7px', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.3' }}>
          தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்
        </div>
      </div>

      <div style={{ padding: '10px 8px 10px 13px', borderBottom: '1px solid #E0E0E0', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
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

      <div style={{ padding: '8px 8px 8px 13px', display: 'flex', gap: '16px', borderBottom: '1px solid #E0E0E0' }}>
        <div>
          <div style={{ fontSize: '6px', color: '#888' }}>வாரிசுதாரர் / NOMINEE</div>
          <div style={{ fontSize: '9px', fontWeight: '800', color: '#003366' }}>{member.nomineeName || '-'}</div>
        </div>
        <div>
          <div style={{ fontSize: '6px', color: '#888' }}>இரத்த பிரிவு / BLOOD</div>
          <div style={{ fontSize: '9px', fontWeight: '800', color: '#003366' }}>{member.bloodGroup || '-'}</div>
        </div>
      </div>

      <div style={{ padding: '8px 8px 8px 13px', borderBottom: '1px solid #E0E0E0' }}>
        <div style={{ fontSize: '6px', color: '#888', marginBottom: '2px' }}>ஆதார் எண் / AADHAAR</div>
        <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: '10px', fontWeight: '700', color: '#003366', letterSpacing: '1px' }}>{member.aadhaar || '-'}</div>
      </div>

      <div style={{ margin: '8px 8px 8px 13px', padding: '8px', background: '#FFF8F0', border: '1px solid #FFB347', borderRadius: '5px' }}>
        <div style={{ fontSize: '8px', color: '#333', lineHeight: '1.6' }}>
          இந்த அட்டை சங்கத்தின் சொத்து.<br />
          தொலைந்தால் திருப்பித் தரவும்.
        </div>
        <div style={{ fontSize: '7px', color: '#666', marginTop: '3px' }}>
          If found, please return to the above address.
        </div>
      </div>

      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.04, pointerEvents: 'none', zIndex: 0 }}>
        <img src={'/logo.png'} alt="watermark" style={{ width: '160px', height: '160px' }} />
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', height: '5px' }}>
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

  const downloadFront = async () => {
    const originalCard = document.getElementById('id-card-front');
    if (!originalCard) return;

    const renderContainer = document.createElement('div');
    renderContainer.style.cssText = `
      position: fixed;
      top: -99999px;
      left: -99999px;
      width: 240px;
      height: auto;
      transform: none;
      zoom: 1;
      opacity: 1;
      pointer-events: none;
      z-index: -1;
    `;
    document.body.appendChild(renderContainer);

    const clone = originalCard.cloneNode(true);
    clone.id = 'id-card-front-clone';
    clone.style.cssText = `
      width: 240px;
      height: auto;
      min-height: 380px;
      transform: none;
      zoom: 1;
      overflow: visible;
      position: relative;
      opacity: 1;
      border-radius: 10px;
      font-family: Catamaran, sans-serif;
    `;

    clone.querySelectorAll('img').forEach(img => {
      img.style.opacity = '1';
      img.style.visibility = 'visible';
      try { img.crossOrigin = 'anonymous'; } catch (e) {}
    });

    clone.querySelectorAll('*').forEach(el => {
      el.style.transform = 'none';
      el.style.backdropFilter = 'none';
      el.style.webkitBackdropFilter = 'none';
    });

    renderContainer.appendChild(clone);
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const canvas = await html2canvas(clone, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        width: 240,
        height: clone.scrollHeight,
        windowWidth: 240,
        windowHeight: clone.scrollHeight,
        x: 0,
        y: 0,
      });
      const link = document.createElement('a');
      link.download = `TIWTN_${(member.fullName || 'member').replace(/\s+/g, '_')}_IDCard.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
    } finally {
      document.body.removeChild(renderContainer);
    }
  };

  const downloadBoth = async () => {
    const originalFront = document.getElementById('id-card-front');
    const originalBack = document.getElementById('id-card-back');
    if (!originalFront || !originalBack) return;

    const renderContainer = document.createElement('div');
    renderContainer.style.cssText = `
      position: fixed;
      top: -99999px;
      left: -99999px;
      width: 240px;
      transform: none;
      zoom: 1;
      pointer-events: none;
      z-index: -1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    `;
    document.body.appendChild(renderContainer);

    const cloneCard = (original, newId) => {
      const clone = original.cloneNode(true);
      clone.id = newId;
      clone.style.cssText = `
        width: 240px;
        height: auto;
        min-height: 380px;
        transform: none;
        zoom: 1;
        overflow: visible;
        position: relative;
        opacity: 1;
        border-radius: 10px;
      `;
      clone.querySelectorAll('img').forEach(img => {
        img.style.opacity = '1';
        try { img.crossOrigin = 'anonymous'; } catch (e) {}
      });
      clone.querySelectorAll('*').forEach(el => {
        el.style.transform = 'none';
        el.style.backdropFilter = 'none';
      });
      return clone;
    };

    const frontClone = cloneCard(originalFront, 'front-clone');
    const backClone = cloneCard(originalBack, 'back-clone');
    renderContainer.appendChild(frontClone);
    renderContainer.appendChild(backClone);

    await new Promise((resolve) => setTimeout(resolve, 700));

    const opts = {
      scale: 4,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      windowWidth: 240,
    };

    try {
      const frontCanvas = await html2canvas(frontClone, {
        ...opts,
        width: 240,
        height: frontClone.scrollHeight,
      });
      const backCanvas = await html2canvas(backClone, {
        ...opts,
        width: 240,
        height: backClone.scrollHeight,
      });

      const gap = 30;
      const combined = document.createElement('canvas');
      combined.width = 960;
      combined.height = frontCanvas.height + gap * 4 + backCanvas.height;
      const ctx = combined.getContext('2d');
      ctx.fillStyle = '#EEEEEE';
      ctx.fillRect(0, 0, combined.width, combined.height);
      ctx.drawImage(frontCanvas, 0, 0);
      ctx.drawImage(backCanvas, 0, frontCanvas.height + gap * 4);

      const link = document.createElement('a');
      link.download = `TIWTN_${(member.fullName || 'member').replace(/\s+/g, '_')}_IDCard_BothSides.png`;
      link.href = combined.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
    } finally {
      document.body.removeChild(renderContainer);
    }
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
        <button type="button" onClick={downloadFront} style={{ height: '52px', padding: '0 28px', borderRadius: '12px', border: 'none', background: '#FF6B00', color: '#000000', fontSize: '14px', fontWeight: 600, cursor: 'pointer', minWidth: '200px' }}>
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
