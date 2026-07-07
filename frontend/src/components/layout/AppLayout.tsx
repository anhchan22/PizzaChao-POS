import { useState, useCallback, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

const MOBILE_BREAKPOINT = 768

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  )

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    setIsMobile(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useIsMobile()

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header — only visible on small screens */}
      {isMobile && (
        <MobileHeader onMenuToggle={() => setMobileOpen(true)} />
      )}

      {/* Sidebar — fixed on desktop, overlay sheet on mobile */}
      {isMobile ? (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="!w-[280px] p-0 sm:!w-[320px]" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <Sidebar
              collapsed={false}
              onToggle={closeMobile}
              isMobile
              onNavigate={closeMobile}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Main content */}
      <div
        className={cn(
          'min-h-screen transition-all duration-300',
          isMobile
            ? 'ml-0 pt-14' /* no margin, space for mobile header */
            : sidebarCollapsed ? 'ml-[68px]' : 'ml-[240px]'
        )}
      >
        <main className="p-3">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
