import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('App Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            ⚠️
          </div>
          <h2 style={{
            color: '#FF6B00',
            fontFamily: 'Catamaran, sans-serif',
            fontSize: '1.5rem',
            marginBottom: '1rem'
          }}>
            பிழை ஏற்பட்டது / Something went wrong
          </h2>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '14px',
            marginBottom: '2rem',
            maxWidth: '400px'
          }}>
            தளம் தற்காலிகமாக செயலிழந்துள்ளது.
            சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.
            <br/>
            The page encountered an error.
            Please refresh and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#FF6B00',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 32px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              fontFamily: 'Catamaran, sans-serif',
              marginBottom: '12px'
            }}
          >
            🔄 புதுப்பிக்க / Refresh Page
          </button>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px 24px',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'Catamaran, sans-serif'
            }}
          >
            🏠 முகப்புக்கு செல் / Go Home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
