import { ShieldAlert } from 'lucide-react';

export function ContentModerationNotice() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        Οι εικόνες που ανεβάζετε ελέγχονται αυτόματα για ακατάλληλο περιεχόμενο, ώστε να διασφαλίζεται η ασφάλεια της κοινότητας.
      </p>
    </div>
  );
}
