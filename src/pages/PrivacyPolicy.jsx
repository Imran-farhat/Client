const PrivacyPolicy = () => (
  <div style={{
    maxWidth: '800px',
    margin: '0 auto',
    padding: '3rem 1.5rem',
    fontFamily: 'Catamaran, sans-serif'
  }}>
    <h1 style={{
      color: '#FF6B00',
      fontSize: '2rem',
      fontWeight: '800',
      marginBottom: '0.5rem'
    }}>
      தனியுரிமை கொள்கை / Privacy Policy
    </h1>
    <p style={{
      color: 'var(--text-muted)',
      fontSize: '13px',
      marginBottom: '2rem'
    }}>
      Last updated: {new Date().toLocaleDateString('en-IN')}
    </p>

    {[
      {
        title: '1. தகவல் சேகரிப்பு / Information We Collect',
        content: `நாங்கள் சேகரிக்கும் தகவல்கள்:
        உங்கள் பெயர், மின்னஞ்சல் முகவரி,
        தொலைபேசி எண், ஆதார் எண், முகவரி,
        பிறந்த தேதி மற்றும் படம்.
        
        We collect: your name, email address,
        phone number, Aadhaar number, address,
        date of birth and photo for membership
        registration purposes only.`
      },
      {
        title: '2. தகவல் பயன்பாடு / How We Use Your Information',
        content: `உங்கள் தகவல்கள் உறுப்பினர் அடையாள அட்டை
        உருவாக்க மட்டும் பயன்படுத்தப்படும்.
        
        Your information is used solely for:
        - Creating your member identity card
        - Membership management
        - Organization communications`
      },
      {
        title: '3. தகவல் பாதுகாப்பு / Data Security',
        content: `உங்கள் தகவல்கள் Supabase என்ற
        பாதுகாப்பான தரவுத்தளத்தில் சேமிக்கப்படும்.
        
        Your data is stored securely in Supabase
        database with encryption. We do not sell
        or share your personal information with
        any third parties.`
      },
      {
        title: '4. Google உள்நுழைவு / Google Login',
        content: `நீங்கள் Google மூலம் உள்நுழையும்போது,
        உங்கள் பெயர் மற்றும் மின்னஞ்சல் மட்டும்
        பெறப்படும்.
        
        When you sign in with Google, we only
        receive your name and email address.
        We do not access your Google account data.`
      },
      {
        title: '5. தொடர்பு கொள்ள / Contact Us',
        content: `தனியுரிமை கொள்கை பற்றிய கேள்விகளுக்கு:
        
        For privacy related queries:
        Email: thenindiawelding@gmail.com
        Phone: +91 98765 43210
        Address: 133/34, 1A, 1A பெங்களூர் ஹைவே,
        சென்னை – 600124, தமிழ்நாடு.`
      }
    ].map((section, i) => (
      <div key={i} style={{ marginBottom: '2rem' }}>
        <h2 style={{
          color: 'var(--text-primary)',
          fontSize: '1.1rem',
          fontWeight: '800',
          marginBottom: '0.8rem',
          paddingBottom: '6px',
          borderBottom: '1px solid var(--border)'
        }}>{section.title}</h2>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '14px',
          lineHeight: '1.8',
          whiteSpace: 'pre-line'
        }}>{section.content}</p>
      </div>
    ))}
  </div>
)

export default PrivacyPolicy
