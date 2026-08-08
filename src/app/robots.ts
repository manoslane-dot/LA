import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://agrodirect.gr/sitemap.xml',
    host: 'https://agrodirect.gr',
  };
}
