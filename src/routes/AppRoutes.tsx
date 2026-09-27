import { Link, Route, Routes } from 'react-router-dom'
import { LandingPage } from '../pages/LandingPage'

function Placeholder({ title }: { title: string }) {
  return <><h1 className="text-3xl tracking-tight sm:text-4xl">{title}</h1><p className="mt-4 text-ink-muted">This page is being prepared. Please check back soon.</p></>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Placeholder title="Log in" />} />
      <Route path="/register" element={<Placeholder title="Create an account" />} />
      <Route path="/artisans" element={<Placeholder title="Find an artisan" />} />
      <Route path="/artisans/:artisanId" element={<Placeholder title="Artisan profile" />} />
      <Route path="/customer/*" element={<Placeholder title="Customer dashboard" />} />
      <Route path="/artisan/*" element={<Placeholder title="Artisan dashboard" />} />
      <Route path="/admin/*" element={<Placeholder title="Admin dashboard" />} />
      <Route path="*" element={<><h1 className="text-3xl tracking-tight">Page not found</h1><p className="mt-4 text-ink-muted">We couldn’t find that page.</p><Link to="/" className="mt-6 inline-flex min-h-11 items-center">Return home</Link></>} />
    </Routes>
  )
}
