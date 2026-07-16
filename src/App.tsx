import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/hooks/use-auth'
import { I18nProvider } from '@/hooks/use-i18n'

import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Checklists from '@/pages/Checklists'
import ServiceOrders from '@/pages/ServiceOrders'
import Documents from '@/pages/Documents'
import Team from '@/pages/Team'
import Approvals from '@/pages/Approvals'
import Qualifications from '@/pages/Qualifications'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <I18nProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/checklists" element={<Checklists />} />
              <Route path="/service-orders" element={<ServiceOrders />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/qualifications" element={<Qualifications />} />
              <Route path="/team" element={<Team />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </I18nProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
