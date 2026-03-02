import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  LogOut,
  Menu,
  X,
  ChevronDown,
  User as UserIcon,
  Bell,
  Search,
  ScanFace,
  Activity,
  Sun,
  Moon
} from 'lucide-react'
import { useState, useEffect } from 'react'

function Layout({ children }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { id: 'chat', label: 'Chat Assistant' },
    { id: 'reports', label: 'Report Analyzer' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'doctors', label: 'Doctors' },
    { id: 'heatmap', label: 'Outbreak Radar' },
  ]

  // Standalone page links (not scroll sections)
  const standaloneLinks = [
    { path: '/face-severity', label: 'Health Analysis', icon: Activity },
    { path: '/face-registration', label: 'Face Registration', icon: ScanFace },
  ]

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // Header height
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = element.getBoundingClientRect().top
      const elementPosition = elementRect - bodyRect
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-secondary)] selection:bg-cyan-500/30">

      {/* ── Sticky Top Navbar ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled
          ? 'bg-[var(--bg-navbar)] py-3 border-[var(--border-color)] shadow-lg'
          : 'bg-[var(--bg-navbar)] py-5 border-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
              <span className="text-white font-black text-xl italic mt-[-2px]">M</span>
            </div>
            <div>
              <h1 className="text-[var(--text-primary)] font-bold text-xl tracking-tight leading-none group-hover:text-cyan-400 transition-colors">MediTriage</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/80 font-bold mt-0.5">AI Health Core</p>
            </div>
          </div>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-sm font-semibold text-[var(--text-primary)] hover:text-cyan-400 transition-colors relative group py-2"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
            {/* Standalone Page Links */}
            {standaloneLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm font-semibold text-[var(--text-primary)] hover:text-cyan-400 transition-colors relative group py-2 flex items-center gap-1.5"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all duration-300 relative group"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <div className="relative w-5 h-5">
                <Sun 
                  className={`h-5 w-5 absolute inset-0 transform transition-all duration-300 ${
                    isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                  }`} 
                />
                <Moon 
                  className={`h-5 w-5 absolute inset-0 transform transition-all duration-300 ${
                    isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
                  }`} 
                />
              </div>
              {/* Tooltip */}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                {isDark ? 'Light mode' : 'Dark mode'}
              </span>
            </button>
            
            <button className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[var(--bg-navbar)]" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full border border-[var(--border-color)] hover:border-cyan-500/50 transition-all bg-[var(--bg-tertiary)]/50"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-[var(--text-primary)] leading-none">{user?.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-tighter">Premium Account</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center text-cyan-400 font-bold text-sm border border-cyan-500/30">
                  {user?.name?.charAt(0)}
                </div>
                <ChevronDown className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-[var(--bg-dropdown)] border border-[var(--border-color)] rounded-2xl shadow-2xl py-2 animate-scale-in z-[60]">
                  <div className="px-4 py-3 border-b border-[var(--border-color)] mb-2">
                    <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-widest">Signed in as</p>
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user?.email}</p>
                  </div>
                  <button onClick={() => { scrollToSection('profile'); setProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-cyan-500/10 hover:text-cyan-400 flex items-center gap-3 transition-colors">
                    <UserIcon className="h-4 w-4" /> Account Profile
                  </button>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="pt-24 pb-20">
        <div className="max-w-[1600px] mx-auto px-6">
          {children}
        </div>
      </main>

      {/* ── Simple Footer ── */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-footer)] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center">
              <span className="text-white font-black text-sm italic">M</span>
            </div>
            <span className="text-[var(--text-primary)] font-bold tracking-tight">MediTriage AI</span>
          </div>
          <div className="flex gap-8 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
            <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Hospital Login</a>
          </div>
          <p className="text-xs text-[var(--text-muted)]">© 2026 MediTriage Systems. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
