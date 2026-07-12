import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import IDCard from '../components/IDCard';

const SITE_URL = window.location.origin;

// Helper to pre-process photos (crop) exactly like IDCard.jsx does
const replacePhotosWithCanvas = async (container, scale = 5) => {
  const photoImgs = container.querySelectorAll('img[data-member-photo="true"]');
  await Promise.all(Array.from(photoImgs).map(img => new Promise((resolve) => {
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
      c.style.width = logicalW + 'px';
      c.style.height = logicalH + 'px';
      c.style.border = img.style.border;
      c.style.borderRadius = img.style.borderRadius;
      c.style.display = 'block';
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      const imgRatio = source.naturalWidth / source.naturalHeight;
      const boxRatio = logicalW / logicalH;
      let sw, sh, sx, sy;
      if (imgRatio > boxRatio) {
        sh = source.naturalHeight;
        sw = sh * boxRatio;
        sx = (source.naturalWidth - sw) / 2;
        sy = 0;
      } else {
        sw = source.naturalWidth;
        sh = sw / boxRatio;
        sx = 0;
        sy = 0;
      }
      ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
      img.parentNode.replaceChild(c, img);
      resolve();
    };
    source.onerror = () => resolve();
    source.src = img.src;
  })));
};

const captureIDCard = async (frontEl, backEl) => {
  const wrap = document.createElement('div');
  wrap.style.cssText = `
    position:fixed; left:-99999px; top:0; width:700px;
    z-index:-999; pointer-events:none; background:#FFFFFF;
    display:flex; flex-direction:row; gap:20px; padding:20px;
  `;
  document.body.appendChild(wrap);

  const cloneCard = (src, newId) => {
    const clone = src.cloneNode(true);
    clone.id = newId;
    clone.style.cssText = `
      width: 320px; height: 480px; box-sizing: border-box;
      overflow: hidden; transform: none; position: relative;
      opacity: 1; display: flex; flex-direction: column;
      background: #FFFFFF; border-radius: 8px;
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

  const frontClone = cloneCard(frontEl, 'front-clone');
  const backClone = cloneCard(backEl, 'back-clone');
  wrap.appendChild(frontClone);
  wrap.appendChild(backClone);

  await replacePhotosWithCanvas(frontClone, 5);
  await new Promise(r => setTimeout(r, 100)); // wait for canvas to settle

  const captureOpts = {
    scale: 5,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#FFFFFF',
    logging: false,
    width: 320,
    height: 480,
    windowWidth: 1200,
    windowHeight: 3000,
    onclone: (doc) => {
      ['front-clone', 'back-clone'].forEach(id => {
        const el = doc.getElementById(id);
        if (!el) return;
        el.querySelectorAll('*').forEach(node => {
          const computed = window.getComputedStyle(node);
          if (computed.color && computed.color !== 'rgb(255, 255, 255)' && computed.color !== 'rgba(0, 0, 0, 0)') {
            const rgb = computed.color.match(/\d+/g);
            if (rgb) {
              const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
              if (brightness < 200) {
                node.style.color = '#000000';
                node.style.fontWeight = '900';
              }
            }
          }
          node.style.transform = 'none';
        });
      });
    }
  };

  const frontCanvas = await html2canvas(frontClone, captureOpts);
  const backCanvas = await html2canvas(backClone, captureOpts);
  
  document.body.removeChild(wrap);

  const combined = document.createElement('canvas');
  const gap = 100;
  combined.width = frontCanvas.width + gap + frontCanvas.width;
  combined.height = frontCanvas.height;

  const ctx = combined.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, combined.width, combined.height);
  ctx.drawImage(frontCanvas, 0, 0);
  ctx.drawImage(backCanvas, frontCanvas.width + gap, 0);

  return new Promise(resolve => {
    combined.toBlob(blob => resolve(blob), 'image/png');
  });
};

const getFormHTML = (member) => {
  const logoSrc = \`\${SITE_URL}/logo.png\`;
  return \`
    <div class="page">
      <div class="header">
        <img class="logo" src="\${logoSrc}" onerror="this.style.display='none'" />
        <div class="header-center">
          <div class="org-name-tamil">தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்</div>
          <div class="org-sub">மாநில தலைமை நிர்வாசம் அலுவலகம்</div>
          <div class="org-sub">133/34, 1A, 1A பெங்களூர் ஹைவே, சென்னை – 600124, தமிழ்நாடு.</div>
        </div>
      </div>
      <div class="form-title">(உறுப்பினர் படிவம்)</div>
      <div class="form-body">
        <div class="left-fields">
          <div class="field-row"><span class="f-label">முழு பெயர்</span><span class="f-colon">:</span><span class="f-value">\${member.full_name || ''}</span></div>
          <div class="field-row"><span class="f-label">பதவி</span><span class="f-colon">:</span><span class="f-value">\${member.posting || ''}</span></div>
          <div class="field-row"><span class="f-label">சரியான முகவரி</span><span class="f-colon">:</span><span class="f-value">\${member.address || ''}</span></div>
          <div class="field-row"><span class="f-label">நிறுவனத்தின் முகவரி</span><span class="f-colon">:</span><span class="f-value">\${member.org_address || ''}</span></div>
          <div class="field-row"><span class="f-label">இரத்த பிரிவு</span><span class="f-colon">:</span><span class="f-value">\${member.blood_group || ''}</span></div>
          <div class="field-row"><span class="f-label">வயது பிறந்த தேதி</span><span class="f-colon">:</span><span class="f-value">\${member.dob || ''}</span></div>
          <div class="field-row"><span class="f-label">ஆதார் எண்</span><span class="f-colon">:</span><span class="f-value">\${member.aadhar || ''}</span></div>
          <div class="field-row"><span class="f-label">செல் நம்பர்</span><span class="f-colon">:</span><span class="f-value">\${member.mobile || ''}</span></div>
          <div class="field-row"><span class="f-label">வாரிசுதாரர் பெயர்</span><span class="f-colon">:</span><span class="f-value">\${member.nominee_name || ''}</span></div>
          <div class="field-row"><span class="f-label">வாரிசுதாரர் செல்நம்பர்</span><span class="f-colon">:</span><span class="f-value">\${member.nominee_phone || ''}</span></div>
          <div class="field-row"><span class="f-label">மாவட்டம்</span><span class="f-colon">:</span><span class="f-value">\${member.district || ''}</span></div>
          <div class="field-row"><span class="f-label">கிளை சங்கம்</span><span class="f-colon">:</span><span class="f-value">\${member.branch || ''}</span></div>
          <div class="field-row"><span class="f-label">இணைந்த தேதி</span><span class="f-colon">:</span><span class="f-value">\${member.join_date || ''}</span></div>
        </div>
        <div class="right-col">
          <div class="photo-box">
            \${(member.photo_url || member.photo_base64) ? \`<img src="\${member.photo_url || member.photo_base64}" crossorigin="anonymous"/>\` : '<div class="photo-empty">உறுப்பினர்<br/>படம்</div>'}
          </div>
          <div class="photo-label">உறுப்பினர் பதிவு எண்</div>
          <div class="id-box">
            <div class="id-label">உறுப்பினர் பதிவு எண்</div>
            <div class="id-value">\${member.member_id || ''}</div>
          </div>
        </div>
      </div>
      <hr class="hr"/>
      <div class="equal-rights">அனைவருக்கும் சம உரிமை:</div>
      <div class="pledge-box">
        <div class="pledge-title">உறுதிமொழி</div>
        <div class="pledge-text">ஐயா,<br/><u>\${member.full_name || '________________________'}</u> ஆகிய நான் தென்னிந்திய வெல்டிங் தொழிலாளர் நலச்சங்கத்தின் <u>\${member.district || '____________'}</u> மாவட்டம் <u>\${member.branch || '____________'}</u> கிளைசங்கத்தில் உறுப்பினராக சேர்ந்து பணியாற்ற சம்மதிக்கின்றேன். மேலும் சங்கத்தின் சட்ட திட்டங்களுக்கு கட்டுப்பட்டு நடப்பேன் எனவும், சங்கம் விதிக்கும் சந்தா தொகையை கட்ட சம்மதிக்கின்றேன் எனவும், சங்க வளர்ச்சிக்காக பாடுபடுவேன் எனவும் உறுதி கூறுகின்றேன்.</div>
        <div class="pledge-right">இங்ஙனம்,<br/>தங்கள் உண்மையுள்ள,</div>
      </div>
      <div class="sign-area">
        <div class="sign-left"><div>நாள்: \${member.join_date || ''}</div><div>பரிந்துரை: \${member.referrer || ''}</div></div>
        <div class="sign-right"><div class="sign-line">உறுப்பினர் கையொப்பம்</div></div>
      </div>
      <div class="authority-section">
        <div class="auth-col">மாநில தலைவர்</div><div class="auth-col">மாநில செயலாளர்</div><div class="auth-col">மாநில பொருளாளர்</div>
      </div>
    </div>
  \`;
};

const getFormCSS = () => \`
  @import url('https://fonts.googleapis.com/css2?family=Catamaran:wght@400;600;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Catamaran', sans-serif; background: #fff; color: #000; padding: 0; font-size: 13px; }
  .page { page-break-after: always; padding: 20px 28px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; align-items: center; gap: 14px; padding-bottom: 10px; border-bottom: 2px solid #000; margin-bottom: 12px; }
  .logo { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
  .header-center { text-align: center; flex: 1; }
  .org-name-tamil { font-size: 16px; font-weight: 800; color: #000; line-height: 1.3; }
  .org-sub { font-size: 11px; color: #000; margin-top: 3px; line-height: 1.5; }
  .form-title { text-align: center; font-size: 13px; font-weight: 800; text-decoration: underline; margin: 10px 0 14px; }
  .form-body { display: flex; gap: 16px; align-items: flex-start; }
  .left-fields { flex: 1; }
  .right-col { width: 150px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .field-row { display: flex; align-items: flex-start; margin-bottom: 10px; min-height: 22px; }
  .f-label { width: 170px; flex-shrink: 0; font-size: 12px; font-weight: 600; line-height: 1.5; padding-right: 4px; }
  .f-colon { font-weight: 600; font-size: 12px; flex-shrink: 0; padding-right: 6px; }
  .f-value { flex: 1; font-size: 12px; font-weight: 600; border-bottom: 1px solid #000; min-height: 18px; padding-bottom: 1px; word-break: break-word; line-height: 1.5; }
  .photo-box { width: 120px; height: 140px; border: 1.5px solid #000; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fff; }
  .photo-box img { width: 100%; height: 100%; object-fit: cover; }
  .photo-empty { font-size: 10px; color: #666; text-align: center; padding: 8px; }
  .photo-label { font-size: 10px; text-align: center; color: #333; margin-top: 2px; }
  .id-box { width: 120px; border: 1.5px solid #000; padding: 5px 8px; text-align: center; margin-top: 4px; }
  .id-label { font-size: 9px; color: #333; line-height: 1.3; }
  .id-value { font-size: 10px; font-weight: 800; font-family: 'Courier New', monospace; letter-spacing: 0.5px; margin-top: 3px; word-break: break-all; color: #000; }
  .hr { border: none; border-top: 1px solid #000; margin: 12px 0; }
  .equal-rights { text-align: center; font-size: 11px; color: #333; margin-bottom: 8px; }
  .pledge-box { border: 1px solid #000; padding: 12px 16px; margin: 10px 0; }
  .pledge-title { text-align: center; font-weight: 800; font-size: 14px; text-decoration: underline; margin-bottom: 10px; }
  .pledge-text { font-size: 12px; line-height: 2.0; color: #000; text-align: justify; }
  .pledge-text u { font-weight: 800; }
  .pledge-right { text-align: right; margin-top: 8px; font-size: 12px; }
  .sign-area { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 16px; gap: 20px; }
  .sign-left { font-size: 12px; flex: 1; }
  .sign-left div { margin-bottom: 8px; }
  .sign-right { font-size: 11px; text-align: right; }
  .sign-line { border-top: 1px solid #000; width: 180px; padding-top: 4px; margin-top: 36px; margin-left: auto; }
  .authority-section { margin-top: 24px; border-top: 1.5px solid #000; padding-top: 10px; display: flex; justify-content: space-between; }
  .auth-col { text-align: center; width: 30%; border-top: 1px solid #333; padding-top: 4px; font-size: 11px; font-weight: 600; }
\`;

const toIdCardShape = (m) => m ? ({
  memberId: m.member_id,
  fullName: m.full_name,
  posting: m.posting,
  dob: m.dob,
  bloodGroup: m.blood_group,
  mobile: m.mobile,
  district: m.district,
  address: m.address,
  nomineeName: m.nominee_name,
  joinDate: m.join_date,
  pledgeDistrict: m.district,
  pledgeBranch: m.branch,
  photo_url: m.photo_url,
  photo_base64: m.photo_base64,
  photoPreview: m.photo_base64,
  aadhar: m.aadhar,
  aadhaar: m.aadhar
}) : null;

export const bulkDownloadMembers = async (members, onProgress) => {
  if (!members || members.length === 0) return;
  const zip = new JSZip();
  const idCardsFolder = zip.folder("ID_Cards");
  
  // 1. Generate All Forms HTML
  let allFormsHtml = '';
  members.forEach(m => {
    allFormsHtml += getFormHTML(m);
  });
  
  const formsFile = \`
    <!DOCTYPE html>
    <html lang="ta">
    <head>
      <meta charset="UTF-8">
      <title>All Member Forms</title>
      <style>\${getFormCSS()}</style>
    </head>
    <body onload="window.print()">
      \${allFormsHtml}
    </body>
    </html>
  \`;
  zip.file("All_Member_Forms.html", formsFile);

  // 2. Generate ID Cards (using hidden React render)
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);
  
  const root = createRoot(container);

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    onProgress(i + 1, members.length);
    
    // Render the React component for this member
    root.render(<IDCard member={toIdCardShape(member)} showReset={false} />);
    
    // Wait for render and images to load
    await new Promise(r => setTimeout(r, 600)); 
    
    const frontEl = container.querySelector('#id-card-front');
    const backEl = container.querySelector('#id-card-back');
    
    if (frontEl && backEl) {
      try {
        const blob = await captureIDCard(frontEl, backEl);
        idCardsFolder.file(\`\${member.member_id}_\${member.full_name}.png\`, blob);
      } catch (err) {
        console.error('Failed to capture ID card for ' + member.member_id, err);
      }
    }
  }

  // Cleanup
  root.unmount();
  document.body.removeChild(container);

  // 3. Generate ZIP
  onProgress('zipping', 0);
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, \`TIWTN_Members_Export.zip\`);
};
