/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Performance optimizations
  reactStrictMode: true,
  swcMinify: true, // Use SWC for minification (faster than Terser)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console logs in production
  },
  // Image optimization
  images: {
    domains: ['res.cloudinary.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 60, // Cache optimized images for 60 seconds
    deviceSizes: [640, 750, 828, 1080, 1200], // Optimize device sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256], // Optimize image sizes
  },
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fix for packages that use browser globals in server environment
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Prevent client-side packages from being bundled on server
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        'lottie-react': 'lottie-react',
        'socket.io-client': 'socket.io-client',
      });
    }
    
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['mongodb', 'mongoose', 'bcryptjs', 'jsonwebtoken'],
    serverActions: {
      bodySizeLimit: '50mb',
    },
    scrollRestoration: true,
  },
  // Prevent client-side packages from being bundled in server components
  transpilePackages: ['lottie-react'],
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
        ],
      },
    ]
  },
}

export default nextConfig
