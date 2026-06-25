import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAuthStore } from '@/stores/authStore'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/features/auth/LoginPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { UserManagementPage } from "@/features/users/UserManagementPage";
import CategoryManagementPage from "@/features/products/CategoryManagementPage";
import SizeManagementPage from "@/features/products/SizeManagementPage";
import OptionManagementPage from "@/features/products/OptionManagementPage";
import ProductManagementPage from "@/features/products/ProductManagementPage";
import PosPage from "@/features/pos/PosPage";
import OrderHistoryPage from "@/features/orders/OrderHistoryPage";
import SettingsPage from "@/features/settings/SettingsPage";
import { ShiftHistoryPage } from "@/features/shift/ShiftHistoryPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
})

function AppRoutes() {
  const { hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/categories" element={<CategoryManagementPage />} />
        <Route path="/admin/sizes" element={<SizeManagementPage />} />
        <Route path="/admin/options" element={<OptionManagementPage />} />
        <Route path="/admin/products" element={<ProductManagementPage />} />
        <Route path="/pos" element={<PosPage />} />
        <Route path="/admin/orders" element={<OrderHistoryPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
        <Route
          path="/admin/shifts"
          element={<ProtectedRoute roles={['OWNER']}><ShiftHistoryPage /></ProtectedRoute>}
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
