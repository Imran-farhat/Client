import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

const CARD_W = 900;

function TricolorStrip() {
  return (
    <div style={{ display: 'flex', width: '100%', height: '8px' }}>
      <div style={{ flex: 1, background: '#FF9933', height: '8px' }} />
      <div style={{ flex: 1, background: '#FFFFFF', height: '8px', borderTop: '0.5px solid #DDD', borderBottom: '0.5px solid #DDD' }} />
      <div style={{ flex: 1, background: '#138808', height: '8px' }} />
    </div>
  );
}

function LogoFallback() {
  return (
    <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid #FF6B00', background: '#003366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFB347', fontWeight: 700, fontSize: '10px' }}>TIWTN</div>
  );
}

function CardFront({ member }) {
  return (
    <div id="id-card-front" style={{ width: `${CARD_W}px`, background: '#FFFFFF', borderRadius: '8px', border: '1px solid #CCCCCC', position: 'relative', overflow: 'hidden', fontFamily: "'Catamaran', 'Noto Sans Tamil', sans-serif", boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', background: '#FF6B00', zIndex: 2 }} />

      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <span key={i} style={{ position: 'absolute', fontSize: '52px', fontWeight: 900, color: 'rgba(0,51,102,0.05)', transform: 'rotate(-30deg)', whiteSpace: 'nowrap', userSelect: 'none', top: `${-50 + (i % 5) * 130}px`, left: `${-80 + Math.floor(i / 5) * 340}px` }}>TIWTN</span>
        ))}
      </div>

      <TricolorStrip />

      <div style={{ position: 'relative', zIndex: 1, padding: '16px 20px 12px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #E0E0E0' }}>
        <img src="/logo.png" width="64" height="64" style={{ borderRadius: '50%', border: '2px solid #FF6B00', objectFit: 'cover', minWidth: '64px' }} onError={(e) => { e.target.style.display = 'none'; }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#003366', lineHeight: 1.2, margin: 0 }}>தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்</p>
          <p style={{ fontSize: '12px', color: '#666666', fontWeight: 400, margin: '2px 0' }}>WELDING PROFESSIONALS WELFARE ASSOCIATION</p>
          <p style={{ fontSize: '11px', color: '#FF6B00', letterSpacing: '1px', fontWeight: 600, margin: 0, textTransform: 'uppercase' }}>உறுப்பினர் அட்டை / MEMBER IDENTITY CARD</p>
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', gap: '20px' }}>
        <div style={{ width: '160px', minWidth: '160px', flexShrink: 0 }}>
          {member.photoPreview ? (
            <img src={member.photoPreview} alt="Member" style={{ width: '160px', height: '190px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #003366' }} />
          ) : (
            <div style={{ width: '160px', height: '190px', borderRadius: '4px', border: '2px solid #003366', background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '12px' }}>PHOTO</div>
          )}
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', alignContent: 'start' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 400, display: 'block', marginBottom: '2px' }}>பெயர் / NAME</span>
            <span style={{ fontSize: '15px', color: '#003366', fontWeight: 700, display: 'block' }}>{member.fullName}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 400, display: 'block', marginBottom: '2px' }}>பிறந்த தேதி / DOB</span>
            <span style={{ fontSize: '15px', color: '#003366', fontWeight: 700, display: 'block' }}>{member.dob}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 400, display: 'block', marginBottom: '2px' }}>இரத்த பிரிவு / BLOOD</span>
            <span style={{ fontSize: '15px', color: '#003366', fontWeight: 700, display: 'block' }}>{member.bloodGroup}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 400, display: 'block', marginBottom: '2px' }}>கைபேசி / MOBILE</span>
            <span style={{ fontSize: '15px', color: '#003366', fontWeight: 700, display: 'block' }}>{member.mobile}</span>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 400, display: 'block', marginBottom: '2px' }}>முகவரி / ADDRESS</span>
            <span style={{ fontSize: '14px', color: '#003366', fontWeight: 600, display: 'block' }}>{member.address.split('\n')[0] || member.address}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 400, display: 'block', marginBottom: '2px' }}>மாவட்டம் / DISTRICT</span>
            <span style={{ fontSize: '14px', color: '#003366', fontWeight: 600, display: 'block' }}>{member.pledgeDistrict}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 400, display: 'block', marginBottom: '2px' }}>JOINED DATE</span>
            <span style={{ fontSize: '14px', color: '#003366', fontWeight: 600, display: 'block' }}>{member.joiningDate}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 20px', borderTop: '1px solid #E0E0E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>உறுப்பினர் எண்</span>
          <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: '18px', fontWeight: 700, color: '#003366', letterSpacing: '2px' }}>{member.memberId}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '140px', borderTop: '1px solid #333', paddingTop: '4px' }} />
            <span style={{ fontSize: '11px', color: '#888', display: 'block', marginTop: '2px' }}>கையொப்பம்</span>
            <span style={{ fontSize: '10px', color: '#666', display: 'block' }}>அங்கீகரிக்கப்பட்டது / AUTHORIZED</span>
          </div>
          <img src="/logo.png" width="36" height="36" style={{ borderRadius: '50%', border: '1px solid #FF6B00', opacity: 0.9, objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      </div>

      <TricolorStrip />
    </div>
  );
}

