'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode } from 'lucide-react';

export function InstallQrCard() {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://agrodirect.gr';
    QRCode.toDataURL(url, {
      width: 220,
      margin: 1,
      color: {
        dark: '#14532d',
        light: '#ffffff',
      },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(''));
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-white/95 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
        <QrCode className="h-4 w-4" />
        Σκάνησε για να ανοίξεις την εφαρμογή
      </div>
      {dataUrl ? (
        <img src={dataUrl} alt="QR code για την εφαρμογή AgroDirect" className="h-36 w-36 rounded-xl border border-emerald-100 bg-white p-2" />
      ) : (
        <div className="flex h-36 w-36 items-center justify-center rounded-xl border border-emerald-100 bg-stone-50 text-sm text-stone-500">
          Φόρτωση QR
        </div>
      )}
    </div>
  );
}
