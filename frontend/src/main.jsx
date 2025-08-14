import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AirportProvider } from './context/AirportContext.jsx' // ✅ 1. استيراد

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AirportProvider> {/* ✅ 2. إضافة المزود هنا */}
      <App />
    </AirportProvider>
  </StrictMode>,
)