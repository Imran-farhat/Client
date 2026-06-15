const PageLoader = ({ message = 'ஏற்றுகிறது...' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1rem'
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      border: '4px solid var(--border)',
      borderTop: '4px solid #FF6B00',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <div style={{
      color: 'var(--text-muted)',
      fontSize: '14px',
      fontFamily: 'Catamaran, sans-serif'
    }}>{message}</div>
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg) }
      }
    `}</style>
  </div>
)

export default PageLoader
