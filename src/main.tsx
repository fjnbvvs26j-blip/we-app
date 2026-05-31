import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Component, type ReactNode } from 'react'
import App from './App'
import './index.css'

// 全局错误边界：防止 React 崩溃导致白屏
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: '#FCF7F0',
          fontFamily: 'system-ui, sans-serif',
          color: '#5C3D2E',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>页面出错了</h1>
          <p style={{ fontSize: '0.875rem', color: '#8B7B6B', marginBottom: '1rem', maxWidth: '300px', wordBreak: 'break-all' }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '9999px',
              border: 'none',
              background: '#B8652B',
              color: 'white',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <HashRouter>
      <App />
    </HashRouter>
  </ErrorBoundary>
)
