'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ClipboardList, LogOut, Leaf, Phone, Search, ChevronDown, User, Mail, MapPin, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatGreekPhoneInput, isPhoneValid, normalizePhone } from '@/lib/auth/contactInfo';
import { sanitizePhoneForTel } from '@/lib/serviceAreas';
import {
  clearLoginPreference,
  ensureLoginPreferenceInitialized,
  shouldLogoutOnAppClose,
} from '@/lib/auth/sessionPersistence';
import { getDashboardForRole, normalizeUserRole } from '@/lib/auth/roleRouting';
import { validateUsername } from '@/lib/auth/credentialsPolicy';
import { usePermissions } from '@/lib/permissions';
import {
  getUserLocation,
  sortProductsByDistance,
  formatDistance,
  hasUserLocationCached,
  type UserLocation,
} from '@/lib/geolocation';

interface Product {
  id: number;
  title: string;
  quantity: number;
  price: number;
  unit: string;
  status: string;
  farmer_id: string | null;
}

interface PurchaseRequest {
  id: number;
  product_id: number | null;
  product_title: string;
  farmer_id: string;
  buyer_email: string | null;
  buyer_phone: string | null;
  requested_quantity: number;
  status: 'pending' | 'confirmed' | 'ready' | 'rejected';
  unit_at_request: string;
  unit_price_at_request: number;
  profit: number;
  products?: { unit: string; price: number } | { unit: string; price: number }[] | null;
}

const requestStatusLabels: Record<PurchaseRequest['status'], string> = {
  pending: 'Σε αναμονή',
  confirmed: 'Επιβεβαιώθηκε',
  ready: 'Ολοκληρώθηκε',
  rejected: 'Δεν είναι διαθέσιμο',
};

const getUnitLabel = (unit: string, quantity: number): string => {
  if (!unit) return '';
  if (quantity === 1) {
    return unit;
  }
  switch (unit) {
    case 'κιλό': return 'κιλά';
    case 'τεμάχιο': return 'τεμάχια';
    case 'λίτρο': return 'λίτρα';
    case 'ματσάκι': return 'ματσάκια';
    case 'γραμμάριο': return 'γραμμάρια';
    default: return unit;
  }
};

