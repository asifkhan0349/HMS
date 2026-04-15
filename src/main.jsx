import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
import './bones/registry.js'

const DEV_CANONICAL_HOST = '127.0.0.1'

if (import.meta.env.DEV && window.location.hostname === 'localhost') {
  const canonicalUrl = new URL(window.location.href)
  canonicalUrl.hostname = DEV_CANONICAL_HOST
  window.location.replace(canonicalUrl.toString())
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
