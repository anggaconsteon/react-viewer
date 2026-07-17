import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// All runtime galleries live behind one switcher — pick from the top bar, no import editing.
import RuntimeLauncher from './component/RuntimeLauncher.jsx'
// import RuntimeLauncher from './component/web/assignee-kejadian'
// import RuntimeLauncher from './component/web/ComplaintModule'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RuntimeLauncher />
  </StrictMode>,
)
