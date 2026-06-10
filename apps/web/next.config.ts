import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Required for pnpm monorepo: trace files from workspace root so the
  // standalone bundle includes shared node_modules correctly.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.apple-plus.com' },
      { protocol: 'https', hostname: 'store.storeimages.cdn-apple.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
