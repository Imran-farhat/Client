import { SITE_URL } from '../config/constants'

export const printMemberForm = (member) => {
  const printWindow = window.open('', '_blank')

  const logoSrc = `${window.location.origin}/logo.png`

  printWindow.document.write(`
<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="UTF-8">
  <title>உறுப்பினர் படிவம் - ${member.full_name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Catamaran:wght@400;600;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box }

    body {
      font-family: 'Catamaran', sans-serif;
      background: #fff;
      color: #000;
      padding: 20px 28px;
      font-size: 13px;
      max-width: 800px;
      margin: 0 auto;
    }

    /* ── HEADER ── */
    .header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding-bottom: 10px;
      border-bottom: 2px solid #000;
      margin-bottom: 12px;
    }
    .logo {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }
    .header-center { text-align: center; flex: 1 }
    .org-name-tamil {
      font-size: 16px;
      font-weight: 800;
      color: #000;
      line-height: 1.3;
    }
    .org-sub {
      font-size: 11px;
      color: #000;
      margin-top: 3px;
      line-height: 1.5;
    }

    /* ── FORM TITLE ── */
    .form-title {
      text-align: center;
      font-size: 13px;
      font-weight: 800;
      text-decoration: underline;
      margin: 10px 0 14px;
    }

    /* ── TWO COLUMN LAYOUT ── */
    .form-body {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }
    .left-fields { flex: 1 }
    .right-col {
      width: 150px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    /* ── FIELD ROWS ── */
    .field-row {
      display: flex;
      align-items: flex-start;
      margin-bottom: 10px;
      min-height: 22px;
    }
    .f-label {
      width: 170px;
      flex-shrink: 0;
      font-size: 12px;
      font-weight: 600;
      line-height: 1.5;
      padding-right: 4px;
    }
    .f-colon {
      font-weight: 600;
      font-size: 12px;
      flex-shrink: 0;
      padding-right: 6px;
    }
    .f-value {
      flex: 1;
      font-size: 12px;
      font-weight: 600;
      border-bottom: 1px solid #000;
      min-height: 18px;
      padding-bottom: 1px;
      word-break: break-word;
      line-height: 1.5;
    }

    /* ── RIGHT COLUMN ── */
    .photo-box {
      width: 120px;
      height: 140px;
      border: 1.5px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #fff;
    }
    .photo-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-empty {
      font-size: 10px;
      color: #666;
      text-align: center;
      padding: 8px;
    }
    .photo-label {
      font-size: 10px;
      text-align: center;
      color: #333;
      margin-top: 2px;
    }
    .id-box {
      width: 120px;
      border: 1.5px solid #000;
      padding: 5px 8px;
      text-align: center;
      margin-top: 4px;
    }
    .id-label {
      font-size: 9px;
      color: #333;
      line-height: 1.3;
    }
    .id-value {
      font-size: 10px;
      font-weight: 800;
      font-family: 'Courier New', monospace;
      letter-spacing: 0.5px;
      margin-top: 3px;
      word-break: break-all;
      color: #000;
    }

    /* ── DIVIDER + EQUAL RIGHTS ── */
    .hr { border: none; border-top: 1px solid #000; margin: 12px 0 }
    .equal-rights {
      text-align: center;
      font-size: 11px;
      color: #333;
      margin-bottom: 8px;
    }

    /* ── PLEDGE ── */
    .pledge-box {
      border: 1px solid #000;
      padding: 12px 16px;
      margin: 10px 0;
    }
    .pledge-title {
      text-align: center;
      font-weight: 800;
      font-size: 14px;
      text-decoration: underline;
      margin-bottom: 10px;
    }
    .pledge-text {
      font-size: 12px;
      line-height: 2.0;
      color: #000;
      text-align: justify;
    }
    .pledge-text u { font-weight: 800 }
    .pledge-right {
      text-align: right;
      margin-top: 8px;
      font-size: 12px;
    }

    /* ── SIGN ROW ── */
    .sign-area {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 16px;
      gap: 20px;
    }
    .sign-left { font-size: 12px; flex: 1 }
    .sign-left div { margin-bottom: 8px }
    .sign-right { font-size: 11px; text-align: right }
    .sign-line {
      border-top: 1px solid #000;
      width: 180px;
      padding-top: 4px;
      margin-top: 36px;
      margin-left: auto;
    }

    /* ── AUTHORITY ROW ── */
    .authority-section {
      margin-top: 24px;
      border-top: 1.5px solid #000;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
    }
    .auth-col {
      text-align: center;
      width: 30%;
      border-top: 1px solid #333;
      padding-top: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    /* ── DOWNLOAD BUTTON ── */
    .no-print {
      text-align: center;
      margin-bottom: 20px;
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .btn-download {
      padding: 10px 32px;
      background: #FF6B00;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      font-family: Catamaran, sans-serif;
    }
    .btn-close {
      padding: 10px 32px;
      background: transparent;
      color: #333;
      border: 1px solid #333;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      font-family: Catamaran, sans-serif;
    }

    @media print {
      .no-print { display: none !important }
      body { padding: 10px 16px }
    }
  </style>
</head>
<body>

<!-- DOWNLOAD / CLOSE BUTTONS -->
<div class="no-print">
  <button class="btn-download" onclick="window.print()">
    ⬇️ Download PDF
  </button>
  <button class="btn-close" onclick="window.close()">
    Close
  </button>
</div>

<!-- ORG HEADER -->
<div class="header">
  <img
    class="logo"
    src="${logoSrc}"
    alt="TIWTN Logo"
    onerror="this.style.display='none'"
  />
  <div class="header-center">
    <div class="org-name-tamil">
      தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்
    </div>
    <div class="org-sub">மாநில தலைமை நிர்வாசம் அலுவலகம்</div>
    <div class="org-sub">
      133/34, 1A, 1A பெங்களூர் ஹைவே,
      சென்னை – 600124, தமிழ்நாடு.
    </div>
  </div>
</div>

<!-- FORM TITLE -->
<div class="form-title">(உறுப்பினர் படிவம்)</div>

<!-- FORM BODY -->
<div class="form-body">

  <!-- LEFT: FIELDS -->
  <div class="left-fields">

    <div class="field-row">
      <span class="f-label">முழு பெயர்</span>
      <span class="f-colon">:</span>
      <span class="f-value">${member.full_name || ''}</span>
    </div>

    <div class="field-row">
      <span class="f-label">பதவி</span>
      <span class="f-colon">:</span>
      <span class="f-value">${member.posting || ''}</span>
    </div>

    <div class="field-row">
      <span class="f-label">சரியான முகவரி</span>
      <span class="f-colon">:</span>
      <span class="f-value">${member.address || ''}</span>
    </div>

    <div class="field-row">
      <span class="f-label">நிறுவனத்தின் முகவரி</span>
      <span class="f-colon">:</span>
      <span class="f-value">${member.org_address || ''}</span>
    </div>

    <div class="field-row">
      <span class="f-label">இரத்த பிரிவு</span>
      <span class="f-colon">:</span>
      <span class="f-value">${member.blood_group || ''}</span>
    </div>

    <div class="field-row">
      <span class="f-label">வயது பிறந்த தேதி</span>
      <span class="f-colon">:</span>
      <span class="f-value">${member.dob || ''}</span>
    </div>

    <div class="field-row">
      <span class="f-label">ஆதார் எண்</span>
      <span class="f-colon">:</span>
      <span class="f-value">${member.aadhar || ''}</span>
    </div>

    <div class="field-row">
      <span class="f-label">செல் நம்பர்</span>
      <span class="f-colon">:</span>
      <span class="f-value">${member.mobile || ''}</span>
    </div>

    <div class="field-row">
      <span class="f-label">வாரிசுதாரர் பெயர்</span>
      <span class="f-colon">:</span>
      <span class="f-value">${member.nominee_name || ''}</span>
    </div>

    <div class="field-row">
      <span class="f-label">வாரிசுதாரர் செல்நம்பர்</span>
      <span class="f-colon">:</span>
      <span class="f-value">${member.nominee_phone || ''}</span>
    </div>

    <div class="field-row">
      <span class="f-label">மாவட்டம்</span>
      <span class="f-colon">:</span>
      <span class="f-value">${member.district || ''}</span>
    </div>

    <div class="field-row">
      <span class="f-label">கிளை சங்கம்</span>
      <span class="f-colon">:</span>
      <span class="f-value">${member.branch || ''}</span>
    </div>

    <div class="field-row">
      <span class="f-label">இணைந்த தேதி</span>
      <span class="f-colon">:</span>
      <span class="f-value">${member.join_date || ''}</span>
    </div>

  </div>

  <!-- RIGHT: PHOTO + MEMBER ID -->
  <div class="right-col">
    <div class="photo-box">
      ${(member.photo_url || member.photo_base64)
        ? `<img src="${member.photo_url || member.photo_base64}" alt="படம்" crossorigin="anonymous"/>`
        : '<div class="photo-empty">உறுப்பினர்<br/>படம்</div>'
      }
    </div>
    <div class="photo-label">உறுப்பினர் பதிவு எண்</div>
    <div class="id-box">
      <div class="id-label">உறுப்பினர் பதிவு எண்</div>
      <div class="id-value">${member.member_id || ''}</div>
    </div>
  </div>

</div>

<!-- DIVIDER -->
<hr class="hr"/>

<!-- EQUAL RIGHTS -->
<div class="equal-rights">அனைவருக்கும் சம உரிமை:</div>

<!-- PLEDGE BOX -->
<div class="pledge-box">
  <div class="pledge-title">உறுதிமொழி</div>
  <div class="pledge-text">
    ஐயா,<br/>
    <u>${member.full_name || '________________________'}</u>
    ஆகிய நான் தென்னிந்திய வெல்டிங் தொழிலாளர்
    நலச்சங்கத்தின்
    <u>${member.district || '____________'}</u> மாவட்டம்
    <u>${member.branch || '____________'}</u>
    கிளைசங்கத்தில் உறுப்பினராக சேர்ந்து
    பணியாற்ற சம்மதிக்கின்றேன். மேலும் சங்கத்தின்
    சட்ட திட்டங்களுக்கு கட்டுப்பட்டு நடப்பேன்
    எனவும், சங்கம் விதிக்கும் சந்தா தொகையை கட்ட
    சம்மதிக்கின்றேன் எனவும், சங்க வளர்ச்சிக்காக
    பாடுபடுவேன் எனவும் உறுதி கூறுகின்றேன்.
  </div>
  <div class="pledge-right">
    இங்ஙனம்,<br/>தங்கள் உண்மையுள்ள,
  </div>
</div>

<!-- SIGN ROW -->
<div class="sign-area">
  <div class="sign-left">
    <div>நாள்: ${member.join_date || ''}</div>
    <div>பரிந்துரை: ${member.referrer || ''}</div>
  </div>
  <div class="sign-right">
    <div class="sign-line">உறுப்பினர் கையொப்பம்</div>
  </div>
</div>

<!-- AUTHORITY ROW -->
<div class="authority-section">
  <div class="auth-col">மாநில தலைவர்</div>
  <div class="auth-col">மாநில செயலாளர்</div>
  <div class="auth-col">மாநில பொருளாளர்</div>
</div>

</body>
</html>
  `)

  printWindow.document.close()
}
