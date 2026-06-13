export const printMemberForm = (member) => {
  const printWindow = window.open('', '_blank')

  printWindow.document.write(`
<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="UTF-8">
  <title>உறுப்பினர் படிவம் - ${member.full_name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Catamaran:wght@400;600;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Catamaran', sans-serif;
      background: #fff;
      color: #000;
      padding: 20px;
      font-size: 13px;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #000;
      margin-bottom: 16px;
    }

    .header img {
      width: 70px;
      height: 70px;
    }

    .header-text {
      text-align: center;
      flex: 1;
    }

    .org-name {
      font-size: 18px;
      font-weight: 800;
      color: #000;
      line-height: 1.3;
    }

    .org-sub {
      font-size: 11px;
      color: #333;
      margin-top: 2px;
    }

    .form-title {
      text-align: center;
      font-size: 14px;
      font-weight: 800;
      text-decoration: underline;
      margin: 12px 0;
    }

    .form-layout {
      display: flex;
      gap: 16px;
    }

    .form-fields {
      flex: 1;
    }

    .form-right {
      width: 130px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .photo-box {
      width: 110px;
      height: 130px;
      border: 1.5px solid #000;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .photo-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-label {
      font-size: 10px;
      text-align: center;
      color: #333;
    }

    .member-id-box {
      width: 110px;
      border: 1.5px solid #000;
      padding: 6px;
      text-align: center;
    }

    .member-id-label {
      font-size: 9px;
      color: #333;
    }

    .member-id-value {
      font-size: 11px;
      font-weight: 800;
      font-family: monospace;
      letter-spacing: 1px;
      margin-top: 2px;
    }

    .field-row {
      display: flex;
      align-items: flex-start;
      margin-bottom: 10px;
      gap: 8px;
    }

    .field-label {
      width: 160px;
      font-weight: 600;
      font-size: 12px;
      flex-shrink: 0;
    }

    .field-colon {
      font-weight: 600;
      flex-shrink: 0;
    }

    .field-value {
      flex: 1;
      border-bottom: 1px solid #000;
      min-width: 100px;
      padding-bottom: 1px;
      font-size: 12px;
      font-weight: 600;
    }

    .divider {
      border: none;
      border-top: 1px solid #000;
      margin: 12px 0;
    }

    .equal-rights {
      text-align: center;
      font-size: 11px;
      color: #333;
      margin-bottom: 8px;
    }

    .pledge-section {
      border: 1px solid #000;
      padding: 12px;
      margin: 12px 0;
      background: #fafafa;
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
      line-height: 2;
      color: #000;
    }

    .pledge-text u {
      text-decoration: underline;
      font-weight: 800;
    }

    .sign-row {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
      gap: 16px;
    }

    .sign-col {
      flex: 1;
      font-size: 11px;
    }

    .sign-line {
      border-top: 1px solid #000;
      margin-top: 30px;
      padding-top: 4px;
    }

    .authority-row {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
      border-top: 1.5px solid #000;
      padding-top: 12px;
    }

    .authority-col {
      text-align: center;
      width: 30%;
      font-size: 11px;
      font-weight: 600;
      border-top: 1px solid #000;
      padding-top: 4px;
    }

    .verified-stamp {
      position: fixed;
      top: 40px;
      right: 40px;
      border: 3px solid #22C55E;
      color: #22C55E;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 800;
      transform: rotate(-15deg);
      opacity: 0.8;
    }

    @media print {
      body { padding: 10px; }
      .no-print { display: none; }
      .verified-stamp { position: fixed; }
    }
  </style>
</head>
<body>

${member.verified ? `
  <div class="verified-stamp">
    ✅ சரிபார்க்கப்பட்டது<br/>VERIFIED
  </div>
` : ''}

<!-- PRINT BUTTON -->
<div class="no-print" style="
  text-align: center;
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
">
  <button onclick="window.print()" style="
    padding: 10px 32px;
    background: #FF6B00;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    font-family: Catamaran, sans-serif;
  ">🖨️ Print / Download PDF</button>
  <button onclick="window.close()" style="
    padding: 10px 32px;
    background: transparent;
    color: #333;
    border: 1px solid #333;
    border-radius: 8px;
    font-size: 15px;
    cursor: pointer;
    font-family: Catamaran, sans-serif;
  ">Close</button>
</div>

<!-- FORM HEADER -->
<div class="header">
  <div class="header-text">
    <div class="org-name">
      தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்
    </div>
    <div class="org-sub">
      மாநில தலைமை நிர்வாசம் அலுவலகம்
    </div>
    <div class="org-sub">
      133/34, 1A, 1A பெங்களூர் ஹைவே,
      சென்னை – 600124, தமிழ்நாடு.
    </div>
  </div>
</div>

<div class="form-title">(உறுப்பினர் படிவம்)</div>

<!-- FORM BODY -->
<div class="form-layout">
  <div class="form-fields">
    <div class="field-row">
      <span class="field-label">முழு பெயர்</span>
      <span class="field-colon">:</span>
      <span class="field-value">${member.full_name || ''}</span>
    </div>
    <div class="field-row">
      <span class="field-label">சரியான முகவரி</span>
      <span class="field-colon">:</span>
      <span class="field-value">${member.address || ''}</span>
    </div>
    <div class="field-row">
      <span class="field-label">நிறுவனத்தின் முகவரி</span>
      <span class="field-colon">:</span>
      <span class="field-value">${member.org_address || ''}</span>
    </div>
    <div class="field-row">
      <span class="field-label">இரத்த பிரிவு</span>
      <span class="field-colon">:</span>
      <span class="field-value">${member.blood_group || ''}</span>
    </div>
    <div class="field-row">
      <span class="field-label">வயது / பிறந்த தேதி</span>
      <span class="field-colon">:</span>
      <span class="field-value">${member.dob || ''}</span>
    </div>
    <div class="field-row">
      <span class="field-label">ஆதார் எண்</span>
      <span class="field-colon">:</span>
      <span class="field-value">${member.aadhar || ''}</span>
    </div>
    <div class="field-row">
      <span class="field-label">செல் நம்பர்</span>
      <span class="field-colon">:</span>
      <span class="field-value">${member.mobile || ''}</span>
    </div>
    <div class="field-row">
      <span class="field-label">வாரிசுதாரர் பெயர்</span>
      <span class="field-colon">:</span>
      <span class="field-value">${member.nominee_name || ''}</span>
    </div>
    <div class="field-row">
      <span class="field-label">வாரிசுதாரர் செல்நம்பர்</span>
      <span class="field-colon">:</span>
      <span class="field-value">${member.nominee_phone || ''}</span>
    </div>
    <div class="field-row">
      <span class="field-label">மாவட்டம்</span>
      <span class="field-colon">:</span>
      <span class="field-value">${member.district || ''}</span>
    </div>
    <div class="field-row">
      <span class="field-label">கிளை சங்கம்</span>
      <span class="field-colon">:</span>
      <span class="field-value">${member.branch || ''}</span>
    </div>
    <div class="field-row">
      <span class="field-label">இணைந்த தேதி</span>
      <span class="field-colon">:</span>
      <span class="field-value">${member.join_date || ''}</span>
    </div>
  </div>

  <!-- RIGHT COLUMN -->
  <div class="form-right">
    <div class="photo-box">
      ${member.photo_base64
        ? `<img src="${member.photo_base64}"
             alt="Member Photo" />`
        : '<div style="font-size:11px;color:#999;text-align:center;padding:8px;">படம்<br/>இல்லை</div>'
      }
    </div>
    <div class="photo-label">உறுப்பினர் படம்</div>
    <div class="member-id-box">
      <div class="member-id-label">
        உறுப்பினர் பதிவு எண்
      </div>
      <div class="member-id-value">
        ${member.member_id}
      </div>
    </div>
  </div>
</div>

<hr class="divider"/>

<div class="equal-rights">அனைவருக்கும் சம உரிமை:</div>

<!-- PLEDGE SECTION -->
<div class="pledge-section">
  <div class="pledge-title">உறுதிமொழி</div>
  <div class="pledge-text">
    ஐயா,<br/>
    <u>${member.full_name || '_______________'}</u>
    ஆகிய நான் தென்னிந்திய வெல்டிங் தொழிலாளர்
    நலச்சங்கத்தின்
    <u>${member.district || '____________'}</u> மாவட்டம்
    <u>${member.branch || '____________'}</u>
    கிளைசங்கத்தில் உறுப்பினராக சேர்ந்து
    பணியாற்ற சம்மதிக்கின்றேன்.<br/><br/>
    மேலும் சங்கத்தின் சட்ட திட்டங்களுக்கு
    கட்டுப்பட்டு நடப்பேன் எனவும், சங்கம் விதிக்கும்
    சந்தா தொகையை கட்ட சம்மதிக்கின்றேன் எனவும்,
    சங்க வளர்ச்சிக்காக பாடுபடுவேன் எனவும்
    உறுதி கூறுகின்றேன்.<br/><br/>
    <div style="text-align:right">
      இங்ஙனம்,<br/>
      தங்கள் உண்மையுள்ள,
    </div>
  </div>
</div>

<!-- SIGN ROW -->
<div class="sign-row">
  <div class="sign-col">
    <div>நாள்: ${member.join_date || ''}</div>
    <br/>
    <div>பரிந்துரை: ${member.referrer || '________________'}</div>
  </div>
  <div class="sign-col" style="text-align:right">
    <div class="sign-line">உறுப்பினர் கையொப்பம்</div>
  </div>
</div>

${member.verified ? `
<div style="
  text-align: center;
  margin-top: 12px;
  padding: 8px;
  background: #F0FDF4;
  border: 1px solid #22C55E;
  border-radius: 6px;
  font-size: 12px;
  color: #15803D;
  font-weight: 700;
">
  ✅ சரிபார்க்கப்பட்டது / Verified on
  ${member.verified_at
    ? new Date(member.verified_at)
        .toLocaleDateString('en-IN')
    : ''
  }
  by ${member.verified_by || 'Admin'}
</div>
` : ''}

<!-- AUTHORITY ROW -->
<div class="authority-row">
  <div class="authority-col">மாநில தலைவர்</div>
  <div class="authority-col">மாநில செயலாளர்</div>
  <div class="authority-col">மாநில பொருளாளர்</div>
</div>

</body>
</html>
  `)

  printWindow.document.close()
}
