/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'localhost',
      'plhiqkvxikrugafmnmqd.supabase.co',
      'images.unsplash.com',
      'i.ytimg.com',
      'img.youtube.com'
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_PAYHERE_MERCHANT_ID: process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID,
    NEXT_PUBLIC_PAYHERE_SANDBOX: process.env.NEXT_PUBLIC_PAYHERE_SANDBOX,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    NEXT_PUBLIC_ADMIN_WHATSAPP: process.env.NEXT_PUBLIC_ADMIN_WHATSAPP,
    NEXT_PUBLIC_BANK_NAME: process.env.NEXT_PUBLIC_BANK_NAME,
    NEXT_PUBLIC_BANK_ACCOUNT: process.env.NEXT_PUBLIC_BANK_ACCOUNT,
    NEXT_PUBLIC_BANK_ACCOUNT_NAME: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME,
    NEXT_PUBLIC_BANK_BRANCH: process.env.NEXT_PUBLIC_BANK_BRANCH,
    NEXT_PUBLIC_BANK_SWIFT: process.env.NEXT_PUBLIC_BANK_SWIFT,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/admin',
        has: [
          {
            type: 'cookie',
            key: 'maintenance_mode',
            value: 'true'
          }
        ],
        destination: '/maintenance',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig