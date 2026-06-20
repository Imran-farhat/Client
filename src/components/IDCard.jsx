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

function DarkSignature({ src, alt, style }) {
  const [blackSign, setBlackSign] = useState(src);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          const a = data[i+3];
          
          // Calculate brightness of the pixel (0 to 255)
          const brightness = (r + g + b) / 3;
          if (brightness < 235 && a > 30) {
            // Convert blue ink to pure black
            data[i] = 0;
            data[i+1] = 0;
            data[i+2] = 0;
          } else {
            // Force light backgrounds to pure white so multiply hides them
            data[i] = 255;
            data[i+1] = 255;
            data[i+2] = 255;
            data[i+3] = 255;
          }
        }
        ctx.putImageData(imgData, 0, 0);
        setBlackSign(canvas.toDataURL());
      } catch (err) {
        console.error('Error processing signature:', err);
      }
    };
    img.src = src;
  }, [src]);

  return <img src={blackSign} alt={alt} style={style} crossOrigin="anonymous" />;
}

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
      <div style={{
        width: '65px',
        flexShrink: 0,
        fontSize: '9px',
        fontWeight: '700',
        color: '#444444',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        textAlign: 'left'
      }}>{label}</div>
      <div style={{ width: '12px', flexShrink: 0, fontSize: '10px', color: '#BBB', textAlign: 'center' }}>:</div>
      <div style={{
        flex: 1,
        fontSize: '10px',
        fontWeight: '900',
        color: '#000000',
        wordBreak: 'break-word',
        lineHeight: '1.3',
        textAlign: 'left'
      }}>{value}</div>
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
      color: '#000000',
      borderRadius: '8px',
      borderLeft: '7px solid #FF6600',
      borderRight: '1px solid #CCCCCC',
      borderTop: '1px solid #CCCCCC',
      borderBottom: '1px solid #CCCCCC',
      fontFamily: 'Catamaran, sans-serif',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      textRendering: 'optimizeLegibility',
      flexShrink: 0,
      boxSizing: 'border-box'
    }}>
      {/* Top tricolor */}
      <div style={{ display: 'flex', height: '7px', flexShrink: 0 }}>
        <div style={{ flex: 1, background: '#FF6600' }} />
        <div style={{ flex: 1, background: '#FFFFFF', borderTop: '0.5px solid #DDD', borderBottom: '0.5px solid #DDD' }} />
        <div style={{ flex: 1, background: '#008000' }} />
      </div>

      {/* Navy header */}
      <div style={{ background: '#003366', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <img src={'/logo.png'} alt="TIWTN" style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1.5px solid #FF6B00', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '10px', fontWeight: '900', color: '#FFFFFF', lineHeight: '1.25' }}>தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்</div>
          <div style={{ fontSize: '7px', fontWeight: '700', color: '#E0E0E0', letterSpacing: '0.3px', marginTop: '1px' }}>WELDING PROFESSIONALS WELFARE ASSOCIATION</div>
        </div>
      </div>

      {/* Orange title bar */}
      <div style={{ background: '#FF6B00', textAlign: 'center', padding: '4px 0', fontSize: '8px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '1px', flexShrink: 0 }}>
        உறுப்பினர் அட்டை / MEMBER IDENTITY CARD
      </div>

      {/* ── PHOTO (Cover-fit via direct fixed dimensions) ── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0', borderBottom: '1px solid #E0E0E0', background: '#FFFFFF', flexShrink: 0 }}>
        {member.photoPreview ? (
          <img
            src={member.photoPreview}
            alt="Member"
            data-member-photo="true"
            crossOrigin="anonymous"
            style={{
              width: '70px',
              height: '84px',
              objectFit: 'cover',
              objectPosition: 'center top',
              border: '1.5px solid #003366',
              borderRadius: '3px',
              display: 'block'
            }}
          />
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
          <div style={{
            fontSize: '9px',
            fontWeight: '700',
            color: '#444444',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '2px'
          }}>உறுப்பினர் எண் / Member ID</div>
          <div style={{
            fontFamily: 'Courier Prime, Courier New, monospace',
            fontSize: '11px',
            fontWeight: '900',
            color: '#000000',
            letterSpacing: '2px'
          }}>
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
            <DarkSignature
              src={auth.sign}
              alt={auth.nameTamil}
              style={{
                width: '65px',
                height: '26px',
                objectFit: 'contain',
                objectPosition: 'center bottom',
                display: 'block',
                mixBlendMode: 'multiply',
              }}
            />
            <div style={{ borderTop: '1.5px solid #000000', width: '100%', marginBottom: '2px' }} />
            <div style={{ fontSize: '8px', fontWeight: '900', color: '#000000', lineHeight: '1.2' }}>{auth.nameTamil}</div>
            <div style={{ fontSize: '7px', fontWeight: '700', color: '#222222', lineHeight: '1.2' }}>{auth.role}</div>
            <div style={{ fontSize: '7px', fontWeight: '700', color: '#222222', lineHeight: '1.2' }}>{auth.roleEn}</div>
          </div>
        ))}
      </div>

      {/* Bottom tricolor */}
      <div style={{ display: 'flex', height: '7px', width: '100%', flexShrink: 0 }}>
        <div style={{ flex: 1, background: '#FF6600' }} />
        <div style={{ flex: 1, background: '#FFFFFF', borderTop: '0.5px solid #DDD', borderBottom: '0.5px solid #DDD' }} />
        <div style={{ flex: 1, background: '#008000' }} />
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
      color: '#000000',
      borderRadius: '8px',
      borderLeft: '7px solid #FF6600',
      borderRight: '1px solid #CCCCCC',
      borderTop: '1px solid #CCCCCC',
      borderBottom: '1px solid #CCCCCC',
      fontFamily: 'Catamaran, sans-serif',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      textRendering: 'optimizeLegibility',
      flexShrink: 0,
      boxSizing: 'border-box'
    }}>
      {/* 1. Tricolor top */}
      <div style={{ display: 'flex', height: '7px', flexShrink: 0 }}>
        <div style={{ flex: 1, background: '#FF6600' }} />
        <div style={{ flex: 1, background: '#FFFFFF', borderTop: '0.5px solid #DDD', borderBottom: '0.5px solid #DDD' }} />
        <div style={{ flex: 1, background: '#008000' }} />
      </div>

      {/* 2. Navy header — same as front */}
      <div style={{ background: '#003366', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <img src={'/logo.png'} alt="TIWTN" style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1.5px solid #FF6B00', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '10px', fontWeight: '900', color: '#FFFFFF', lineHeight: '1.25' }}>தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்</div>
          <div style={{ fontSize: '7px', fontWeight: '700', color: '#E0E0E0', letterSpacing: '0.3px', marginTop: '1px' }}>WELDING PROFESSIONALS WELFARE ASSOCIATION</div>
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
            fontSize: '9px',
            fontWeight: '700',
            color: '#444444',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '3px'
          }}>அலுவல முகவரி / OFFICE ADDRESS</div>
          <div style={{
            fontSize: '10px',
            fontWeight: '900',
            color: '#000000',
            lineHeight: '1.3'
          }}>
            தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்<br/>
            133/34, 1A, 1A பெங்களூர் ஹைவே,<br/>
            சென்னை – 600124, தமிழ்நாடு.
          </div>
        </div>

        {/* Joined date */}
        <div style={{ borderBottom: '0.5px solid #E0E0E0', padding: '5px 0' }}>
          <div style={{
            fontSize: '9px',
            fontWeight: '700',
            color: '#444444',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '2.5px'
          }}>இணைந்த தேதி / DATE OF JOINED</div>
          <div style={{
            fontSize: '10px',
            fontWeight: '900',
            color: '#000000',
            lineHeight: '1.3'
          }}>{member.joiningDate || member.joinDate || '-'}</div>
        </div>

        {/* Nominee + blood row */}
        <div style={{ display: 'flex', gap: '16px', borderBottom: '0.5px solid #E0E0E0', padding: '5px 0' }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '9px',
              fontWeight: '700',
              color: '#444444',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>வாரிசுதாரர் / NOMINEE</div>
            <div style={{
              fontSize: '10px',
              fontWeight: '900',
              color: '#000000',
              lineHeight: '1.3',
              wordBreak: 'break-word'
            }}>{member.nomineeName || '-'}</div>
          </div>
          <div style={{ width: '80px', flexShrink: 0 }}>
            <div style={{
              fontSize: '9px',
              fontWeight: '700',
              color: '#444444',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>இரத்த பிரிவு / BLOOD</div>
            <div style={{
              fontSize: '10px',
              fontWeight: '900',
              color: '#000000',
              lineHeight: '1.3'
            }}>{member.bloodGroup || '-'}</div>
          </div>
        </div>

        {/* Aadhaar */}
        <div style={{ borderBottom: '0.5px solid #E0E0E0', padding: '5px 0' }}>
          <div style={{
            fontSize: '9px',
            fontWeight: '700',
            color: '#444444',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '2.5px'
          }}>ஆதார் எண் / AADHAAR</div>
          <div style={{
            fontFamily: 'Courier Prime, Courier New, monospace',
            fontSize: '11px',
            fontWeight: '900',
            color: '#000000',
            letterSpacing: '2px'
          }}>{member.aadhaar || member.aadhar || '-'}</div>
        </div>

        {/* Contact Numbers */}
        <div style={{ borderBottom: '0.5px solid #E0E0E0', padding: '5px 0' }}>
          <div style={{
            fontSize: '9px',
            fontWeight: '700',
            color: '#444444',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '2.5px'
          }}>தொடர்பு எண் / CONTACT NO</div>
          <div style={{
            fontSize: '10px',
            fontWeight: '900',
            color: '#000000',
            lineHeight: '1.3'
          }}>
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
      <div style={{ display: 'flex', height: '7px', width: '100%', marginTop: 'auto', flexShrink: 0 }}>
        <div style={{ flex: 1, background: '#FF6600' }} />
        <div style={{ flex: 1, background: '#FFFFFF', borderTop: '0.5px solid #DDD', borderBottom: '0.5px solid #DDD' }} />
        <div style={{ flex: 1, background: '#008000' }} />
      </div>
    </div>
  );
}

function IDCard({ member, onReset, showReset = true }) {
  const frontRef = useRef(null);
  const backRef = useRef(null);

  // Pre-draws photo images as canvas elements (correct cover crop) before html2canvas
  // scale must match the html2canvas scale option so the canvas is drawn at full resolution
  const replacePhotosWithCanvas = async (container, scale = 4) => {
    const photoImgs = container.querySelectorAll('img[data-member-photo="true"]');
    await Promise.all(Array.from(photoImgs).map(img => new Promise((resolve) => {
      // Use fixed logical sizes since we're in an off-screen div
      const logicalW = 70;
      const logicalH = 84;
      const canvasW = logicalW * scale;
      const canvasH = logicalH * scale;
      const source = new Image();
      source.crossOrigin = 'anonymous';
      source.onload = () => {
        const c = document.createElement('canvas');
        c.width = canvasW;
        c.height = canvasH;
        // Force display size to match logical layout (html2canvas reads style px)
        c.style.width = logicalW + 'px';
        c.style.height = logicalH + 'px';
        c.style.border = img.style.border;
        c.style.borderRadius = img.style.borderRadius;
        c.style.display = 'block';
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // Draw cover-crop: scale to fill, align top-center (face visible)
        const imgRatio = source.naturalWidth / source.naturalHeight;
        const boxRatio = logicalW / logicalH;
        let sw, sh, sx, sy;
        if (imgRatio > boxRatio) {
          sh = source.naturalHeight;
          sw = sh * boxRatio;
          sx = (source.naturalWidth - sw) / 2; // center horizontally
          sy = 0;                               // align top
        } else {
          sw = source.naturalWidth;
          sh = sw / boxRatio;
          sx = 0;
          sy = 0;                               // align top (face)
        }
        ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
        img.parentNode.replaceChild(c, img);
        resolve();
      };
      source.onerror = () => resolve();
      source.src = img.src;
    })));
  };

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
    await new Promise(r => setTimeout(r, 400));
    await replacePhotosWithCanvas(clone, 5);
    await new Promise(r => setTimeout(r, 200));

    const canvas = await html2canvas(clone, {
      scale: 5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      width: Math.ceil(clone.getBoundingClientRect().width || clone.scrollWidth || 320),
      height: Math.ceil(
        clone.getBoundingClientRect().height ||
        clone.scrollHeight
      ),
      windowWidth: 1200,
      windowHeight: 3000,
      imageTimeout: 15000,
      onclone: (doc) => {
        const el = doc.getElementById('dl-front-clone');
        if (!el) return;
        // Force all text to pure black for print
        el.querySelectorAll('*').forEach(node => {
          const computed = window.getComputedStyle(node);
          if (computed.color &&
              computed.color !== 'rgb(255, 255, 255)' &&
              computed.color !== 'rgba(0, 0, 0, 0)') {
            // Keep white text white, darken everything else
            const rgb = computed.color.match(/\d+/g);
            if (rgb) {
              const brightness =
                (parseInt(rgb[0]) * 299 +
                 parseInt(rgb[1]) * 587 +
                 parseInt(rgb[2]) * 114) / 1000;
              if (brightness < 200) {
                node.style.color = '#000000';
                node.style.fontWeight = '900';
              }
            }
          }
          node.style.transform = 'none';
          node.style.backdropFilter = 'none';
          node.style.webkitBackdropFilter = 'none';
        });
      }
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
    await new Promise(r => setTimeout(r, 400));
    await replacePhotosWithCanvas(frontClone, 5);
    await new Promise(r => setTimeout(r, 200));

    const cardW = 320;
    const cardH = 480;

    const oncloneProcessor = (doc) => {
      ['id-card-front-clone', 'id-card-back-clone'].forEach(id => {
        const el = doc.getElementById(id);
        if (!el) return;
        el.querySelectorAll('*').forEach(node => {
          const computed = window.getComputedStyle(node);
          if (computed.color &&
              computed.color !== 'rgb(255, 255, 255)' &&
              computed.color !== 'rgba(0, 0, 0, 0)') {
            // Keep white text white, darken everything else
            const rgb = computed.color.match(/\d+/g);
            if (rgb) {
              const brightness =
                (parseInt(rgb[0]) * 299 +
                 parseInt(rgb[1]) * 587 +
                 parseInt(rgb[2]) * 114) / 1000;
              if (brightness < 200) {
                node.style.color = '#000000';
                node.style.fontWeight = '900';
              }
            }
          }
          node.style.transform = 'none';
          node.style.backdropFilter = 'none';
          node.style.webkitBackdropFilter = 'none';
        });
      });
    };

    const captureOpts = {
      scale: 5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      width: cardW,
      height: cardH,
      windowWidth: 1200,
      windowHeight: 3000,
      imageTimeout: 15000,
      onclone: oncloneProcessor
    };

    const frontCanvas = await html2canvas(frontClone, captureOpts);
    const backCanvas = await html2canvas(backClone, captureOpts);

    document.body.removeChild(wrap);

    // Both canvases are now guaranteed identical size — combine side-by-side
    const gap = 100; // pixel gap at scale 5
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
