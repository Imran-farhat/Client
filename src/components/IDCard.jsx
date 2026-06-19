import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import balajiSign from '../assets/balaji_clean.png';
import idhreesSign from '../assets/idhrees_clean.png';
import muraliSign from '../assets/murali_clean.png';

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

function CardFront({ member }) {
  const fields = [
    { label: 'Name',     value: member.fullName || '-' },
    { label: 'Posting',  value: member.posting  || '-' },
    { label: 'D.O.B',   value: member.dob       || '-' },
    { label: 'District', value: member.pledgeDistrict || member.district || '-' },
    { label: 'Address',  value: member.address   || '-' },
    { label: 'Phone No', value: member.mobile    || '-' },
  ];

  const fieldRow = (label, value, bg) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      minHeight: '23px',
      padding: '4px 10px',
      background: bg,
      borderBottom: '0.5px solid #E8EDF3',
      boxSizing: 'border-box'
    }}>
      <div style={{ width: '65px', flexShrink: 0, fontSize: '10px', fontWeight: '700', color: '#555', textAlign: 'left' }}>{label}</div>
      <div style={{ width: '12px', flexShrink: 0, fontSize: '10px', color: '#BBB', textAlign: 'center' }}>:</div>
      <div style={{ flex: 1, fontSize: '10.5px', fontWeight: '800', color: '#003366', wordBreak: 'break-word', lineHeight: '1.2', textAlign: 'left' }}>{value}</div>
    </div>
  );

  return (
    <div id="id-card-front" style={{
      width: '320px',
      height: '480px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      background: '#FFFFFF',
      borderRadius: '8px',
      borderLeft: '4px solid #FF6B00',
      borderRight: '1px solid #CCCCCC',
      borderTop: '1px solid #CCCCCC',
      borderBottom: '1px solid #CCCCCC',
      fontFamily: 'Catamaran, sans-serif',
      flexShrink: 0,
      boxSizing: 'border-box'
    }}>
      {/* Top tricolor */}
      <div style={{ display: 'flex', height: '4px', flexShrink: 0 }}>
        <div style={{ flex: 1, background: '#FF9933' }} />
        <div style={{ flex: 1, background: '#FFFFFF', borderTop: '0.5px solid #DDD', borderBottom: '0.5px solid #DDD' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

      {/* Navy header */}
      <div style={{ background: '#003366', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <img src={'/logo.png'} alt="TIWTN" style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1.5px solid #FF6B00', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.25' }}>தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்</div>
          <div style={{ fontSize: '7px', color: '#B8C9E0', letterSpacing: '0.3px', marginTop: '1px' }}>WELDING PROFESSIONALS WELFARE ASSOCIATION</div>
        </div>
      </div>

      {/* Orange title bar */}
      <div style={{ background: '#FF6B00', textAlign: 'center', padding: '4px 0', fontSize: '8px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '1px', flexShrink: 0 }}>
        உறுப்பினர் அட்டை / MEMBER IDENTITY CARD
      </div>

      {/* ── PHOTO (Centered with fix for html2canvas stretch) ── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0', borderBottom: '1px solid #E0E0E0', background: '#FFFFFF', flexShrink: 0 }}>
        {member.photoPreview ? (
          <div style={{
            width: '70px',
            height: '84px',
            backgroundImage: `url(${member.photoPreview})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1.5px solid #003366',
            borderRadius: '3px',
            display: 'block',
            margin: '0 auto'
          }} />
        ) : (
          <div style={{ width: '70px', height: '84px', border: '1.5px dashed #003366', borderRadius: '3px', background: '#F0F4F8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '8px', gap: '3px', margin: '0 auto' }}>
            <span style={{ fontSize: '16px' }}>👤</span>PHOTO
          </div>
        )}
      </div>

      {/* ── All 6 fields (full width) ── */}
      <div style={{ borderBottom: '0.5px solid #E0E0E0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {fields.map((f, i) =>
          fieldRow(f.label, f.value, i % 2 === 0 ? '#FFFFFF' : '#F4F7FB')
        )}
      </div>

      {/* ── Member ID bar ── */}
      <div style={{ padding: '5px 10px', background: '#EBF0F8', borderBottom: '0.5px solid #D8E2EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '7.5px', color: '#888', marginBottom: '2px', letterSpacing: '0.2px' }}>உறுப்பினர் எண் / Member ID</div>
          <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: '10.5px', fontWeight: '700', color: '#003366', letterSpacing: '0.5px' }}>
            {member.memberId || 'TIWTN-2026-XXXXX'}
          </div>
        </div>
        <img src={'/logo.png'} alt="TIWTN" style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid #FF6B00', opacity: 0.75 }} onError={(e) => { e.target.style.display = 'none'; }} />
      </div>

      {/* ── Signature section ── */}
      <div style={{
        padding: '5px 8px 6px 8px',
        background: '#FAFAFA',
        borderTop: '0.5px solid #E0E0E0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexShrink: 0
      }}>
        {AUTHORITIES.map((auth, i) => (
          <div key={i} style={{ width: '32%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <img
              src={auth.sign}
              alt={auth.nameTamil}
              crossOrigin="anonymous"
              style={{
                width: '65px',
                height: '26px',
                objectFit: 'contain',
                objectPosition: 'center bottom',
                display: 'block',
                mixBlendMode: 'multiply',
              }}
            />
            <div style={{ width: '100%', borderTop: '0.5px solid #333', marginBottom: '2px' }} />
            <div style={{ fontSize: '8px', fontWeight: '800', color: '#003366', lineHeight: '1.2' }}>{auth.nameTamil}</div>
            <div style={{ fontSize: '7px', color: '#444', lineHeight: '1.2' }}>{auth.role}</div>
            <div style={{ fontSize: '6.5px', color: '#888', lineHeight: '1.2' }}>{auth.roleEn}</div>
          </div>
        ))}
      </div>

      {/* Bottom tricolor */}
      <div style={{ display: 'flex', height: '4px', width: '100%', flexShrink: 0 }}>
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
      width: '320px',
      height: '480px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      background: '#FFFFFF',
      borderRadius: '8px',
      borderLeft: '4px solid #FF6B00',
      borderRight: '1px solid #CCCCCC',
      borderTop: '1px solid #CCCCCC',
      borderBottom: '1px solid #CCCCCC',
      fontFamily: 'Catamaran, sans-serif',
      flexShrink: 0,
      boxSizing: 'border-box'
    }}>
      {/* 1. Tricolor top */}
      <div style={{ display: 'flex', height: '4px', flexShrink: 0 }}>
        <div style={{ flex: 1, background: '#FF9933' }} />
        <div style={{ flex: 1, background: '#FFFFFF', borderTop: '0.5px solid #DDD', borderBottom: '0.5px solid #DDD' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

      {/* 2. Navy header — same as front */}
      <div style={{ background: '#003366', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <img src={'/logo.png'} alt="TIWTN" style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1.5px solid #FF6B00', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.25' }}>தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்</div>
          <div style={{ fontSize: '7px', color: '#B8C9E0', letterSpacing: '0.3px', marginTop: '1px' }}>WELDING PROFESSIONALS WELFARE ASSOCIATION</div>
        </div>
      </div>

      {/* 3. Orange title bar spacer */}
      <div style={{ background: '#FF6B00', textAlign: 'center', padding: '1.5px 0', fontSize: '7px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '1px', flexShrink: 0 }}></div>

      {/* 4. Content body */}
      <div style={{ padding: '8px 8px 8px 12px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', position: 'relative' }}>

        {/* Office address */}
        <div style={{
          padding: '4px 0 6px',
          borderBottom: '0.5px solid #E0E0E0'
        }}>
          <div style={{
            fontSize: '8px', color: '#888',
            letterSpacing: '0.4px', marginBottom: '3px',
            textTransform: 'uppercase'
          }}>அலுவல முகவரி / OFFICE ADDRESS</div>
          <div style={{
            fontSize: '10.5px', fontWeight: '700',
            color: '#003366', lineHeight: '1.4'
          }}>
            தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்<br/>
            133/34, 1A, 1A பெங்களூர் ஹைவே,<br/>
            சென்னை – 600124, தமிழ்நாடு.
          </div>
        </div>

        {/* Joined date */}
        <div style={{ borderBottom: '0.5px solid #E0E0E0', padding: '5px 0' }}>
          <div style={{ fontSize: '7.5px', color: '#888', marginBottom: '2.5px' }}>இணைந்த தேதி / DATE OF JOINED</div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#003366' }}>{member.joiningDate || member.joinDate || '-'}</div>
        </div>

        {/* Nominee + blood row */}
        <div style={{ display: 'flex', gap: '16px', borderBottom: '0.5px solid #E0E0E0', padding: '5px 0' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '7.5px', color: '#888' }}>வாரிசுதாரர் / NOMINEE</div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#003366', wordBreak: 'break-word' }}>{member.nomineeName || '-'}</div>
          </div>
          <div style={{ width: '80px', flexShrink: 0 }}>
            <div style={{ fontSize: '7.5px', color: '#888' }}>இரத்த பிரிவு / BLOOD</div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#003366' }}>{member.bloodGroup || '-'}</div>
          </div>
        </div>

        {/* Aadhaar */}
        <div style={{ borderBottom: '0.5px solid #E0E0E0', padding: '5px 0' }}>
          <div style={{ fontSize: '7.5px', color: '#888', marginBottom: '2.5px' }}>ஆதார் எண் / AADHAAR</div>
          <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: '11px', fontWeight: '700', color: '#003366', letterSpacing: '0.5px' }}>{member.aadhaar || '-'}</div>
        </div>

        {/* Contact Numbers */}
        <div style={{ borderBottom: '0.5px solid #E0E0E0', padding: '5px 0' }}>
          <div style={{ fontSize: '7.5px', color: '#888', marginBottom: '2.5px' }}>தொடர்பு எண் / CONTACT NO</div>
          <div style={{ fontSize: '10px', fontWeight: '800', color: '#003366', lineHeight: '1.3' }}>
            +91 98765 43210, +91 86085 08342, +91 97861 11700
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ margin: '6px 0 2px', padding: '6px 10px', background: '#FFF8F0', border: '0.5px solid #FFB347', borderRadius: '5px', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '8.5px', color: '#333', lineHeight: '1.3' }}>
            இந்த அட்டை சங்கத்தின் சொத்து. தொலைந்தால் திருப்பித் தரவும்.
          </div>
          <div style={{ fontSize: '7.5px', color: '#666', marginTop: '2px', lineHeight: '1.2' }}>
            If found, please return to the above address.
          </div>
        </div>

        {/* Watermark */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.04, pointerEvents: 'none', zIndex: 0 }}>
          <img src={'/logo.png'} alt="watermark" style={{ width: '130px', height: '130px' }} />
        </div>

      </div>

      {/* 5. Tricolor bottom — flow, last child */}
      <div style={{ display: 'flex', height: '4px', width: '100%', marginTop: 'auto', flexShrink: 0 }}>
        <div style={{ flex: 1, background: '#FF9933' }} />
        <div style={{ flex: 1, background: '#FFFFFF', borderTop: '0.5px solid #DDD', borderBottom: '0.5px solid #DDD' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>
    </div>
  );
}

function IDCard({ member, onReset, showReset = true }) {
  const frontRef = useRef(null);
  const backRef = useRef(null);

  const downloadCard = async () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position:fixed;
      left:-99999px;
      top:0;
      width:320px;
      z-index:-999;
      pointer-events:none;
      background:#FFFFFF;
    `;
    document.body.appendChild(wrap);

    const src = document.getElementById('id-card-front');
    const clone = src.cloneNode(true);
    clone.id = 'dl-front-clone';
    clone.style.cssText = `
      width:320px;
      height:480px;
      box-sizing:border-box;
      overflow:hidden;
      transform:none;
      position:relative;
      opacity:1;
      display:flex;
      flex-direction:column;
      background:#FFFFFF;
      border-radius:8px;
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

    const canvas = await html2canvas(clone, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      width: 320,
      height: 480,
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
      width:700px;
      z-index:-999;
      pointer-events:none;
      background:#FFFFFF;
      display:flex;
      flex-direction:row;
      gap:20px;
      padding:20px;
    `;
    document.body.appendChild(wrap);

    const cloneCard = (id) => {
      const src = document.getElementById(id);
      const clone = src.cloneNode(true);
      clone.id = id + '-clone';
      clone.style.cssText = `
        width: 320px;
        height: 480px;
        box-sizing: border-box;
        overflow: hidden;
        transform: none;
        position: relative;
        opacity: 1;
        display: flex;
        flex-direction: column;
        background: #FFFFFF;
        border-radius: 8px;
        font-family: Catamaran, sans-serif;
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

    const cardW = 320;
    const cardH = 480;

    const captureOpts = {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      width: cardW,
      height: cardH,
      windowWidth: 1200,
      windowHeight: 3000
    };

    const frontCanvas = await html2canvas(frontClone, captureOpts);
    const backCanvas = await html2canvas(backClone, captureOpts);

    document.body.removeChild(wrap);

    // Both canvases are now guaranteed identical size — combine side-by-side
    const gap = 60; // pixel gap at scale 3
    const cw = frontCanvas.width;
    const ch = frontCanvas.height;

    const combined = document.createElement('canvas');
    combined.width = cw + gap + cw;
    combined.height = ch;

    const ctx = combined.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, combined.width, combined.height);
    ctx.drawImage(frontCanvas, 0, 0);
    ctx.drawImage(backCanvas, cw + gap, 0);

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
        {showReset && (
          <button type="button" onClick={onReset} style={{ height: '52px', padding: '0 28px', borderRadius: '12px', border: '1.5px solid #CCCCCC', background: '#FFFFFF', color: '#003366', fontSize: '14px', fontWeight: 600, cursor: 'pointer', minWidth: '200px' }}>
            மேலும் ஒருவரை பதிவு / Register Another
          </button>
        )}
      </div>

      <style>{`
        @media (max-width: 1024px) { .id-card-display { transform: scale(0.85); transform-origin: top center; } }
        @media (max-width: 480px) { .id-card-display { transform: scale(0.45); transform-origin: top center; } }
      `}</style>
    </div>
  );
}

export default IDCard;
