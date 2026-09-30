import { Link, Route, Routes } from 'react-router-dom'
import { LandingPage } from '../pages/LandingPage'
import { RegisterPage } from '../pages/RegisterPage'
import { LoginPage } from '../pages/LoginPage'
import { CategoriesPage } from '../pages/CategoriesPage'
import { ArtisanProfilePage } from '../pages/ArtisanProfilePage'
import { CustomerDashboardPage } from '../pages/CustomerDashboardPage'
import { ArtisanDashboardPage } from '../pages/ArtisanDashboardPage'
import { ArtisanRequestsPage } from '../pages/ArtisanRequestsPage'
import { ArtisanMediaPage } from '../pages/ArtisanMediaPage'
import { ArtisanManagementPage } from '../pages/ArtisanManagementPage'
import { CreateServiceRequestPage } from '../pages/CreateServiceRequestPage'
import { CustomerRequestsPage } from '../pages/CustomerRequestsPage'
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
      <Route path="/artisans/:artisanId" element={<ArtisanProfilePage />} />
      <Route path="/customer/requests/new/:artisanId" element={<RequireRole role="CUSTOMER"><CreateServiceRequestPage /></RequireRole>} />
      <Route path="/customer/requests" element={<RequireRole role="CUSTOMER"><CustomerRequestsPage /></RequireRole>} />
      <Route path="/customer/requests/:requestId" element={<RequireRole role="CUSTOMER"><CustomerRequestsPage /></RequireRole>} />
      <Route path="/customer/*" element={<RequireRole role="CUSTOMER"><CustomerDashboardPage /></RequireRole>} />
      <Route path="/artisan/media" element={<RequireRole role="ARTISAN"><ArtisanMediaPage /></RequireRole>} />
      <Route path="/artisan/requests" element={<RequireRole role="ARTISAN"><ArtisanRequestsPage /></RequireRole>} />
      <Route path="/artisan/profile" element={<RequireRole role="ARTISAN"><ArtisanManagementPage /></RequireRole>} />
      <Route path="/artisan/*" element={<RequireRole role="ARTISAN"><ArtisanDashboardPage /></RequireRole>} />
      <Route path="/admin/*" element={<RequireRole role="ADMIN"><Placeholder title="Admin dashboard" /></RequireRole>} />
      <Route path="*" element={<><h1 className="text-3xl tracking-tight">Page not found</h1><p className="mt-4 text-ink-muted">We couldn’t find that page.</p><Link to="/" className="mt-6 inline-flex min-h-11 items-center">Return home</Link></>} />
    </Routes>
  )
}
