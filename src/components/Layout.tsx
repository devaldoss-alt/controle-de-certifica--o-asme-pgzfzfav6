import { Outlet } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { CompanyProvider } from '@/hooks/use-company'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  return (
    <CompanyProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Subtle background glow */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

          <Header />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 relative z-0">
            <ErrorBoundary message="Erro ao carregar a página.">
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </CompanyProvider>
  )
}
