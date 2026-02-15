'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, Users, Building2, TrendingUp, 
  BookOpen, Target, Bell, Settings, LogOut, 
  Menu, X, User, HelpCircle, Shield, Calendar, Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AvatarWithAuth } from '@/components/AvatarWithAuth'
import { BrandLogo } from '@/components/BrandLogo'
import { brand } from '@/lib/brand'
import { authHeaders } from '@/lib/authFetch'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<{
    users: { id: string; name: string; email: string; href: string }[]
    projects: { id: string; name: string; location: string; href: string }[]
    training: { id: string; title: string; category: string; href: string }[]
  } | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (searchQ.trim().length < 2) {
      setSearchResults(null)
      return
    }
    setSearchLoading(true)
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(searchQ.trim())}&limit=8`, {
        headers: authHeaders(),
      })
        .then((res) => res.json())
        .then((data) => {
          setSearchResults({
            users: data.users || [],
            projects: data.projects || [],
            training: data.training || [],
          })
        })
        .catch(() => setSearchResults(null))
        .finally(() => setSearchLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [searchQ])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  useEffect(() => {
    document.documentElement.classList.add('dark')
    return () => {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        localStorage.removeItem('token')
        throw new Error('Auth failed')
      }
      const data = await response.json()
      setUser(data.user)

      // Demo banner (optional)
      try {
        const demoRes = await fetch('/api/demo/status')
        if (demoRes.ok) {
          const demo = await demoRes.json()
          setDemoMode(Boolean(demo?.demoExists))
        }
      } catch {}
    } catch (error) {
      localStorage.removeItem('token')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
      localStorage.removeItem('token')
      toast.success('Logged out successfully')
      router.push('/login')
    } catch {
      localStorage.removeItem('token')
      toast.success('Logged out')
      router.push('/login')
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 p-4">
        <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-emerald-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    )
  }

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/network', icon: Users, label: 'My Network' },
    { href: '/projects', icon: Building2, label: 'Projects' },
    { href: '/income', icon: TrendingUp, label: 'Income' },
    { href: '/training', icon: BookOpen, label: 'Training' },
    { href: '/offers', icon: Target, label: 'Offers' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
  ]

  const isAdminUser = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const adminNavItems = isAdminUser ? [
    { href: '/admin', icon: Shield, label: 'Admin' },
    { href: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
    { href: '/admin/users', icon: Users, label: 'Members' },
    { href: '/admin/training', icon: BookOpen, label: 'Edit Training Content' },
    { href: '/admin/projects', icon: Building2, label: 'Edit Projects' },
    { href: '/admin/sessions', icon: Calendar, label: 'Edit Sessions' },
  ] : []

  return (
    <div className="dark min-h-screen bg-slate-950">
      <header
        className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white shrink-0 tap-target h-11 w-11"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <BrandLogo href={null} size="sm" variant="light" showWordmark={false} />
              <span className="text-lg font-bold text-white hidden sm:inline">{brand.appName}</span>
            </Link>
            <div ref={searchRef} className="hidden md:block flex-1 max-w-md ml-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="search"
                placeholder="Search members, projects, training..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchOpen && (searchQ.trim().length >= 2 || searchResults) && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-slate-600 bg-slate-800 shadow-xl z-50 max-h-[70vh] overflow-auto">
                  {searchLoading ? (
                    <div className="p-4 text-slate-400 text-sm">Searching…</div>
                  ) : searchResults && (searchResults.users.length + searchResults.projects.length + searchResults.training.length === 0) ? (
                    <div className="p-4 text-slate-400 text-sm">No results</div>
                  ) : searchResults ? (
                    <div className="py-2">
                      {searchResults.users.length > 0 && (
                        <div className="px-3 py-1">
                          <p className="text-xs font-medium text-slate-500 uppercase">Members</p>
                          {searchResults.users.map((u) => (
                            <Link key={u.id} href={u.href} onClick={() => setSearchOpen(false)} className="block px-3 py-2 text-sm text-white hover:bg-slate-700 rounded mx-1">
                              {u.name} · {u.email}
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.projects.length > 0 && (
                        <div className="px-3 py-1">
                          <p className="text-xs font-medium text-slate-500 uppercase">Projects</p>
                          {searchResults.projects.map((p) => (
                            <Link key={p.id} href={p.href} onClick={() => setSearchOpen(false)} className="block px-3 py-2 text-sm text-white hover:bg-slate-700 rounded mx-1">
                              {p.name} {p.location && `· ${p.location}`}
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.training.length > 0 && (
                        <div className="px-3 py-1">
                          <p className="text-xs font-medium text-slate-500 uppercase">Training</p>
                          {searchResults.training.map((t) => (
                            <Link key={t.id} href={t.href} onClick={() => setSearchOpen(false)} className="block px-3 py-2 text-sm text-white hover:bg-slate-700 rounded mx-1">
                              {t.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative tap-target h-11 w-11 rounded-full p-0 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 focus-visible:outline-none"
                aria-label="Open profile menu"
              >
                <AvatarWithAuth userId={user?.id} name={user?.name} size="md" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56 bg-slate-800 border-slate-700 text-slate-100">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-slate-700 focus:text-white">
                <Link href="/settings"><User className="mr-2 h-4 w-4" /> My Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-slate-700 focus:text-white">
                <Link href="/network"><Users className="mr-2 h-4 w-4" /> My Network</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-slate-700 focus:text-white">
                <Link href="/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-slate-700 focus:text-white">
                <Link href="/settings?tab=legal"><HelpCircle className="mr-2 h-4 w-4" /> Help / Report a Problem</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer focus:bg-red-900/50 focus:text-red-200 text-red-300">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {demoMode && (
          <div className="px-4 pb-3">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              <span className="font-semibold">DEMO MODE</span> — sample data is loaded. Files download securely via API (no public URLs).
            </div>
          </div>
        )}
      </header>

      <div className="flex">
        <aside className={`
          fixed lg:sticky top-0 left-0 z-30 h-screen
          w-64 bg-slate-900 border-r border-slate-800
          transform transition-transform lg:transform-none
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="p-4 space-y-2 mt-16 lg:mt-4">
            {[...navItems, ...adminNavItems].map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    tap-target flex items-center space-x-3 px-4 py-3 rounded-lg transition min-h-[44px]
                    ${isActive 
                      ? 'bg-emerald-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span>{item.label}</span>
                </Link>
              )
            })}

            <div className="pt-4 border-t border-slate-800">
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="tap-target flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition min-h-[44px]"
              >
                <Settings className="h-5 w-5 shrink-0" aria-hidden />
                <span>Settings</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="tap-target w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-red-400 transition min-h-[44px] text-left"
              >
                <LogOut className="h-5 w-5 shrink-0" aria-hidden />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </aside>

        <main className="app-main-dark flex-1 p-4 lg:p-8 text-white pb-20 lg:pb-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav: same destinations as sidebar, profile + logout accessible */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 flex items-center justify-around safe-area-pb"
        style={{
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
        aria-label="Primary"
      >
        <Link href="/dashboard" className="tap-target flex flex-col items-center justify-center gap-0.5 py-2 px-3 text-slate-400 hover:text-white aria-[current]:text-emerald-400" aria-current={pathname === '/dashboard' ? 'page' : undefined}>
          <LayoutDashboard className="h-6 w-6" aria-hidden />
          <span className="text-xs">Dashboard</span>
        </Link>
        <Link href="/network" className="tap-target flex flex-col items-center justify-center gap-0.5 py-2 px-3 text-slate-400 hover:text-white aria-[current]:text-emerald-400" aria-current={pathname === '/network' ? 'page' : undefined}>
          <Users className="h-6 w-6" aria-hidden />
          <span className="text-xs">Network</span>
        </Link>
        <Link href="/projects" className="tap-target flex flex-col items-center justify-center gap-0.5 py-2 px-3 text-slate-400 hover:text-white aria-[current]:text-emerald-400" aria-current={pathname === '/projects' ? 'page' : undefined}>
          <Building2 className="h-6 w-6" aria-hidden />
          <span className="text-xs">Projects</span>
        </Link>
        <Link href="/income" className="tap-target flex flex-col items-center justify-center gap-0.5 py-2 px-3 text-slate-400 hover:text-white aria-[current]:text-emerald-400" aria-current={pathname === '/income' ? 'page' : undefined}>
          <TrendingUp className="h-6 w-6" aria-hidden />
          <span className="text-xs">Income</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="tap-target flex flex-col items-center justify-center gap-0.5 py-2 px-3 text-slate-400 hover:text-white"
          aria-label="Open menu for Training, Offers, Notifications, Settings and Logout"
        >
          <Menu className="h-6 w-6" aria-hidden />
          <span className="text-xs">More</span>
        </button>
      </nav>

      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
