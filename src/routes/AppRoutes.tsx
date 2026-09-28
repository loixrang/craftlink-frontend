import { Link, Route, Routes } from 'react-router-dom'
import { LandingPage } from '../pages/LandingPage'
import { RegisterPage } from '../pages/RegisterPage'
import { LoginPage } from '../pages/LoginPage'
import { CategoriesPage } from '../pages/CategoriesPage'
import { RequireRole, SessionGate } from './RequireRole'

function Placeholder({ title }: { title: string }) {
  return <><h1 className="text-3xl tracking-tight sm:text-4xl">{title}</h1><p className="mt-4 text-ink-muted">This page is being prepared. Please check back soon.</p></>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<SessionGate><LoginPage /></SessionGate>} />
      <Route path="/register" element={<SessionGate><RegisterPage /></SessionGate>} />
      <Route path="/artisans" element={<CategoriesPage />} />
      <Route path="/artisans/:artisanId" element={<Placeholder title="Artisan profile" />} />
      <Route path="/customer/*" element={<RequireRole role="CUSTOMER"><Placeholder title="Customer dashboard" /></RequireRole>} />
      <Route path="/artisan/*" element={<RequireRole role="ARTISAN"><Placeholder title="Artisan dashboard" /></RequireRole>} />
      <Route path="/admin/*" element={<RequireRole role="ADMIN"><Placeholder title="Admin dashboard" /></RequireRole>} />
      <Route path="*" element={<><h1 className="text-3xl tracking-tight">Page not found</h1><p className="mt-4 text-ink-muted">We couldn’t find that page.</p><Link to="/" className="mt-6 inline-flex min-h-11 items-center">Return home</Link></>} />
    </Routes>
  )
}
