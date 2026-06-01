import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { bootstrapAppSettings } from './context/AppSettingsContext'
import './index.css'

bootstrapAppSettings()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
