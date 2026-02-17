'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { HeartbeatProvider } from '@/components/HeartbeatProvider'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <HeartbeatProvider />
      <DashboardLayout>{children}</DashboardLayout>
    </ErrorBoundary>
  )
}
