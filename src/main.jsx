import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Temporarily showing the Driver Runtime page gallery (P1–S1 mapping).
// Revert: swap the import back to './App.jsx'.
import App from './component/DriverRuntimeGallery2.jsx'
// import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
