'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { BrandLogo } from '@/components/BrandLogo'

export default function Navbar() {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check auth status
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setIsAuthenticated(true)
          setUser(data.user)
        }
      })
      .catch(() => setIsAuthenticated(false))
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const isPublicPage = pathname === '/' || pathname === '/about' || pathname === '/login' || pathname === '/register' || pathname === '/terms' || pathname === '/privacy'

  if (!isPublicPage && !isAuthenticated) {
    return null // Don't show navbar on protected pages if not authenticated
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <BrandLogo href={isAuthenticated ? '/dashboard' : '/'} size="md" variant="dark" />

          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium ${pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/network"
                  className={`text-sm font-medium ${pathname === '/network' ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  My Network
                </Link>
                <Link
                  href="/projects"
                  className={`text-sm font-medium ${pathname === '/projects' ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  Projects
                </Link>
                <Link
                  href="/income"
                  className={`text-sm font-medium ${pathname === '/income' ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  Income
                </Link>
                <Link
                  href="/training"
                  className={`text-sm font-medium ${pathname === '/training' ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  Training
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className={`text-sm font-medium ${pathname?.startsWith('/admin') ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/about"
                  className={`text-sm font-medium ${pathname === '/about' ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  About
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
