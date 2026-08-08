import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AgroDirect',
    short_name: 'AgroDirect',
    description: 'Απευθείας από τον παραγωγό στο τραπέζι σας.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8faf8',
    theme_color: '#16a34a',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
