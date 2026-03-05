import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Bell } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuthStore } from '../../store/authStore'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore((s) => s.user)

  return (
    <div className="flex h-screen overflow-hidden bg-brand-cream">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-brand-gray hover:text-brand-black"
          >
            <Menu size={22} />
          </button>

          <div className="hidden lg:block">
            <h2 className="text-sm font-medium text-brand-gray">
              Welcome back, <span className="text-brand-black font-semibold">{user?.first_name}</span>
            </h2>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 text-brand-gray hover:text-brand-black rounded-lg hover:bg-brand-gray-light transition-colors">
              <Bell size={18} />
            </button>
            <div className="w-8 h-8 rounded-full bg-brand-black flex items-center justify-center text-xs font-bold text-white">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
