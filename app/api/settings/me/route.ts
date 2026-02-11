import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import {
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_PRIVACY_PREFS,
  DEFAULT_APP_PREFS,
} from '@/lib/settingsDefaults'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        profilePhotoUrl: true,
        role: true,
        sponsorId: true,
        sponsorCode: true,
        createdAt: true,
        emailVerified: true,
        phoneVerified: true,
        sponsor: { select: { id: true, name: true, email: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let settings = await prisma.userSettings.findUnique({
      where: { userId: auth.userId },
    })

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: auth.userId,
          notificationPrefs: JSON.stringify(DEFAULT_NOTIFICATION_PREFS),
          privacyPrefs: JSON.stringify(DEFAULT_PRIVACY_PREFS),
          appPrefs: JSON.stringify(DEFAULT_APP_PREFS),
        },
      })
    }

    const notificationPrefs = JSON.parse(settings.notificationPrefs || '{}')
    const privacyPrefs = JSON.parse(settings.privacyPrefs || '{}')
    const appPrefs = JSON.parse(settings.appPrefs || '{}')

    return NextResponse.json({
      user: {
        ...user,
        sponsor: user.sponsor
          ? { id: user.sponsor.id, name: user.sponsor.name, email: user.sponsor.email }
          : null,
      },
      settings: {
        notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS, ...notificationPrefs },
        privacyPrefs: { ...DEFAULT_PRIVACY_PREFS, ...privacyPrefs },
        appPrefs: { ...DEFAULT_APP_PREFS, ...appPrefs },
      },
    })
  } catch (error: any) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json().catch(() => ({}))
    const {
      name,
      city,
      profilePhotoUrl,
      notificationPrefs,
      privacyPrefs,
      appPrefs,
    } = body

    if (name !== undefined) {
      const trimmed = String(name).trim()
      if (!trimmed || trimmed.length < 2) {
        return NextResponse.json(
          { error: 'Name must be at least 2 characters' },
          { status: 400 }
        )
      }
      await prisma.user.update({
        where: { id: auth.userId },
        data: { name: trimmed },
      })
    }

    if (city !== undefined) {
      await prisma.user.update({
        where: { id: auth.userId },
        data: { city: String(city).trim() || null },
      })
    }

    if (profilePhotoUrl !== undefined) {
      await prisma.user.update({
        where: { id: auth.userId },
        data: { profilePhotoUrl: String(profilePhotoUrl).trim() || null },
      })
    }

    let settings = await prisma.userSettings.findUnique({
      where: { userId: auth.userId },
    })

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: auth.userId,
          notificationPrefs: JSON.stringify({}),
          privacyPrefs: JSON.stringify({}),
          appPrefs: JSON.stringify({}),
        },
      })
    }

    const updates: { notificationPrefs?: string; privacyPrefs?: string; appPrefs?: string } = {}
    if (notificationPrefs != null && typeof notificationPrefs === 'object') {
      const current = JSON.parse(settings.notificationPrefs || '{}')
      updates.notificationPrefs = JSON.stringify({ ...current, ...notificationPrefs })
    }
    if (privacyPrefs != null && typeof privacyPrefs === 'object') {
      const current = JSON.parse(settings.privacyPrefs || '{}')
      updates.privacyPrefs = JSON.stringify({ ...current, ...privacyPrefs })
    }
    if (appPrefs != null && typeof appPrefs === 'object') {
      const current = JSON.parse(settings.appPrefs || '{}')
      updates.appPrefs = JSON.stringify({ ...current, ...appPrefs })
    }

    if (Object.keys(updates).length > 0) {
      await prisma.userSettings.update({
        where: { userId: auth.userId },
        data: updates,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Patch settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
