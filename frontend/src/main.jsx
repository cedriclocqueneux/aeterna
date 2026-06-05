import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n.js'
import App from './App.jsx'

// Injection optionnelle de Plausible Analytics
// Configurer VITE_PLAUSIBLE_DOMAIN et VITE_PLAUSIBLE_URL dans .env pour activer
const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN
const plausibleUrl = import.meta.env.VITE_PLAUSIBLE_URL
if (plausibleDomain && plausibleUrl) {
  const script = document.createElement('script')
  script.defer = true
  script.dataset.domain = plausibleDomain
  script.src = `${plausibleUrl}/js/script.js`
  document.head.appendChild(script)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)