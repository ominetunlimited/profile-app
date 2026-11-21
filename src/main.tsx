import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/plus-jakarta-sans/wght.css'
import '@fontsource-variable/jetbrains-mono/wght.css'
import './app/theme'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
