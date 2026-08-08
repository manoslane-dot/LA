'use client';

import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';

export function ShareInstallButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const shareUrl = window.location.origin || 'https://agrodirect.gr';
    const shareText = 'Δες το AgroDirect για φρέσκα προϊόντα από παραγωγούς στην περιοχή σου.';

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'AgroDirect',
          text: shareText,
          url: shareUrl,
        });
        return;
      }
    } catch {
      // Fall back to clipboard or prompt
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
        return;
      }
    } catch {
      // Ignore and fall back below
    }

    window.prompt('Αντιγραφή συνδέσμου', `${shareText} ${shareUrl}`);
  };

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
    >
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? 'Αντιγράφηκε' : 'Μοίρασέ το'}
    </button>
  );
}
