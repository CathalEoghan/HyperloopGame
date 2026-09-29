import { Component } from 'react'
import { exportSave } from 'Managers/SaveManager.js'

// Last line of defence (bug #88): if the game crashes while drawing the screen, show a way out
// instead of a blank page. The player can download their save and, if the crash keeps
// happening, reset the game without having to clear site data by hand.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, confirmReset: false }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Hyperloop Empire crashed:', error, info?.componentStack)
  }

  resetGame = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('hyperloop_') || key.startsWith('departures_')) localStorage.removeItem(key)
    })
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    const { confirmReset } = this.state
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', padding: '24px', boxSizing: 'border-box' }}>
        <div style={{ background: 'rgb(255, 239, 224)', border: '2px solid black', borderRadius: '12px', padding: '32px 24px', maxWidth: '400px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
          <h2 style={{ fontFamily: 'Courier New, monospace', color: '#f5a623', margin: '0 0 12px' }}>Something went wrong</h2>
          <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 20px' }}>
            {confirmReset
              ? 'This deletes your terminal and all progress on this browser. It can\'t be undone. Download your save first if you might want it back.'
              : 'Hyperloop Empire hit an error. Try reloading. If it keeps happening, download your save, then reset the game.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            {!confirmReset && <button className="closeButton" onClick={() => window.location.reload()}>Reload</button>}
            <button className="closeButton" onClick={() => exportSave()}>Download my save</button>
            {confirmReset
              ? <>
                  <button className="closeButton" style={{ background: '#c0392b', color: 'white' }} onClick={this.resetGame}>Yes, delete everything</button>
                  <button className="closeButton" onClick={() => this.setState({ confirmReset: false })}>Cancel</button>
                </>
              : <button className="closeButton" onClick={() => this.setState({ confirmReset: true })}>Reset game</button>}
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
