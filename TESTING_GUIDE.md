# 🧪 Testing Guide - GDPR Compliance Features

## 🚀 How to Test the New Privacy System

### 1. **Start the Development Server**
```bash
cd c:\Users\Μανος\Desktop\LA
npm run dev
```
Then open: `http://localhost:3000`

---

## 📋 Test Scenarios

### Scenario 1: Cookie Banner First Visit ✅
**Steps:**
1. Open DevTools → Application → Local Storage
2. Clear `cookieConsent` key (if exists)
3. Refresh page
4. **Expected**: Banner appears at bottom with:
   - "🍪 Προστασία Δεδομένων σας"
   - 3 buttons: ✋ Απόρριψη | ⚙️ Ρυθμίσεις | ✅ Αποδοχή Όλων

**Visual Check:**
- [ ] Buttons are same size (no dark patterns)
- [ ] Text is clear Greek (no legal jargon)
- [ ] Banner is readable and not invasive

---

### Scenario 2: Reject All Cookies ✅
**Steps:**
1. Click "✋ Απόρριψη Όλων" button
2. Check DevTools → Local Storage → `cookieConsent`
3. **Expected Value**:
   ```json
   {
     "essential": true,
     "analytics": false,
     "marketing": false
   }
   ```
4. Banner should disappear

---

### Scenario 3: Accept All Cookies ✅
**Steps:**
1. Clear `cookieConsent` in localStorage
2. Refresh page
3. Click "✅ Αποδοχή Όλων" button
4. Check localStorage
5. **Expected Value**:
   ```json
   {
     "essential": true,
     "analytics": true,
     "marketing": true
   }
   ```

---

### Scenario 4: Custom Preferences (Settings) ✅
**Steps:**
1. Clear `cookieConsent` and refresh
2. Click "⚙️ Ρυθμίσεις" button
3. **Expected**: Modal opens with toggles for:
   - 🔒 Essential (DISABLED - always on)
   - 📊 Analytics (Toggle-able)
   - 📢 Marketing (Toggle-able)
4. Toggle Analytics ON, keep Marketing OFF
5. Click "💾 Αποθήκευση Ρυθμίσεων"
6. Check localStorage
7. **Expected Value**:
   ```json
   {
     "essential": true,
     "analytics": true,
     "marketing": false
   }
   ```

---

### Scenario 5: Privacy Policy Page ✅
**Steps:**
1. Start app
2. Navigate to `http://localhost:3000/privacy`
3. **Expected**: Professional privacy policy with:
   - 8 clear sections
   - GDPR rights explained plainly
   - Contact: support@agrodirect.gr
   - "Learn more" links from banner point here

**Check for:**
- [ ] No legal jargon (readable by normal user)
- [ ] Data minimization explained
- [ ] User rights clearly stated
- [ ] Company contact info visible

---

### Scenario 6: Terms of Service Page ✅
**Steps:**
1. Navigate to `http://localhost:3000/terms`
2. **Expected**: Clear terms covering:
   - Account creation rules
   - Acceptable use
   - Sales/purchase guidelines
   - IP & liability disclaimers

---

### Scenario 7: Privacy Settings Dashboard ✅
**Steps:**
1. Navigate to `http://localhost:3000/privacy-settings`
2. **Expected**: User-friendly dashboard showing:
   - Current cookie preferences with toggles
   - Device permissions explanations
   - Save/Reset buttons
   - Access to Privacy Policy link

**Features to test:**
- [ ] Toggle Analytics and see state change
- [ ] Toggle Marketing and see state change
- [ ] Click "Save" - should show success message
- [ ] Click "Reset" - should restore minimal consent
- [ ] Links to Privacy Policy work

---

### Scenario 8: Persistent Consent ✅
**Steps:**
1. Set preferences (e.g., Accept Analytics, Reject Marketing)
2. Go to another page (`/privacy`)
3. Go to Privacy Settings (`/privacy-settings`)
4. **Expected**: Your previous preferences are still there

---

### Scenario 9: Runtime Permissions (For Developers) 🔬
**Test Setup**: Create a test page with permission request
```typescript
// Create: src/app/test/permissions/page.tsx
'use client';

import { usePermissions } from '@/lib/permissions';

export default function TestPermissions() {
  const { request, check } = usePermissions();

  const handleRequestGeolocation = async () => {
    const granted = await request('geolocation');
    console.log('Geolocation granted:', granted);
  };

  return (
    <div className="p-8">
      <button onClick={handleRequestGeolocation} className="px-4 py-2 bg-blue-600 text-white rounded">
        Request Location Permission
      </button>
    </div>
  );
}
```

**Steps:**
1. Visit `http://localhost:3000/test/permissions`
2. Click "Request Location Permission"
3. **Expected**: Browser shows explanation dialog:
   - "Πρόσβαση Τοποθεσίας"
   - "Η εφαρμογή χρειάζεται την τοποθεσία σας για..."
4. Browser geolocation prompt appears
5. Accept/Reject → Console logs result

---

## 🎯 Quality Checklist

### UI/UX Quality
- [ ] Cookie banner doesn't cover page content
- [ ] Close button (X) works
- [ ] All buttons are clickable
- [ ] Modals are readable on mobile

### Functionality
- [ ] Banner shows only on first visit
- [ ] Preferences persist across page refreshes
- [ ] Settings modal opens/closes properly
- [ ] localStorage stores preferences correctly

### Compliance
- [ ] No pre-ticked boxes for optional cookies
- [ ] All 3 buttons have equal visual weight
- [ ] Text is plain language (no jargon)
- [ ] Privacy Policy accessible via link
- [ ] Terms of Service accessible

### Permissions
- [ ] Permissions request explanations are clear
- [ ] Permissions NOT requested on app load
- [ ] Only requested when feature is used

---

## 🐛 Troubleshooting

### Banner Not Showing?
```javascript
// In browser console:
localStorage.removeItem('cookieConsent');
location.reload();
```

### Preferences Not Saving?
```javascript
// Check localStorage in console:
console.log(JSON.parse(localStorage.getItem('cookieConsent')));
```

### Type Errors During Build?
- Run: `npm run build` to verify
- Should see: `✓ Checking validity of types`

---

## 📱 Mobile Testing

1. Open DevTools → Device Toolbar (mobile view)
2. Test all scenarios above on mobile
3. **Check**:
   - [ ] Banner is readable on small screen
   - [ ] Buttons are tappable (44px min height)
   - [ ] Modal doesn't overflow
   - [ ] Text doesn't get cut off

---

## 🚀 Ready for Production?

- [ ] All test scenarios pass
- [ ] Build succeeds with no errors
- [ ] Privacy Policy reviewed by legal team
- [ ] Terms of Service reviewed by legal team
- [ ] Contact email (support@agrodirect.gr) is monitored
- [ ] Team trained on GDPR rights requests

---

## 📊 What Gets Stored?

```json
// localStorage['cookieConsent']
{
  "essential": true,     // Always true
  "analytics": false,    // User's choice
  "marketing": false     // User's choice
}
```

---

## 🔗 All New Routes

| Route | Purpose | Accessible From |
|-------|---------|-----------------|
| `/privacy` | Full Privacy Policy | Banner "Learn more" link |
| `/terms` | Terms of Service | Footer (TODO) |
| `/privacy-settings` | User consent dashboard | User profile (TODO) |

---

## ✅ Sign-Off

Once all tests pass, you're **GDPR compliant** and ready for:
- EU/Greek users ✅
- Regulatory compliance ✅
- User trust ✅

Good luck! 🚀