function CardBack({ member }) {
  return (
    <div id="id-card-back" style={{ width: `${CARD_W}px`, background: '#FFFFFF', borderRadius: '8px', border: '1px solid #CCCCCC', position: 'relative', overflow: 'hidden', fontFamily: "'Catamaran', 'Noto Sans Tamil', sans-serif", boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', background: '#FF6B00', zIndex: 2 }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.05, zIndex: 0, pointerEvents: 'none' }}>
        <img src="/logo.png" width="180" height="180" style={{ borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
      </div>

      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <span key={i} style={{ position: 'absolute', fontSize: '52px', fontWeight: 900, color: 'rgba(0,51,102,0.05)', transform: 'rotate(-30deg)', whiteSpace: 'nowrap', userSelect: 'none', top: `${-50 + (i % 5) * 130}px`, left: `${-80 + Math.floor(i / 5) * 340}px` }}>TIWTN</span>
        ))}
      </div>

      <TricolorStrip />

      <div style={{ position: 'relative', zIndex: 1, padding: '20px 20px 20px 26px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ textAlign: 'center' }}>
            <svg width="78" height="78" viewBox="0 0 78 78" style={{ border: '1px solid #CCCCCC', borderRadius: '4px', padding: '6px', background: '#FFFFFF' }}>
              <rect x="2" y="2" width="18" height="18" fill="#003366" rx="2" />
              <rect x="6" y="6" width="10" height="10" fill="#FFFFFF" rx="1" />
              <rect x="58" y="2" width="18" height="18" fill="#003366" rx="2" />
              <rect x="62" y="6" width="10" height="10" fill="#FFFFFF" rx="1" />
              <rect x="2" y="58" width="18" height="18" fill="#003366" rx="2" />
              <rect x="6" y="62" width="10" height="10" fill="#FFFFFF" rx="1" />
              {[12,20,28,36,44,52,60].flatMap(x => [12,20,28,36,44,52,60].map(y => [x,y])).filter((_,i) => i % 3 === 0).map(([x,y],i) => (
                <rect key={i} x={x} y={y} width="4" height="4" fill="#003366" rx="0.5" />
              ))}
            </svg>
            <p style={{ fontSize: '9px', color: '#888', textAlign: 'center', marginTop: '4px' }}>Scan to verify</p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '10px', color: '#888', letterSpacing: '0.5px', marginBottom: '6px', textTransform: 'uppercase' }}>அலுவல முகவரி / OFFICE ADDRESS</p>
            <p style={{ fontSize: '13px', color: '#003366', fontWeight: 600, lineHeight: 1.7, margin: 0 }}>
              தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்<br />
              133/34, 1A, 1A பெங்களூர் ஹைவே,<br />
              சென்னை – 600124, தமிழ்நாடு.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '40px', marginTop: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 400, display: 'block', marginBottom: '2px' }}>வாரிசுதாரர் / NOMINEE</span>
            <span style={{ fontSize: '15px', color: '#003366', fontWeight: 700, display: 'block' }}>{member.nomineeName || '-'}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 400, display: 'block', marginBottom: '2px' }}>இரத்த பிரிவு / BLOOD GROUP</span>
            <span style={{ fontSize: '15px', color: '#003366', fontWeight: 700, display: 'block' }}>{member.bloodGroup}</span>
          </div>
        </div>

        <div style={{ marginTop: '16px', padding: '10px 14px', background: '#FFF8F0', border: '1px solid #FFB347', borderRadius: '6px' }}>
          <p style={{ fontSize: '12px', color: '#333', lineHeight: 1.7, margin: 0 }}>இந்த அட்டை சங்கத்தின் சொத்து. தொலைந்தால் திருப்பித் தரவும்.</p>
          <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0' }}>If found, please return to the above address.</p>
        </div>
      </div>

      <TricolorStrip />
    </div>
  );
}

function IDCard({ member, onReset }) {
  const frontRef = useRef(null);
  const backRef = useRef(null);

  const downloadOpts = {
    scale: 2.5,
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

  const downloadFront = async () => {
    const el = document.getElementById('id-card-front');
    if (!el) return;
    el.style.transform = 'none';
    el.style.backdropFilter = 'none';
    try {
      const canvas = await html2canvas(el, { ...downloadOpts, onclone: (doc) => {
        const cloned = doc.getElementById('id-card-front');
        if (cloned) {
          cloned.style.transform = 'none';
          cloned.style.backdropFilter = 'none';
          cloned.style.opacity = '1';
          cloned.querySelectorAll('*').forEach(c => { c.style.webkitPrintColorAdjust = 'exact'; });
        }
      }});
      const link = document.createElement('a');
      link.download = `TIWTN_${member.fullName.replace(/\s+/g, '_')}_IDCard.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) { console.error(e); }
    el.style.transform = '';
    el.style.backdropFilter = '';
  };

  const downloadBoth = async () => {
    const frontEl = document.getElementById('id-card-front');
    const backEl = document.getElementById('id-card-back');
    if (!frontEl || !backEl) return;

    const opts = { scale: 2.5, useCORS: true, allowTaint: true, backgroundColor: '#FFFFFF', logging: false };
    try {
      const frontCanvas = await html2canvas(frontEl, opts);
      const backCanvas = await html2canvas(backEl, opts);

      const combined = document.createElement('canvas');
      combined.width = Math.max(frontCanvas.width, backCanvas.width);
      combined.height = frontCanvas.height + backCanvas.height + 40;
      const ctx = combined.getContext('2d');
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(0, 0, combined.width, combined.height);
      ctx.drawImage(frontCanvas, 0, 0);
      ctx.drawImage(backCanvas, 0, frontCanvas.height + 40);

      const link = document.createElement('a');
      link.download = `TIWTN_${member.fullName.replace(/\s+/g, '_')}_IDCard_BothSides.png`;
      link.href = combined.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', width: '100%' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>முன்பக்கம் (Front)</p>
          <div ref={frontRef} className="id-card-display"><CardFront member={member} /></div>
        </div>
        <div style={{ textAlign: 'center', width: '100%' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>பின்பக்கம் (Back)</p>
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
