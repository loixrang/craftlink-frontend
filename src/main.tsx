import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AppProviders } from './app/AppProviders'

const root = document.getElementById('root')

if (!root) {
  throw new Error('The application root element is missing.')
}

createRoot(root).render(
  <StrictMode>
    <AppProviders><BrowserRouter><App /></BrowserRouter></AppProviders>
  </StrictMode>,
)
