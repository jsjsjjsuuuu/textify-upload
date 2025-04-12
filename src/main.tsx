
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/base.css'
import './styles/theme.css'
import './styles/components.css'
import './styles/animations.css'
import './styles/glassmorphism.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
