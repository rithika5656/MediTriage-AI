/**
 * Layout Component – Professional Navy Blue Theme
 */
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  MessageCircle,
  Calendar,
  Users,
  User,
  LogOut,
  Activity,
  Menu,
  X,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'

function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/chat', icon: MessageCircle, label: 'Chat Assistant' },
    { path: '/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/doctors', icon: Users, label: 'Doctors' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface-2)' }}>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(5, 16, 30, 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 flex flex-col
        w-64 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{
          background: 'linear-gradient(180deg, #05101e 0%, #091528 35%, #0f213e 70%, #152d54 100%)',
          boxShadow: '4px 0 24px rgba(5, 16, 30, 0.4)'
        }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #4e8cff, #1b3a6b)' }}>
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg leading-tight">MediTriage</span>
            <p className="text-xs" style={{ color: 'rgba(160,180,220,0.7)' }}>Smart Patient Care</p>
          </div>
          <button
            className="ml-auto lg:hidden p-1 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto scrollbar-thin">
          <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(160,180,220,0.5)' }}>
            Menu
          </p>
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium group
                ${isActive
                  ? 'text-white'
                  : 'text-[rgba(180,200,230,0.7)] hover:text-white'
                }
              `}
              style={({ isActive }) => isActive ? {
                background: 'rgba(78, 140, 255, 0.18)',
                boxShadow: 'inset 0 0 0 1px rgba(78, 140, 255, 0.3)',
              } : {}}
            >
              {({ isActive }) => (
                <>
                  <span className={`p-1.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-[rgba(78,140,255,0.25)]' : 'group-hover:bg-white/10'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info & Logout */}
        <div className="px-3 pb-5 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #4e8cff 0%, #1b3a6b 100%)' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(160,180,220,0.6)' }}>{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
                       transition-all duration-200 hover:bg-red-500/15"
            style={{ color: 'rgba(248, 113, 113, 0.85)' }}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center h-14 px-4 border-b bg-white"
          style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
          >
            <Menu className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4e8cff, #1b3a6b)' }}>
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>MediTriage</span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto scrollbar-thin">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