export default function ConsumerDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const { request: requestPermission } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [farmerProfiles, setFarmerProfiles] = useState<Record<string, { contact_phone: string | null; full_name: string | null }>>({});
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [farmerServiceAreas, setFarmerServiceAreas] = useState<Record<string, string[]>>({});
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [useDistance, setUseDistance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [buyerPhone, setBuyerPhone] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [requestedQuantity, setRequestedQuantity] = useState('1');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'requests' | 'profile'>('profile');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState<'newest' | 'price_low' | 'price_high'>('newest');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [emailConfirmedAt, setEmailConfirmedAt] = useState<string | null>(null);
  const [showEmailVerificationWarning, setShowEmailVerificationWarning] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const formatCurrency = (value: number) => new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);

  const handleQuantityChange = (value: string) => {
    if (!selectedProduct) {
      setRequestedQuantity(value);
      return;
    }

    if (value === '') {
      setRequestedQuantity('');
      return;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setRequestedQuantity(value);
      return;
    }

    const clampedValue = Math.min(parsed, selectedProduct.quantity);
    setRequestedQuantity(String(clampedValue));

    if (parsed > selectedProduct.quantity) {
      setErrorMsg(`Η διαθέσιμη ποσότητα είναι ${selectedProduct.quantity} ${getUnitLabel(selectedProduct.unit, selectedProduct.quantity)}.`);
    } else {
      setErrorMsg('');
    }
  };

  const readNotificationCount = () => {
    if (typeof window === 'undefined') {
      return 0;
    }

    try {
      const storedValue = window.localStorage.getItem('agrodirect-message-notifications');
      return Number(storedValue ?? 0) || 0;
    } catch {
      return 0;
    }
  };

  const syncNotificationCount = (nextCount: number) => {
    setNotificationCount(nextCount);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('agrodirect-message-notifications', String(nextCount));
    }
  };

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'agrodirect-message-notifications') {
        syncNotificationCount(readNotificationCount());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    syncNotificationCount(readNotificationCount());

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .not('farmer_id', 'is', null)
        .order('id', { ascending: false });

      if (error) {
        console.error('Σφάλμα κατά τη φόρτωση προϊόντων:', {
          status: error.code,
          message: error.message,
        });
        setErrorMsg('Δεν ήταν δυνατή η φόρτωση των προϊόντων. Δοκιμάστε αργότερα.');
        return;
      }

      setProducts((data ?? []) as Product[]);
      setErrorMsg('');
    } catch (err) {
      console.error('Exception loading products:', err);
      setErrorMsg('Σφάλμα κατά τη φόρτωση προϊόντων.');
    }
  }, [supabase]);

  const fetchRequests = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select('id, product_id, product_title, farmer_id, buyer_email, buyer_phone, requested_quantity, status, unit_at_request, unit_price_at_request, profit')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Σφάλμα κατά τη φόρτωση αιτημάτων:', {
          status: error.code,
          message: error.message,
        });
        return;
      }

      const requestsData = (data ?? []) as PurchaseRequest[];
      setRequests(requestsData);

      // Φόρτωση στοιχείων παραγωγών
      const farmerIds = [...new Set(requestsData.map((r) => r.farmer_id).filter(Boolean) as string[])];
      if (farmerIds.length > 0) {
        try {
          const { data: profiles, error: profileError } = await supabase
            .from('farmer_profiles')
            .select('user_id, contact_phone, full_name')
            .in('user_id', farmerIds);

          if (profileError) {
            console.warn('Ένδειξη φόρτωσης στοιχείων παραγωγών (non-critical):', profileError.message);
          }

          if (profiles) {
            const map: Record<string, { contact_phone: string | null; full_name: string | null }> = {};
            for (const p of profiles) {
              map[p.user_id as string] = {
                contact_phone: p.contact_phone as string | null,
                full_name: p.full_name as string | null,
              };
            }
            setFarmerProfiles(map);
          }
        } catch (err) {
          console.warn('Exception loading farmer profiles:', err);
        }
      }

    } catch (err) {
      console.error('Exception loading requests:', err);
    }
  }, [supabase]);

  const fetchFarmerServiceAreas = useCallback(async () => {
    const farmerIds = [...new Set(products.map((p) => p.farmer_id).filter(Boolean) as string[])];
    if (farmerIds.length === 0) return;

    try {
      // Split into smaller batches if needed to avoid URL length issues
      const batchSize = 50;
      const map: Record<string, string[]> = {};

      for (let i = 0; i < farmerIds.length; i += batchSize) {
        const batch = farmerIds.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('farmer_profiles')
          .select('user_id, service_areas')
          .in('user_id', batch);

        if (error) {
          console.error('Σφάλμα κατά τη φόρτωση περιοχών (batch):', {
            status: error.code,
            message: error.message,
            details: (error as any).details,
            hint: (error as any).hint,
          });
          // Continue with next batch even if one fails
          continue;
        }

        if (data && Array.isArray(data)) {
          for (const profile of data) {
            const areas = Array.isArray(profile.service_areas)
              ? (profile.service_areas as string[])
              : [];
            map[profile.user_id as string] = areas;
          }
        }
      }

      setFarmerServiceAreas(map);
    } catch (err) {
      console.error('Σφάλμα κατά τη φόρτωση περιοχών (exception):', err);
    }
  }, [supabase, products]);

  const handleRequestLocation = async () => {
    setLoadingLocation(true);
    try {
      const location = await requestPermission(
        'geolocation',
        'Για να σας δείξουμε τα πλησιέστερα προϊόντα και αγρότες'
      );

      if (location) {
        const userLoc = await getUserLocation();
        if (userLoc) {
          setUserLocation(userLoc);
          setUseDistance(true);
          await fetchFarmerServiceAreas();
        }
      }
    } catch (error) {
      console.error('Σφάλμα αιτήματος τοποθεσίας:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      ensureLoginPreferenceInitialized();
      if (shouldLogoutOnAppClose()) {
        clearLoginPreference();
        await supabase.auth.signOut();
        router.push('/auth');
        return;
      }

      const currentRole = normalizeUserRole(session.user.user_metadata?.role);
      if (currentRole === 'farmer') {
        router.replace(getDashboardForRole('farmer'));
        return;
      }

      if (!currentRole) {
        const { error: roleUpdateError } = await supabase.auth.updateUser({
          data: { role: 'consumer' },
        });

        if (roleUpdateError) {
          console.error('Σφάλμα ενημέρωσης ρόλου καταναλωτή:', roleUpdateError.message);
        } else {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('Σφάλμα ανανέωσης συνεδρίας μετά την ενημέρωση ρόλου:', refreshError.message);
          }
        }
      }

      const metadata = session.user.user_metadata as Record<string, unknown> | undefined;
      const resolvedUsername = typeof metadata?.username === 'string' ? metadata.username.trim() : '';
      const resolvedFullName = typeof metadata?.full_name === 'string' ? metadata.full_name.trim() : '';

      setLoading(true);
      setBuyerId(session.user.id);
      setBuyerEmail(session.user.email ?? null);
      setUserName(resolvedUsername || resolvedFullName || session.user.email || 'Καταναλωτής');
      setBuyerPhone((session.user.user_metadata?.phone as string | undefined) ?? '');
      setEmailConfirmedAt(session.user.email_confirmed_at ?? null);
      await Promise.all([fetchProducts(), fetchRequests(session.user.id)]);
      setLoading(false);
    };

    void loadDashboard();
  }, [fetchProducts, fetchRequests, supabase, router]);

  // Φόρτωση service areas όταν αλλάξουν τα products
  useEffect(() => {
    if (products.length > 0) {
      void fetchFarmerServiceAreas();
    }
  }, [products, fetchFarmerServiceAreas]);

  // Ελέγχουμε για αποθηκευμένη τοποθεσία μετά τη σύνδεση
  useEffect(() => {
    if (typeof window !== 'undefined' && hasUserLocationCached()) {
      setUseDistance(true);
    }
  }, []);

  const openRequestForm = (product: Product) => {
    if (!product.farmer_id) {
      setErrorMsg('Το προϊόν δεν είναι ακόμη συνδεδεμένο με παραγωγό.');
      return;
    }

    setSelectedProduct(product);
    setRequestedQuantity('1');
    setMessage('');
    setErrorMsg('');
  };

  const handleRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!buyerId || !selectedProduct?.farmer_id) return;

    // Check if email is verified before allowing request
    if (!emailConfirmedAt) {
      setShowEmailVerificationWarning(true);
      return;
    }

    const sanitizedPhone = buyerPhone.trim();
    const normalizedPhone = normalizePhone(sanitizedPhone);
    if (!normalizedPhone || !isPhoneValid(normalizedPhone)) {
      setErrorMsg('Συμπληρώστε ένα έγκυρο ελληνικό κινητό τηλέφωνο που ξεκινά από 69 και έχει 10 ψηφία.');
      return;
    }

    const quantity = Number(requestedQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setErrorMsg('Συμπληρώστε μια έγκυρη ποσότητα.');
      return;
    }

    if (quantity > selectedProduct.quantity) {
      setErrorMsg(`Η διαθέσιμη ποσότητα είναι ${selectedProduct.quantity} ${getUnitLabel(selectedProduct.unit, selectedProduct.quantity)}.`);
      return;
    }

    const totalCost = quantity * selectedProduct.price;

    setSubmitting(true);
    setErrorMsg('');
    
    const insertData = {
      product_id: selectedProduct.id,
      product_title: selectedProduct.title,
      farmer_id: selectedProduct.farmer_id,
      buyer_id: buyerId,
      buyer_email: buyerEmail,
      buyer_phone: sanitizedPhone,
      requested_quantity: quantity,
      unit_at_request: selectedProduct.unit,
      unit_price_at_request: selectedProduct.price,
      message: message.trim() || null,
    };
    
    console.log('Attempting to insert purchase request:', insertData);
    
    const { error } = await supabase.from('purchase_requests').insert(insertData);

    if (error) {
      console.error('Purchase request insert error:', {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
      });
      setErrorMsg(`Δεν στάλθηκε το αίτημα: ${error.message}${(error as any).hint ? '\n' + (error as any).hint : ''}`);
    } else {
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { phone: sanitizedPhone },
      });

      if (metadataError) {
        console.error('Σφάλμα αποθήκευσης τηλεφώνου στο προφίλ:', metadataError.message);
      }

      setSelectedProduct(null);
      setSuccessMsg(
        `Το αίτημα για ${selectedProduct.title} στάλθηκε: ${quantity} ${getUnitLabel(selectedProduct.unit, quantity)} με εκτιμώμενο κόστος ${formatCurrency(totalCost)}.`,
      );
      await fetchRequests(buyerId);
      window.setTimeout(() => setSuccessMsg(''), 5000);
    }

    setSubmitting(false);
  };

  const handleLogout = async () => {
    clearLoginPreference();
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  const getRequestProductDetails = (request: PurchaseRequest): { unit: string; price: number } => {
    if (request.unit_at_request && request.unit_price_at_request !== null) {
      return {
        unit: request.unit_at_request,
        price: Number(request.unit_price_at_request) || 0,
      };
    }

    const relatedProduct = Array.isArray(request.products)
      ? request.products[0]
      : request.products;

    if (relatedProduct) {
      return {
        unit: relatedProduct.unit ?? '',
        price: Number(relatedProduct.price) || 0,
      };
    }

    const productFromList = products.find((product) => product.id === request.product_id);
    if (productFromList) {
      return {
        unit: productFromList.unit ?? '',
        price: Number(productFromList.price) || 0,
      };
    }

    return { unit: '', price: 0 };
  };

  const filteredAndSortedProducts = (() => {
    let filtered = products;

    // Φίλτρο ανά όνομα προϊόντος (case-insensitive)
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((p) => p.title.toLowerCase().includes(lowerSearch));
    }

    // Ταξινόμηση ανά απόσταση (αν έχουμε τοποθεσία) ή ανά τιμή
    const sorted = [...filtered];
    
    if (useDistance && userLocation) {
      // Ταξινόμηση κατά απόσταση από χρήστη
      const productsWithDistance = sortProductsByDistance(
        sorted,
        userLocation.latitude,
        userLocation.longitude,
        farmerServiceAreas
      );
      return productsWithDistance as Product[];
    } else if (sortType === 'price_low') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortType === 'price_high') {
      sorted.sort((a, b) => b.price - a.price);
    }
    // 'newest' - keep original order from database (descending by id)

    return sorted;
  })();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-stone-200 bg-white hidden lg:block">
        <div className="p-6 border-b border-stone-100">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-white"><Leaf className="h-5 w-5" /></div>
            <div>
              <h1 className="text-lg font-bold text-emerald-900">AgroDirect</h1>
              <p className="text-xs text-stone-500">Χώρος καταναλωτή</p>
            </div>
          </Link>
        </div>
        <nav className="mt-5 px-3 space-y-1" aria-label="Κύρια πλοήγηση">
          <button type="button" onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${activeTab === 'profile' ? 'bg-emerald-50 font-semibold text-emerald-800' : 'font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}>
            <User className="h-4 w-4" /> Προφίλ μου
          </button>
          <button type="button" onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${activeTab === 'products' ? 'bg-emerald-50 font-semibold text-emerald-800' : 'font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}>
            <ShoppingBag className="h-4 w-4" /> Διαθέσιμα Προϊόντα
          </button>
          <button type="button" onClick={() => setActiveTab('requests')} className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${activeTab === 'requests' ? 'bg-emerald-50 font-semibold text-emerald-800' : 'font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}>
            <ClipboardList className="h-4 w-4" /> Τα Αιτήματά μου
            {requests.filter((r) => r.status === 'pending' || r.status === 'confirmed').length > 0 && (
              <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">{requests.filter((r) => r.status === 'pending' || r.status === 'confirmed').length}</span>
            )}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-stone-200 h-16 flex items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 lg:hidden"><Leaf className="h-5 w-5 text-emerald-700" /><span className="font-bold text-emerald-900">AgroDirect</span></Link>
          <p className="hidden lg:block text-sm text-stone-500">Πίνακας ελέγχου καταναλωτή</p>
          <div className="flex items-center gap-2">
            <div className="relative inline-flex items-center rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-stone-700">
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {notificationCount}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 border border-stone-300 hover:border-red-200 hover:bg-red-50 hover:text-red-700 text-stone-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Αποσύνδεση</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-4 sm:p-8 flex-1 space-y-8 max-w-7xl w-full mx-auto">
          {/* Καρτέλες πλοήγησης */}
          <div className="flex border-b border-stone-200 -mt-4 sm:-mt-8 -mx-4 sm:-mx-8 px-4 sm:px-8">
            <button type="button" onClick={() => setActiveTab('profile')} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${activeTab === 'profile' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-900'}`}>
              <User className="h-4 w-4" /> Προφίλ μου
            </button>
            <button type="button" onClick={() => setActiveTab('products')} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'products' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-900'}`}>
              Διαθέσιμα Προϊόντα
            </button>
            <button type="button" onClick={() => setActiveTab('requests')} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${activeTab === 'requests' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-900'}`}>
              Τα αιτήματά μου
              {requests.length > 0 && (
                <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-xs font-semibold text-stone-700">{requests.length}</span>
              )}
            </button>
          </div>
          <section id="overview" className="border-b border-stone-200 pb-7">
            <p className="text-xs font-bold tracking-wide text-emerald-700">ΠΙΝΑΚΑΣ ΕΛΕΓΧΟΥ</p>
            <h2 className="mt-2 text-3xl font-bold text-stone-900">Καλώς ήρθες, {userName ?? buyerEmail}</h2>
            <p className="mt-2 text-sm text-stone-600">Ανακάλυψε φρέσκα προϊόντα και δες την κατάσταση των αιτημάτων σου.</p>
          </section>

          {successMsg && <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{successMsg}</div>}
          {errorMsg && !selectedProduct && <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errorMsg}</div>}

          <section id="products" className={activeTab !== 'products' ? 'hidden' : ''}>
            <h2 className="mb-4 text-xl font-semibold text-stone-800">Dιαθέσιμα προϊόντα</h2>
            
            {/* Search και Filter */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Αναζήτησε προίόντα (π.χ. Τομάτες, Μήλα)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white pl-10 pr-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              
              {/* Location Button */}
              <button
                onClick={handleRequestLocation}
                disabled={loadingLocation}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  useDistance
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                    : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                }`}
              >
                <MapPin className="h-4 w-4" />
                {loadingLocation ? 'Φόρτωση...' : useDistance ? '📍 Ταξινόμηση κατά απόσταση' : '📍 Εύρεση κοντά'}
              </button>

              <div className="relative">
                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value as typeof sortType)}
                  disabled={useDistance}
                  className="appearance-none rounded-lg border border-stone-300 bg-white pl-3 pr-10 py-2.5 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 cursor-pointer disabled:opacity-60"
                >
                  <option value="newest">Φίλτρο</option>
                  <option value="price_low">Χαμηλότερη τιμή</option>
                  <option value="price_high">Υψηλότερη τιμή</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              </div>
            </div>

            {filteredAndSortedProducts.length === 0 ? <p className="text-sm text-stone-500">{searchTerm ? 'Δεν βρέθηκαν προϊόντα με αυτό το όνομα.' : 'Δεν υπάρχουν διαθέσιμα προίόντα αυτή τη στιγμή.'}</p> : (
              <>
                <p className="mb-3 text-xs text-stone-500">
                  Εμφανίζονται {filteredAndSortedProducts.length} προϊόντα
                  {useDistance && userLocation ? ' (ταξινομημένα κατά απόσταση)' : ''}
                </p>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAndSortedProducts.map((item) => {
                  const itemDistance = (item as any).distance_km;
                  return (
                    <article key={item.id} className="rounded-lg border border-emerald-200 bg-white p-4 flex flex-col">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="text-base font-bold text-stone-900">{item.title}</h3>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">{item.status}</span>
                      </div>
                      {useDistance && itemDistance !== null && (
                        <p className="mb-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {formatDistance(itemDistance)}
                        </p>
                      )}
                      <p className="mb-4 text-sm text-stone-600">
                        Τιμή: <strong className="text-emerald-700">{item.price} EUR / {item.unit}</strong>
                        <br />
                        Διαθέσιμη ποσότητα: <strong>{item.quantity} {getUnitLabel(item.unit, item.quantity)}</strong>
                      </p>
                      <div className="mt-auto">
                        <button type="button" onClick={() => openRequestForm(item)} className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-800">Αποστολή αιτήματος</button>
                      </div>
                    </article>
                  );
                })}
                </div>
              </>
            )}
          </section>

          <section id="requests" className={`rounded-lg border border-stone-200 bg-white p-6 shadow-sm${activeTab !== 'requests' ? ' hidden' : ''}`}>
            <h2 className="mb-3 text-xl font-semibold text-stone-800">Τα αιτήματά μου</h2>
            {requests.length === 0 ? <p className="text-sm text-stone-500">Δεν έχετε στείλει ακόμη αίτημα σε παραγωγό.</p> : (
              <ul className="divide-y divide-stone-200">
                {requests.map((request) => {
                  const productDetails = getRequestProductDetails(request);
                  const unit = productDetails.unit;
                  const unitPrice = productDetails.price;
                  const totalCost = request.requested_quantity * unitPrice;
                  const farmerProfile = farmerProfiles[request.farmer_id];
                  const farmerName = farmerProfile?.full_name || 'Παραγωγός';
                  const farmerPhone = farmerProfile?.contact_phone || 'Δεν έχει καταχωρημένο τηλέφωνο';
                  return (
                    <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                      <div className="flex-grow">
                        <strong className="text-stone-900">{request.product_title}</strong>
                        <span className="text-stone-500"> · {request.requested_quantity} {getUnitLabel(unit, request.requested_quantity)}</span>
                        <p className="mt-1 text-sm text-stone-600">Εκτιμώμενο κόστος: <strong className="text-base font-bold text-emerald-700">{formatCurrency(totalCost)}</strong> <span className="text-xs">({formatCurrency(unitPrice)} / {unit || 'μονάδα'})</span></p>
                        {request.status === 'confirmed' && (
                          <div className="mt-2 rounded-md border border-stone-200 bg-stone-50 p-2.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Στοιχεία επικοινωνίας</p>
                            <div className="mt-1 space-y-1 text-sm text-stone-600">
                              <p><span className="font-medium text-stone-800">Παραγωγός:</span> {farmerName}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <p><span className="font-medium text-stone-800">Τηλέφωνο:</span> {farmerPhone}</p>
                                {farmerPhone && farmerPhone !== 'Δεν έχει καταχωρημένο τηλέφωνο' && (
                                  <a
                                    href={`tel:${farmerPhone}`}
                                    className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                                  >
                                    <Phone className="h-3.5 w-3.5" /> Κλήση
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="shrink-0 font-medium text-emerald-800">{requestStatusLabels[request.status]}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section id="profile" className={activeTab !== 'profile' ? 'hidden' : 'rounded-lg border border-stone-200 bg-white p-6 shadow-sm'}>
            <h2 className="mb-5 text-xl font-semibold text-stone-800">Το Προφίλ μου</h2>
            {!editingProfile ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold text-stone-600 mb-1">Ονοματεπώνυμο</p>
                  <p className="text-base text-stone-900">{userName || 'Επανόθηση απαιτείται'}</p>
                </div>
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold text-stone-600 mb-1">Email</p>
                  <p className="text-base text-stone-900">{buyerEmail || 'Επανόθηση απαιτείται'}</p>
                </div>
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold text-stone-600 mb-1">Κινητό τηλέφωνο</p>
                  <p className="text-base text-stone-900">{buyerPhone || 'Επανόθηση απαιτείται'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileForm({ fullName: userName || '', email: buyerEmail || '', phone: buyerPhone || '' });
                    setEditingProfile(true);
                  }}
                  className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Επεξεργασία Προφίλ
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  
                  // Check if email is verified before allowing profile save
                  if (!emailConfirmedAt) {
                    setShowEmailVerificationWarning(true);
                    return;
                  }
                  
                  setSavingProfile(true);
                  const trimmedFullName = profileForm.fullName.trim();
                  const updateData: Record<string, string> = {
                    full_name: trimmedFullName,
                    phone: profileForm.phone.trim(),
                  };

                  if (!validateUsername(trimmedFullName)) {
                    updateData.username = trimmedFullName;
                  }

                  const { error } = await supabase.auth.updateUser({
                    data: updateData,
                  });
                  if (error) {
                    alert('Σφάλμα αποθήκευσης: ' + error.message);
                  } else {
                    setUserName(trimmedFullName);
                    setBuyerPhone(profileForm.phone.trim());
                    setEditingProfile(false);
                  }
                  setSavingProfile(false);
                }}
                className="space-y-4"
              >
                <label className="block text-sm font-semibold text-stone-700">
                  <span className="inline-flex items-center gap-2 mb-1.5">
                    <User className="h-4 w-4 text-emerald-700" /> Ονοματεπώνυμο
                  </span>
                  <input
                    type="text"
                    required
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="π.χ. Γιάννης Παπαδόπουλος"
                  />
                </label>
                <label className="block text-sm font-semibold text-stone-700">
                  <span className="inline-flex items-center gap-2 mb-1.5">
                    <Mail className="h-4 w-4 text-emerald-700" /> Email
                  </span>
                  <input
                    type="email"
                    disabled
                    value={profileForm.email}
                    className="w-full rounded-lg border border-stone-300 bg-stone-100 px-3 py-2.5 text-sm text-stone-600 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-stone-500">Το email δεν μπορεί να αλλάξει</p>
                </label>
                <label className="block text-sm font-semibold text-stone-700">
                  <span className="inline-flex items-center gap-2 mb-1.5">
                    <Phone className="h-4 w-4 text-emerald-700" /> Κινητό τηλέφωνο
                  </span>
                  <input
                    type="tel"
                    required
                    value={profileForm.phone}
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, phone: formatGreekPhoneInput(e.target.value) });
                    }}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-emerald-100"
                    placeholder="π.χ. +30 69 12345678"
                  />
                </label>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex-1 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:bg-emerald-400"
                  >
                    {savingProfile ? 'Αποθήκευση...' : 'Αποθήκευση'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                  >
                    Ακύρωση
                  </button>
                </div>
              </form>
            )}
          </section>
        </main>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="request-title">
          <form onSubmit={handleRequest} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4"><div><h2 id="request-title" className="text-lg font-bold text-stone-900">Αίτημα για {selectedProduct.title}</h2><p className="mt-1 text-sm text-stone-500">Ο παραγωγός θα απαντήσει στη διαθεσιμότητα.</p></div><button type="button" onClick={() => setSelectedProduct(null)} className="text-sm text-stone-500 hover:text-stone-900">Κλείσιμο</button></div>
            {errorMsg && <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errorMsg}</div>}
            <label className="mb-4 block text-sm font-medium text-stone-700">Κινητό τηλέφωνο
              <input
                type="tel"
                required
                value={buyerPhone}
                onChange={(event) => {
                  setBuyerPhone(formatGreekPhoneInput(event.target.value));
                }}
                placeholder="π.χ. +30 69 12345678"
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
              />
            </label>
            <label className="mb-4 block text-sm font-medium text-stone-700">Ποσότητα ({getUnitLabel(selectedProduct.unit, selectedProduct.quantity)})<input type="number" min="0.01" step="any" max={selectedProduct.quantity} required value={requestedQuantity} onChange={(event) => handleQuantityChange(event.target.value)} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2" /></label>
            <div className="mb-4 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
              Εκτιμώμενο κόστος: {
                formatCurrency((Number(requestedQuantity) > 0 ? Number(requestedQuantity) : 0) * selectedProduct.price)
              } ({formatCurrency(selectedProduct.price)} / {selectedProduct.unit})
            </div>
            <label className="mb-5 block text-sm font-medium text-stone-700">Μήνυμα για τον παραγωγό (προαιρετικό)<textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} rows={3} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2" /></label>
            <button type="submit" disabled={submitting} className="w-full rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-emerald-400">{submitting ? 'Αποστολή...' : 'Στείλε αίτημα'}</button>
          </form>
        </div>
      )}

      {/* Email Verification Warning Modal */}
      {showEmailVerificationWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-stone-900 mb-2">📧 Επιβεβαίωση Email Απαιτείται</h3>
            <p className="text-stone-600 mb-6">
              Για να μπορέσεις να δημιουργήσεις αιτήματα, πρέπει πρώτα να επιβεβαιώσεις το email σου. 
              Ελέγξε το εισερχόμενό σου και κάνε click στο σύνδεσμο επιβεβαίωσης που στάλθηκε κατά την εγγραφή.
            </p>
            <button
              onClick={() => setShowEmailVerificationWarning(false)}
              className="w-full rounded-md bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              Κατανοητό
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
