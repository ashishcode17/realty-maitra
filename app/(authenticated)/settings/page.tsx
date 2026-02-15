'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AvatarWithAuth } from '@/components/AvatarWithAuth'
import { authHeaders } from '@/lib/authFetch'
import {
  User,
  Shield,
  Bell,
  Eye,
  Palette,
  FileText,
  Loader2,
  LogOut,
  Smartphone,
  Lock,
} from 'lucide-react'
import { toast } from 'sonner'

type TabId = 'profile' | 'security' | 'notifications' | 'privacy' | 'app' | 'legal' | 'admin'

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [profileForm, setProfileForm] = useState({ name: '', city: '' })
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarRemoving, setAvatarRemoving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirm: '' })
  const [reportForm, setReportForm] = useState({ category: 'other', message: '' })
  const [reportSending, setReportSending] = useState(false)
  const [logoutAllLoading, setLogoutAllLoading] = useState(false)
  const [adminSeedLoading, setAdminSeedLoading] = useState(false)
  const [adminClearLoading, setAdminClearLoading] = useState(false)

  const headers = authHeaders()
  const loadData = async () => {
    try {
      const res = await fetch('/api/settings/me', { headers })
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setUser(data.user)
      setSettings(data.settings || {})
      setProfileForm({
        name: data.user?.name || '',
        city: data.user?.city || '',
      })
    } catch (e) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const loadSessions = async () => {
    const res = await fetch('/api/settings/sessions', { headers })
    if (res.ok) {
      const data = await res.json()
      setSessions(data.sessions || [])
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['profile', 'security', 'notifications', 'privacy', 'app', 'legal', 'admin'].includes(tab)) {
      setActiveTab(tab as TabId)
    }
  }, [searchParams])
  useEffect(() => {
    if (activeTab === 'security') loadSessions()
  }, [activeTab])

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim() || profileForm.name.length < 2) {
      toast.error('Name must be at least 2 characters')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/settings/me', {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          city: profileForm.city.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      toast.success('Profile saved')
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      toast.error('Fill in current and new password')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirm) {
      toast.error('New passwords do not match')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/settings/change-password', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password')
      toast.success('Password changed')
      setPasswordForm({ oldPassword: '', newPassword: '', confirm: '' })
    } catch (e: any) {
      toast.error(e.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async (prefs: any) => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/me', {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationPrefs: prefs }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSettings((s: any) => ({ ...s, notificationPrefs: { ...s?.notificationPrefs, ...prefs } }))
      toast.success('Notification preferences saved')
    } catch (e) {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePrivacy = async (prefs: any) => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/me', {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacyPrefs: prefs }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSettings((s: any) => ({ ...s, privacyPrefs: { ...s?.privacyPrefs, ...prefs } }))
      toast.success('Privacy settings saved')
    } catch (e) {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAppPrefs = async (prefs: any) => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/me', {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ appPrefs: prefs }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSettings((s: any) => ({ ...s, appPrefs: { ...s?.appPrefs, ...prefs } }))
      toast.success('App preferences saved')
    } catch (e) {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoutAll = async () => {
    if (!confirm('Log out from all devices? You will need to sign in again here.')) return
    setLogoutAllLoading(true)
    try {
      const res = await fetch('/api/settings/logout-all', { method: 'POST', headers })
      if (!res.ok) throw new Error('Failed')
      localStorage.removeItem('token')
      toast.success('Logged out from all devices')
      window.location.href = '/login'
    } catch (e) {
      toast.error('Failed to log out from all devices')
      setLogoutAllLoading(false)
    }
  }

  const handleReport = async () => {
    if (!reportForm.message.trim() || reportForm.message.length < 10) {
      toast.error('Message must be at least 10 characters')
      return
    }
    setReportSending(true)
    try {
      const res = await fetch('/api/settings/report', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: reportForm.category, message: reportForm.message.trim() }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      toast.success('Report submitted. We will get back to you.')
      setReportForm({ category: 'other', message: '' })
    } catch (e) {
      toast.error('Failed to submit report')
    } finally {
      setReportSending(false)
    }
  }

  const handleAdminSeed = async () => {
    if (!confirm('Run demo seeder? This will add/refresh demo data.')) return
    setAdminSeedLoading(true)
    try {
      const res = await fetch('/api/admin/demo/seed', { method: 'POST', headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Demo data seeded')
    } catch (e: any) {
      toast.error(e.message || 'Failed to seed')
    } finally {
      setAdminSeedLoading(false)
    }
  }

  const handleAdminClear = async () => {
    if (!confirm('Clear all demo data? This cannot be undone.')) return
    setAdminClearLoading(true)
    try {
      const res = await fetch('/api/admin/demo/clear', { method: 'POST', headers })
      if (!res.ok) throw new Error('Failed')
      toast.success('Demo data cleared')
    } catch (e: any) {
      toast.error(e.message || 'Failed to clear')
    } finally {
      setAdminClearLoading(false)
    }
  }

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
  const notifPrefs = settings?.notificationPrefs || {}
  const privacyPrefs = settings?.privacyPrefs || {}
  const appPrefs = settings?.appPrefs || {}

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700 p-1 flex flex-wrap gap-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-slate-700 text-slate-300">Profile</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-slate-700 text-slate-300">Account & Security</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-700 text-slate-300">Notifications</TabsTrigger>
          <TabsTrigger value="privacy" className="data-[state=active]:bg-slate-700 text-slate-300">Privacy</TabsTrigger>
          <TabsTrigger value="app" className="data-[state=active]:bg-slate-700 text-slate-300">App</TabsTrigger>
          <TabsTrigger value="legal" className="data-[state=active]:bg-slate-700 text-slate-300">Legal</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin" className="data-[state=active]:bg-amber-900/50 text-amber-200">Admin</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><User className="h-5 w-5" /> Profile Settings</CardTitle>
              <CardDescription className="text-slate-400">Update your name, city, and profile photo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <AvatarWithAuth userId={user?.id} name={user?.name} size="xl" />
                <div className="flex-1 space-y-2">
                  <Label className="text-slate-300">Profile photo</Label>
                  <p className="text-slate-400 text-sm">JPG, PNG or WebP. Max 5MB.</p>
                  <div className="flex flex-wrap gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={avatarUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('File too large. Max 5MB.')
                            return
                          }
                          setAvatarUploading(true)
                          try {
                            const form = new FormData()
                            form.append('file', file)
                            const res = await fetch('/api/settings/avatar', {
                              method: 'POST',
                              headers: { ...headers },
                              body: form,
                            })
                            const data = await res.json()
                            if (!res.ok) throw new Error(data.error || 'Upload failed')
                            toast.success('Profile photo updated')
                            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('avatar-updated'))
                            loadData()
                          } catch (err: any) {
                            toast.error(err.message || 'Upload failed')
                          } finally {
                            setAvatarUploading(false)
                            e.target.value = ''
                          }
                        }}
                      />
                      <span className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700">
                        {avatarUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Upload photo
                      </span>
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={avatarRemoving || !user?.profilePhotoUrl}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={async () => {
                        setAvatarRemoving(true)
                        try {
                          const res = await fetch('/api/settings/avatar', { method: 'DELETE', headers })
                          if (!res.ok) throw new Error('Failed to remove')
                          toast.success('Photo removed')
                          if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('avatar-updated'))
                          loadData()
                        } catch {
                          toast.error('Failed to remove photo')
                        } finally {
                          setAvatarRemoving(false)
                        }
                      }}
                    >
                      {avatarRemoving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Full name</Label>
                  <Input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">City</Label>
                  <Input
                    value={profileForm.city}
                    onChange={(e) => setProfileForm((p) => ({ ...p, city: e.target.value }))}
                    placeholder="Optional"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-slate-900/50 border border-slate-700 p-4 space-y-2">
                <p className="text-sm font-medium text-slate-400">Read-only</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-500">Role</span><p className="text-white">{user?.role}</p></div>
                  <div><span className="text-slate-500">Sponsor / Parent</span><p className="text-white">{user?.sponsor?.name || '—'}</p></div>
                  <div><span className="text-slate-500">Join date</span><p className="text-white">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</p></div>
                  <div><span className="text-slate-500">Member ID</span><p className="text-white font-mono text-xs">{user?.id?.slice(0, 12)}...</p></div>
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Lock className="h-5 w-5" /> Change password</CardTitle>
              <CardDescription className="text-slate-400">Requires your current password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Current password</Label>
                <Input type="password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">New password</Label>
                <Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Confirm new password</Label>
                <Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <Button onClick={handleChangePassword} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Change password
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">Email & phone</CardTitle>
              <CardDescription className="text-slate-400">Read-only for now. Contact support to change.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><span className="text-slate-500 text-sm">Email</span><p className="text-white">{user?.email}</p></div>
              <div><span className="text-slate-500 text-sm">Phone</span><p className="text-white">{user?.phone || '—'}</p></div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Smartphone className="h-5 w-5" /> Sessions / devices</CardTitle>
              <CardDescription className="text-slate-400">Active sessions and log out from all devices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessions.length === 0 ? (
                <p className="text-slate-400 text-sm">No sessions recorded. Sessions are created when you sign in.</p>
              ) : (
                <ul className="space-y-2">
                  {sessions.map((s) => (
                    <li key={s.id} className="flex items-center justify-between py-2 border-b border-slate-700 text-sm">
                      <span className="text-slate-300 truncate max-w-md">{s.deviceInfo}</span>
                      <span className="text-slate-500">{new Date(s.lastActive).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="outline" onClick={handleLogoutAll} disabled={logoutAllLoading} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                {logoutAllLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />} Log out from all devices
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Shield className="h-5 w-5" /> Two-factor authentication</CardTitle>
              <CardDescription className="text-slate-400">Coming soon — add an extra layer of security</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-slate-600 p-6 text-center text-slate-400">
                <p className="font-medium">Coming soon</p>
                <p className="text-sm mt-1">2FA will be available in a future update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Bell className="h-5 w-5" /> Notification preferences</CardTitle>
              <CardDescription className="text-slate-400">Choose what you want to be notified about (in-app and email)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: 'productUpdates', label: 'Product updates / notices' },
                { key: 'trainingReminders', label: 'Training session reminders' },
                { key: 'challengeUpdates', label: 'Challenge updates' },
                { key: 'earningsUpdates', label: 'Earnings updates' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-slate-700">
                  <div>
                    <p className="text-white font-medium">{label}</p>
                    <p className="text-slate-400 text-sm">In-app and email</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-sm">In-app</span>
                      <Switch
                        checked={notifPrefs[key]?.inApp !== false}
                        onCheckedChange={(v) => handleSaveNotifications({ [key]: { ...notifPrefs[key], inApp: v } })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-sm">Email</span>
                      <Switch
                        checked={notifPrefs[key]?.email !== false}
                        onCheckedChange={(v) => handleSaveNotifications({ [key]: { ...notifPrefs[key], email: v } })}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {saving && <p className="text-slate-400 text-sm">Saving…</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Eye className="h-5 w-5" /> Privacy & visibility</CardTitle>
              <CardDescription className="text-slate-400">Who can see your contact and location (enforced server-side)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Show my phone to</Label>
                <Select value={privacyPrefs.phoneVisibility || 'ADMIN_ONLY'} onValueChange={(v) => handleSavePrivacy({ phoneVisibility: v })}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN_ONLY">Admin only</SelectItem>
                    <SelectItem value="UPLINE_ONLY">Direct upline only</SelectItem>
                    <SelectItem value="NOBODY">Nobody</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Show my email to</Label>
                <Select value={privacyPrefs.emailVisibility || 'ADMIN_ONLY'} onValueChange={(v) => handleSavePrivacy({ emailVisibility: v })}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN_ONLY">Admin only</SelectItem>
                    <SelectItem value="UPLINE_ONLY">Direct upline only</SelectItem>
                    <SelectItem value="NOBODY">Nobody</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Show my city to</Label>
                <Select value={privacyPrefs.cityVisibility || 'SUBTREE'} onValueChange={(v) => handleSavePrivacy({ cityVisibility: v })}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUBTREE">Everyone in my subtree</SelectItem>
                    <SelectItem value="DIRECT_ONLY">Direct upline only</SelectItem>
                    <SelectItem value="NOBODY">Nobody</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-slate-500 text-sm">Your privacy choices apply across the platform.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="app" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Palette className="h-5 w-5" /> App preferences</CardTitle>
              <CardDescription className="text-slate-400">Theme, language, and display</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Theme</Label>
                <Select value={appPrefs.theme || 'system'} onValueChange={(v) => handleSaveAppPrefs({ theme: v })}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Language</Label>
                <Select value={appPrefs.language || 'en'} onValueChange={(v) => handleSaveAppPrefs({ language: v })}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hinglish">Hinglish</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-slate-500 text-sm">UI text remains English; preference stored for future use.</p>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-white font-medium">Compact mode</p>
                  <p className="text-slate-400 text-sm">Tighter spacing (optional)</p>
                </div>
                <Switch
                  checked={!!appPrefs.compactMode}
                  onCheckedChange={(v) => handleSaveAppPrefs({ compactMode: v })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><FileText className="h-5 w-5" /> Legal & support</CardTitle>
              <CardDescription className="text-slate-400">Terms, privacy, version, and report a problem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <a href="/terms" className="text-emerald-500 hover:underline">Terms & Conditions</a>
                <a href="/privacy" className="text-emerald-500 hover:underline">Privacy Policy</a>
              </div>
              <div className="rounded-lg bg-slate-900/50 border border-slate-700 p-4 text-sm text-slate-400">
                <p><strong className="text-slate-300">App version:</strong> 0.1.0</p>
                <p><strong className="text-slate-300">Build:</strong> Development</p>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Report a problem</Label>
                <Select value={reportForm.category} onValueChange={(v) => setReportForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="feature">Feature request</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  value={reportForm.message}
                  onChange={(e) => setReportForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Describe the issue (min 10 characters)..."
                  rows={4}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                />
                <Button onClick={handleReport} disabled={reportSending} className="bg-emerald-600 hover:bg-emerald-700">
                  {reportSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Submit report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin" className="space-y-6">
            <Card className="bg-slate-800 border-amber-900/50 border">
              <CardHeader>
                <CardTitle className="text-amber-200">Quick Admin Tools</CardTitle>
                <CardDescription className="text-slate-400">Dev-only. Disabled in production.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button onClick={handleAdminSeed} disabled={adminSeedLoading} variant="outline" className="border-slate-600 text-slate-300">
                    {adminSeedLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Run Demo Seeder
                  </Button>
                  <Button onClick={handleAdminClear} disabled={adminClearLoading} variant="outline" className="border-red-900/50 text-red-300">
                    {adminClearLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Clear Demo Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
