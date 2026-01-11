/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable source maps in production to reduce build size and eliminate warnings
  productionBrowserSourceMaps: false,
  
  // Ensure consistent port and prevent port conflicts
  // This will be handled by package.json script, but we ensure clean builds
  experimental: {
    // Improve reliability of static asset serving
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/**',
      },
    ],
  },
  // Improve error handling and logging
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Better error messages
  reactStrictMode: true,
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Webpack configuration for better error handling
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Suppress source map warnings in development
    if (dev) {
      config.ignoreWarnings = [
        { module: /node_modules/ },
        { file: /\.map$/ },
        { message: /Failed to parse source map/ },
        { message: /Source Map loading errors/ },
      ]
    }
    
    return config
  },
}

module.exports = nextConfig
