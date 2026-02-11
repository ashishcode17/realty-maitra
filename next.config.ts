import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'via.placeholder.com', pathname: '/**' },
    ],
  },
  // Block direct access to uploads folder
  async rewrites() {
    return []
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ]
  },
}

export default nextConfig
