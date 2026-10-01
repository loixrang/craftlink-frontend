import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { SeoMetadata } from '../components/SeoMetadata'
import { LandingPage } from '../pages/LandingPage'
import { RegisterPage } from '../pages/RegisterPage'
import { LoginPage } from '../pages/LoginPage'
import { CategoriesPage } from '../pages/CategoriesPage'
import { ArtisanProfilePage } from '../pages/ArtisanProfilePage'
import { CustomerDashboardPage } from '../pages/CustomerDashboardPage'
import { ArtisanDashboardPage } from '../pages/ArtisanDashboardPage'
import { ArtisanRequestsPage } from '../pages/ArtisanRequestsPage'
import { AdminDashboardPage } from '../pages/AdminDashboardPage'
import { ArtisanMediaPage } from '../pages/ArtisanMediaPage'
import { ArtisanManagementPage } from '../pages/ArtisanManagementPage'
import { CreateServiceRequestPage } from '../pages/CreateServiceRequestPage'
import { CustomerRequestsPage } from '../pages/CustomerRequestsPage'
import { CustomerAccountPage } from '../pages/CustomerAccountPage'
import { RequireRole, SessionGate } from './RequireRole'

export function AppRoutes() {
  return (
    <>
    <RouteSeoMetadata />
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<SessionGate><LoginPage /></SessionGate>} />
      <Route path="/register" element={<SessionGate><RegisterPage /></SessionGate>} />
      <Route path="/artisans" element={<CategoriesPage />} />
      <Route path="/artisans/:artisanId" element={<ArtisanProfilePage />} />
      <Route path="/customer/requests/new/:artisanId" element={<RequireRole role="CUSTOMER"><CreateServiceRequestPage /></RequireRole>} />
      <Route path="/customer/requests" element={<RequireRole role="CUSTOMER"><CustomerRequestsPage /></RequireRole>} />
      <Route path="/customer/requests/:requestId" element={<RequireRole role="CUSTOMER"><CustomerRequestsPage /></RequireRole>} />
      <Route path="/customer/account" element={<RequireRole role="CUSTOMER"><CustomerAccountPage /></RequireRole>} />
      <Route path="/customer/*" element={<RequireRole role="CUSTOMER"><CustomerDashboardPage /></RequireRole>} />
      <Route path="/artisan/media" element={<RequireRole role="ARTISAN"><ArtisanMediaPage /></RequireRole>} />
      <Route path="/artisan/requests" element={<RequireRole role="ARTISAN"><ArtisanRequestsPage /></RequireRole>} />
      <Route path="/artisan/profile" element={<RequireRole role="ARTISAN"><ArtisanManagementPage /></RequireRole>} />
      <Route path="/artisan/*" element={<RequireRole role="ARTISAN"><ArtisanDashboardPage /></RequireRole>} />
      <Route path="/admin/*" element={<RequireRole role="ADMIN"><AdminDashboardPage key="admin-dashboard" /></RequireRole>} />
      <Route path="*" element={<><h1 className="text-3xl tracking-tight">Page not found</h1><p className="mt-4 text-ink-muted">We couldn’t find that page.</p><Link to="/" className="mt-6 inline-flex min-h-11 items-center">Return home</Link></>} />
    </Routes>
    </>
  )
}

function RouteSeoMetadata() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/artisans/')) return null
  if (pathname === '/') return <SeoMetadata title="Find skilled local artisans | Craftlink" description="Find skilled local artisans for repairs, home projects and more. Explore services and connect with artisans through Craftlink." canonicalPath="/" />
  if (pathname === '/artisans') return <SeoMetadata title="Explore artisan services | Craftlink" description="Browse Craftlink service categories and discover skilled artisans for repairs, home projects and everyday needs." canonicalPath="/artisans" />
  return <SeoMetadata title="Craftlink" description="Connect with skilled artisans through Craftlink." canonicalPath={pathname} indexable={false} />
}
