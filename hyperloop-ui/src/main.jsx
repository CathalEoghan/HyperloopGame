import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// The fonts ship with the game instead of coming from Google Fonts, so no player's IP address goes to Google (bug #182)
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/b612-mono/400.css'
import '@fontsource/b612-mono/700.css'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { applyCosmetics } from './utils/cosmetics.js'

// The Shop's equipped themes go onto the page before the first paint, so there is no flash of the default look
applyCosmetics()

createRoot(document.getElementById('root')).render(
  <StrictMode>
        <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
