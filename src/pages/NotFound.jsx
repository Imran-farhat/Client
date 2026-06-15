import { useNavigate } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      textAlign: 'center',
      padding: '2rem',
      fontFamily: 'Catamaran, sans-serif'
    }}>
      <div style={{
        fontSize: '6rem',
        fontFamily: 'Bebas Neue, sans-serif',
        color: '#FF6B00',
        lineHeight: 1
      }}>404</div>
      <h2 style={{
        color: 'var(--text-primary)',
        fontSize: '1.5rem',
        fontWeight: '800',
        margin: '1rem 0 0.5rem'
      }}>
        பக்கம் கிடைக்கவில்லை
      </h2>
      <p style={{
        color: 'var(--text-muted)',
        fontSize: '14px',
        marginBottom: '2rem',
        maxWidth: '360px'
      }}>
        நீங்கள் தேடும் பக்கம் இல்லை அல்லது
        நகர்த்தப்பட்டிருக்கலாம்.
        <br/>
        The page you are looking for doesn't exist.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          background: '#FF6B00',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 32px',
          fontSize: '15px',
          fontWeight: '700',
          cursor: 'pointer'
        }}
      >
        🏠 முகப்புக்கு செல் / Go Home
      </button>
    </div>
  )
}

export default NotFound
