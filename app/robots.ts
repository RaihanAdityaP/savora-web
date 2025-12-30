import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/*',
          '/api/*',
          '/create',
          '/collections',
          '/notifications',
        ],
      },
    ],
    sitemap: 'https://savora-web.vercel.app/sitemap.xml',
  }
}