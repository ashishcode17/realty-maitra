'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <DashboardLayout>{children}</DashboardLayout>
    </ErrorBoundary>
  )
}
