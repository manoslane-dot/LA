'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CircleDollarSign, ClipboardList, LayoutDashboard, Leaf, LogOut, Mail, Package, Pencil, Phone, Plus, ShoppingBag, Trash2, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sanitizePhoneForTel } from '@/lib/serviceAreas';
import {
  clearLoginPreference,
  ensureLoginPreferenceInitialized,
  shouldLogoutOnAppClose,
} from '@/lib/auth/sessionPersistence';
import { getDashboardForRole, normalizeUserRole } from '@/lib/auth/roleRouting';

interface Crop {
  id: string;
  name: string;
  area: string;
}

interface Product {
  id: number;
  title: string;
  quantity: number;
  price: number;
  unit: string;
  status: string;
  farmer_id: string;
}

interface PurchaseRequest {
  id: number;
  product_id: number | null;
  product_title: string;
  buyer_email: string | null;
  buyer_phone: string | null;
  requested_quantity: number;
  message: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'rejected';
  created_at: string;
  unit_at_request: string;
  unit_price_at_request: number;
  products: { unit: string; price: number } | { unit: string; price: number }[] | null;
}

const requestStatusLabels: Record<PurchaseRequest['status'], string> = {
  pending: 'Σε αναμονή',
  confirmed: 'Επιβεβαιώθηκε',
  completed: 'Ολοκληρώθηκε',
  rejected: 'Απορρίφθηκε',
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

export default function FarmerDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'profile'>('overview');  // Profile info shown in overview header
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [emailConfirmedAt, setEmailConfirmedAt] = useState<string | null>(null);
  const [showEmailVerificationWarning, setShowEmailVerificationWarning] = useState(false);
  
  // Καλλιέργειες
  const [crops, setCrops] = useState<Crop[]>([]);
  const [cropName, setCropName] = useState('');
  const [cropArea, setCropArea] = useState('');
  const [submittingCrop, setSubmittingCrop] = useState(false);

  // Προϊόντα προς Πώληση
  const [products, setProducts] = useState<Product[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [updatingRequestId, setUpdatingRequestId] = useState<number | null>(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodQuantity, setProdQuantity] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodUnit, setProdUnit] = useState('κιλό');
  const [submittingProd, setSubmittingProd] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [priceDraft, setPriceDraft] = useState('');
  const [updatingPrice, setUpdatingPrice] = useState(false);
  
  // Chat messaging for confirmed requests
  const [chatRequestId, setChatRequestId] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  
  // Confirmation dialog for request confirmation
  const [confirmingRequestId, setConfirmingRequestId] = useState<number | null>(null);

  const fetchCrops = useCallback(async () => {
    const { data, error } = await supabase.from('crops').select('*');
    if (error) {
      console.error('Error fetching crops:', error.message);
    } else if (data) {
      setCrops(data);
    }
  }, [supabase]);

  const fetchProducts = useCallback(async (farmerId: string) => {
    const { data, error } = await supabase.from('products').select('*').eq('farmer_id', farmerId);
    if (error) {
      console.error('Error fetching products:', error.message);
    } else if (data) {
      setProducts(data as Product[]);
    }
  }, [supabase]);

  const fetchRequests = useCallback(async (farmerId: string) => {
    const { data, error } = await supabase
      .from('purchase_requests')
      .select('id, product_id, product_title, buyer_email, buyer_phone, requested_quantity, message, status, created_at, unit_at_request, unit_price_at_request, products(unit,price)')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase requests:', error.message);
    } else if (data) {
      setRequests(data as PurchaseRequest[]);
    }
  }, [supabase]);

  useEffect(() => {
    const checkUserAndFetchData = async () => {
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
      if (currentRole === 'consumer') {
        router.replace(getDashboardForRole('consumer'));
        return;
      }

      if (!currentRole) {
        const { error: roleUpdateError } = await supabase.auth.updateUser({
          data: { role: 'farmer' },
        });

        if (roleUpdateError) {
          console.error('Σφάλμα ενημέρωσης ρόλου αγρότη:', roleUpdateError.message);
        } else {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('Σφάλμα ανανέωσης συνεδρίας μετά την ενημέρωση ρόλου:', refreshError.message);
          }
        }
      }
      
      setUserName((session.user.user_metadata?.full_name as string | undefined)?.trim() || session.user.email || 'Παραγωγός');
      setUserEmail(session.user.email ?? 'Πωλητής');
      setUserId(session.user.id);
      setEmailConfirmedAt(session.user.email_confirmed_at ?? null);
      
      // Fetch farmer profile for phone
      const { data: profileData } = await supabase
        .from('farmer_profiles')
        .select('contact_phone')
        .eq('user_id', session.user.id)
        .maybeSingle();
      
      if (profileData?.contact_phone) {
        setUserPhone(profileData.contact_phone);
      }
      
      await Promise.all([fetchCrops(), fetchProducts(session.user.id), fetchRequests(session.user.id)]);
      setLoading(false);
    };

    void checkUserAndFetchData();
  }, [router, supabase, fetchCrops, fetchProducts, fetchRequests]);

  const handleAddCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if email is verified
    if (!emailConfirmedAt) {
      setShowEmailVerificationWarning(true);
      return;
    }

    if (!cropName || !cropArea) return;

    setSubmittingCrop(true);
    const { error } = await supabase.from('crops').insert([
      { name: cropName, area: cropArea }
    ]);

    if (!error) {
      setCropName('');
      setCropArea('');
      await fetchCrops();
    }
    setSubmittingCrop(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle || !prodQuantity || !prodPrice || !userId) return;

    // Check if email is verified before allowing product creation
    if (!emailConfirmedAt) {
      setShowEmailVerificationWarning(true);
      return;
    }

    setSubmittingProd(true);
    const { error } = await supabase.from('products').insert([
      { 
        title: prodTitle, 
        quantity: parseFloat(prodQuantity), 
        price: parseFloat(prodPrice), 
        unit: prodUnit,
        status: '🟢 Ενεργό / Δημοσιευμένο',
        farmer_id: userId,
      }
    ]);

    if (!error) {
      setProdTitle('');
      setProdQuantity('');
      setProdPrice('');
      await fetchProducts(userId);
    } else {
      alert('Σφάλμα: ' + error.message);
    }
    setSubmittingProd(false);
  };

  // Νέα συνάρτηση διαγραφής προϊόντος
  const handleDeleteProduct = async (id: number) => {
    // Check if email is verified
    if (!emailConfirmedAt) {
      setShowEmailVerificationWarning(true);
      return;
    }

    const confirmDelete = window.confirm('Είστε σίγουρος ότι θέλετε να διαγράψετε αυτό το προϊόν;');
    if (!confirmDelete) return;

    if (!userId) return;
    const { error } = await supabase.from('products').delete().eq('id', id).eq('farmer_id', userId);

    if (!error) {
      await fetchProducts(userId);
    } else {
      alert('Σφάλμα διαγραφής: ' + error.message);
    }
  };

  const handleStartPriceEdit = (product: Product) => {
    setEditingPriceId(product.id);
    setPriceDraft(String(product.price));
  };

  const handleSavePriceEdit = async (id: number) => {
    // Check if email is verified
    if (!emailConfirmedAt) {
      setShowEmailVerificationWarning(true);
      return;
    }

    if (!userId) return;
    const parsedPrice = Number(priceDraft);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      alert('Παρακαλώ εισάγετε μια έγκυρη τιμή.');
      return;
    }

    setUpdatingPrice(true);
    const { error } = await supabase
      .from('products')
      .update({
        price: parsedPrice,
      })
      .eq('id', id)
      .eq('farmer_id', userId);

    if (!error) {
      setEditingPriceId(null);
      setPriceDraft('');
      await fetchProducts(userId);
    } else {
      alert('Σφάλμα ενημέρωσης τιμής: ' + error.message);
    }

    setUpdatingPrice(false);
  };

  const handleRequestStatus = async (requestId: number, status: PurchaseRequest['status']) => {
    // Check if email is verified
    if (!emailConfirmedAt) {
      setShowEmailVerificationWarning(true);
      return;
    }

    if (!userId) return;

    setUpdatingRequestId(requestId);
    const { error } = await supabase
      .from('purchase_requests')
      .update({ status })
      .eq('id', requestId)
      .eq('farmer_id', userId);

    if (error) {
      alert(`Σφάλμα ενημέρωσης αιτήματος: ${error.message}`);
    } else {
      await fetchRequests(userId);
    }
    setUpdatingRequestId(null);
  };

  const handleConfirmRequest = (requestId: number) => {
    // Check if email is verified
    if (!emailConfirmedAt) {
      setShowEmailVerificationWarning(true);
      return;
    }

    setConfirmingRequestId(requestId);
  };

  const handleConfirmRequestDialog = async (requestId: number) => {
    await handleRequestStatus(requestId, 'confirmed');
    setConfirmingRequestId(null);
    // Open chat after confirming
    setChatRequestId(requestId);
  };

  const handleCancelConfirm = () => {
    setConfirmingRequestId(null);
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

  const activeProducts = products.filter((product) => product.status.toLowerCase().includes('ενεργ')).length;
  const estimatedInventoryValue = products.reduce(
    (total, product) => total + product.price * product.quantity,
    0,
  );
  const estimatedOpenRequestsRevenue = requests.reduce((total, request) => {
    if (request.status !== 'pending' && request.status !== 'confirmed') {
      return total;
    }

    const { price } = getRequestProductDetails(request);
    return total + request.requested_quantity * price;
  }, 0);
  const formatCurrency = (value: number) => new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="flex items-center gap-3 text-sm font-medium text-stone-600"><Leaf className="h-5 w-5 animate-pulse text-emerald-700" />Φόρτωση πίνακα ελέγχου...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-stone-200 bg-white hidden lg:block">
        <div className="p-6 border-b border-stone-100">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-white"><Leaf className="h-5 w-5" /></div>
            <div>
              <h1 className="text-lg font-bold text-emerald-900">AgroDirect</h1>
              <p className="text-xs text-stone-500">Χώρος αγρότη</p>
            </div>
          </Link>
        </div>
        <nav className="mt-5 px-3 space-y-1" aria-label="Κύρια πλοήγηση">
          <button type="button" onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${activeTab === 'profile' ? 'bg-emerald-50 font-semibold text-emerald-800' : 'font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}>
            <User className="h-4 w-4" /> Το Προφίλ μου
          </button>
          <button type="button" onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${activeTab === 'overview' ? 'bg-emerald-50 font-semibold text-emerald-800' : 'font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}>
            <LayoutDashboard className="h-4 w-4" /> Επισκόπηση &amp; Προϊόντα
          </button>
          <button type="button" onClick={() => setActiveTab('requests')} className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${activeTab === 'requests' ? 'bg-emerald-50 font-semibold text-emerald-800' : 'font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}>
            <ClipboardList className="h-4 w-4" /> Αιτήματα πελατών
            {requests.filter((r) => r.status === 'pending').length > 0 && (
              <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">{requests.filter((r) => r.status === 'pending').length}</span>
            )}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-stone-200 h-16 flex items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 lg:hidden"><Leaf className="h-5 w-5 text-emerald-700" /><span className="font-bold text-emerald-900">AgroDirect</span></Link>
          <p className="hidden lg:block text-sm text-stone-500">Πίνακας ελέγχου αγρότη</p>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 border border-stone-300 hover:border-red-200 hover:bg-red-50 hover:text-red-700 text-stone-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Αποσύνδεση</span>
          </button>
        </header>

        {/* Dashboard Body */}
        <main className="p-4 sm:p-8 flex-1 space-y-8 max-w-7xl w-full mx-auto">
          {/* Καρτέλες πλοήγησης */}
          <div className="flex border-b border-stone-200 -mt-4 sm:-mt-8 -mx-4 sm:-mx-8 px-4 sm:px-8">
            <button type="button" onClick={() => setActiveTab('profile')} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${activeTab === 'profile' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-900'}`}>
              <User className="h-4 w-4" /> Το Προφίλ μου
            </button>
            <button type="button" onClick={() => setActiveTab('overview')} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'overview' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-900'}`}>
              Επισκόπηση &amp; Προϊόντα
            </button>
            <button type="button" onClick={() => setActiveTab('requests')} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${activeTab === 'requests' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-900'}`}>
              Αιτήματα πελατών
              {requests.filter((r) => r.status === 'pending').length > 0 && (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">{requests.filter((r) => r.status === 'pending').length}</span>
              )}
            </button>
          </div>
          <section id="overview" className={`border-b border-stone-200 pb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between${activeTab !== 'overview' ? ' hidden' : ''}`}>
            <div>
              <p className="text-xs font-bold tracking-wide text-emerald-700">ΠΙΝΑΚΑΣ ΕΛΕΓΧΟΥ</p>
              <h2 className="mt-2 text-3xl font-bold text-stone-900">Καλώς ήρθες, {userName ?? userEmail}</h2>
              <p className="mt-2 text-sm text-stone-600">Παρακολούθησε την παραγωγή σου και διαχειρίσου τις καταχωρήσεις σου.</p>
            </div>
            <a href="#new-product" className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-sm font-semibold transition-colors"><Plus className="h-4 w-4" />Νέο προϊόν</a>
          </section>

          <section className={`grid grid-cols-1 sm:grid-cols-4 gap-4${activeTab !== 'overview' ? ' hidden' : ''}`} aria-label="Στατιστικά προϊόντων">
            <article className="border border-stone-200 bg-white p-5">
              <div className="flex justify-between"><div><p className="text-sm font-medium text-stone-500">Συνολικά προϊόντα</p><p className="mt-2 text-3xl font-bold">{products.length}</p></div><Package className="h-5 w-5 text-emerald-700" /></div>
            </article>
            <article className="border border-stone-200 bg-white p-5">
              <div className="flex justify-between"><div><p className="text-sm font-medium text-stone-500">Ενεργές καταχωρήσεις</p><p className="mt-2 text-3xl font-bold">{activeProducts}</p></div><ShoppingBag className="h-5 w-5 text-amber-600" /></div>
            </article>
            <article className="border border-stone-200 bg-white p-5">
              <div className="flex justify-between"><div><p className="text-sm font-medium text-stone-500">Αξία αποθέματος</p><p className="mt-2 text-2xl font-bold">{formatCurrency(estimatedInventoryValue)}</p></div><CircleDollarSign className="h-5 w-5 text-sky-700" /></div>
            </article>
            <article className="border border-stone-200 bg-white p-5">
              <div className="flex justify-between"><div><p className="text-sm font-medium text-stone-500">Εκτιμώμενο κέρδος από ανοιχτά αιτήματα</p><p className="mt-2 text-2xl font-bold">{formatCurrency(estimatedOpenRequestsRevenue)}</p></div><CircleDollarSign className="h-5 w-5 text-emerald-700" /></div>
            </article>
          </section>
          
          {/* Grid για Προϊόντα Προς Πώληση */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-8${activeTab !== 'overview' ? ' hidden' : ''}`}>
            <div id="new-product" className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-2"><Plus className="h-5 w-5 text-emerald-700" />Καταχώρηση νέου προϊόντος</h3>
              <p className="text-sm text-stone-500 mb-5">Δημοσίευσε ένα προϊόν για τους αγοραστές σου.</p>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Τίτλος Προϊόντος</label>
                  <input
                    type="text"
                    required
                    value={prodTitle}
                    onChange={(e) => setProdTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="π.χ. Εξαιρετικά Παρθένο Ελαιόλαδο"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ποσότητα</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={prodQuantity}
                      onChange={(e) => setProdQuantity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="π.χ. 100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Μονάδα</label>
                    <select
                      value={prodUnit}
                      onChange={(e) => setProdUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                    >
                      <option value="κιλό">Κιλό</option>
                      <option value="τεμάχιο">Τεμάχιο(α)</option>
                      <option value="λίτρο">Λίτρο(α)</option>
                      <option value="γραμμάριο">Γραμμάριο(α)</option>
                      <option value="ματσάκι">Ματσάκι</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Τιμή (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="π.χ. 8.50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingProd}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 px-4 rounded-md text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  <Plus className="h-4 w-4" />{submittingProd ? 'Αποθήκευση...' : 'Δημοσίευση προϊόντος'}
                </button>
              </form>
            </div>

            <div id="products" className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-2"><Package className="h-5 w-5 text-emerald-700" />Τα προϊόντα μου</h3>
              <p className="text-sm text-stone-500 mb-5">{products.length} καταχωρήσεις προς πώληση</p>
              {products.length === 0 ? (
                <p className="text-gray-500 text-sm">Δεν έχετε καταχωρήσει προϊόντα προς πώληση.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {products.map((prod) => (
                    <li key={prod.id} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800">{prod.title}</p>
                          <p className="text-xs text-gray-500">Ποσότητα: {prod.quantity} {getUnitLabel(prod.unit, prod.quantity)}</p>
                          {editingPriceId === prod.id ? (
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={priceDraft}
                                onChange={(event) => setPriceDraft(event.target.value)}
                                className="w-24 rounded-md border border-stone-300 px-2 py-1 text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => void handleSavePriceEdit(prod.id)}
                                disabled={updatingPrice}
                                className="rounded-md bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white"
                              >
                                {updatingPrice ? '...' : 'Αποθήκευση'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPriceId(null);
                                  setPriceDraft('');
                                }}
                                className="text-xs text-stone-500"
                              >
                                Ακύρωση
                              </button>
                            </div>
                          ) : (
                            <p className="mt-1 text-sm font-semibold text-emerald-700">Τιμή: {prod.price.toFixed(2)} €</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="hidden sm:inline px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-full">
                            {prod.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartPriceEdit(prod)}
                            className="rounded-md p-2 text-stone-400 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                            title="Αλλαγή τιμής"
                            aria-label={`Αλλαγή τιμής για ${prod.title}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            aria-label={`Διαγραφή ${prod.title}`}
                            title="Διαγραφή προϊόντος"
                            className="text-stone-400 hover:text-red-700 p-2 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <section id="requests" className={`rounded-lg border border-stone-200 bg-white p-6 shadow-sm${activeTab !== 'requests' ? ' hidden' : ''}`}>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900"><ClipboardList className="h-5 w-5 text-emerald-700" />Αιτήματα πελατών</h3>
                <p className="mt-1 text-sm text-stone-500">Επιβεβαιώστε τη διαθεσιμότητα και ενημερώστε τον καταναλωτή.</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">{requests.filter((request) => request.status === 'pending').length} νέα</span>
            </div>
            {requests.length === 0 ? (
              <p className="text-sm text-stone-500">Δεν υπάρχουν αιτήματα ακόμη.</p>
            ) : (
              <ul className="divide-y divide-stone-200">
                {requests.map((request) => (
                  <li key={request.id} className="py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        {(() => {
                          const productDetails = getRequestProductDetails(request);
                          const unit = productDetails.unit;
                          const unitPrice = productDetails.price;
                          const totalCost = request.requested_quantity * unitPrice;

                          return (
                            <>
                              <p className="font-semibold text-stone-900">{request.product_title}</p>
                              <p className="mt-1 text-sm text-stone-600">
                                Ποσότητα: {request.requested_quantity} {getUnitLabel(unit, request.requested_quantity)}
                              </p>
                              <p className="mt-1 text-sm text-stone-600">
                                Ενδεικτικό κόστος: {formatCurrency(totalCost)} ({formatCurrency(unitPrice)} / {unit || 'μονάδα'})
                              </p>
                              {request.status === 'confirmed' || request.status === 'completed' ? (
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <p className="text-xs text-emerald-700">
                                    Στοιχεία αγοραστή: {request.buyer_email ?? 'χωρίς email'} · {request.buyer_phone ?? 'χωρίς κινητό'}
                                  </p>
                                  {request.buyer_phone && (
                                    <a
                                      href={`tel:${sanitizePhoneForTel(request.buyer_phone)}`}
                                      className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-800"
                                    >
                                      <Phone className="h-3 w-3" /> Κλήση
                                    </a>
                                  )}
                                  {request.status === 'completed' && (
                                    <div className="mt-2 rounded-md bg-emerald-50 border border-emerald-200 p-2 w-full">
                                      <p className="text-xs font-semibold text-emerald-700">Συνολικό κέρδος:</p>
                                      <p className="text-sm font-bold text-emerald-800">{formatCurrency(request.requested_quantity * request.unit_price_at_request)}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="mt-1 text-xs text-stone-500">Τα στοιχεία επικοινωνίας του αγοραστή εμφανίζονται μετά την επιβεβαίωση.</p>
                              )}
                              {request.message && <p className="mt-2 rounded-md bg-stone-50 p-2 text-sm text-stone-600">{request.message}</p>}
                            </>
                          );
                        })()}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="mr-1 text-sm font-medium text-emerald-800">{requestStatusLabels[request.status]}</span>
                        {request.status === 'pending' && <>
                          <button type="button" disabled={updatingRequestId === request.id} onClick={() => handleConfirmRequest(request.id)} className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-emerald-400">Επιβεβαίωση</button>
                          <button type="button" disabled={updatingRequestId === request.id} onClick={() => void handleRequestStatus(request.id, 'rejected')} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">Απόρριψη</button>
                        </>}
                        {request.status === 'confirmed' && <button type="button" disabled={updatingRequestId === request.id} onClick={() => void handleRequestStatus(request.id, 'completed')} className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-sky-400">Ολοκληρώθηκε</button>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="profile" className={`rounded-lg border border-stone-200 bg-white p-6 shadow-sm${activeTab !== 'profile' ? ' hidden' : ''}`}>
            <h2 className="mb-5 text-xl font-semibold text-stone-800">Το Προφίλ μου</h2>
            {!editingProfile ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold text-stone-600 mb-1">Ονοματεπώνυμο</p>
                  <p className="text-base text-stone-900">{userName || 'Επανόθηση απαιτείται'}</p>
                </div>
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold text-stone-600 mb-1">Email</p>
                  <p className="text-base text-stone-900">{userEmail || 'Επανόθηση απαιτείται'}</p>
                </div>
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold text-stone-600 mb-1">Κινητό τηλέφωνο</p>
                  <p className="text-base text-stone-900">{userPhone || 'Επανόθηση απαιτείται'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileForm({ fullName: userName || '', email: userEmail || '', phone: userPhone || '' });
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
                  const { error } = await supabase.auth.updateUser({
                    data: {
                      full_name: profileForm.fullName.trim(),
                      phone: profileForm.phone.trim(),
                    },
                  });
                  
                  if (!error && userId) {
                    // Update farmer_profiles table as well
                    await supabase.from('farmer_profiles').upsert({
                      user_id: userId,
                      contact_phone: profileForm.phone.trim(),
                    });
                  }
                  
                  if (error) {
                    alert('Σφάλμα αποθήκευσης: ' + error.message);
                  } else {
                    setUserName(profileForm.fullName.trim());
                    setUserPhone(profileForm.phone.trim());
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
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="π.χ. 69XXXXXXXX"
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

      {/* Confirmation Dialog for Request Confirmation */}
      {confirmingRequestId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          {(() => {
            const confirmRequest = requests.find((r) => r.id === confirmingRequestId);
            if (!confirmRequest) return null;
            const productDetails = getRequestProductDetails(confirmRequest);
            const unit = productDetails.unit;
            const unitPrice = productDetails.price;
            const totalCost = confirmRequest.requested_quantity * unitPrice;
            return (
              <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-4">
                  <h2 id="confirm-title" className="text-lg font-bold text-stone-900">
                    Επιβεβαίωση Αιτήματος
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Επιβεβαιώστε αν θέλετε να αποδεχτείτε αυτό το αίτημα
                  </p>
                </div>

                <div className="mb-4 space-y-3 rounded-lg bg-stone-50 p-4">
                  <div>
                    <p className="text-xs font-semibold text-stone-600">Προϊόν</p>
                    <p className="text-base font-semibold text-stone-900">{confirmRequest.product_title}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-600">Ποσότητα</p>
                    <p className="text-base text-stone-900">{confirmRequest.requested_quantity} {getUnitLabel(unit, confirmRequest.requested_quantity)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-600">Τιμή</p>
                    <p className="text-base text-stone-900">{formatCurrency(totalCost)} ({formatCurrency(unitPrice)} / {unit || 'μονάδα'})</p>
                  </div>
                  {confirmRequest.message && (
                    <div>
                      <p className="text-xs font-semibold text-stone-600">Μήνυμα αγοραστή</p>
                      <p className="text-sm text-stone-700 italic">{confirmRequest.message}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleConfirmRequestDialog(confirmingRequestId)}
                    disabled={updatingRequestId === confirmingRequestId}
                    className="flex-1 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:bg-emerald-400"
                  >
                    {updatingRequestId === confirmingRequestId ? 'Αποθήκευση...' : 'Επιβεβαίωση'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelConfirm}
                    disabled={updatingRequestId === confirmingRequestId}
                    className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 disabled:border-stone-200"
                  >
                    Αργότερα
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Chat Modal for Confirmed Requests */}
      {chatRequestId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="chat-title">
          {(() => {
            const chatRequest = requests.find((r) => r.id === chatRequestId);
            return (
              <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl flex flex-col max-h-[80vh]">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 id="chat-title" className="text-lg font-bold text-stone-900">
                      Επικοινωνία: {chatRequest?.product_title}
                    </h2>
                    <p className="mt-1 text-sm text-stone-500">
                      Αγοραστής: {chatRequest?.buyer_email || 'Χωρίς email'} · {chatRequest?.buyer_phone || 'Χωρίς κινητό'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setChatRequestId(null);
                      setChatMessage('');
                    }}
                    className="text-sm text-stone-500 hover:text-stone-900"
                  >
                    Κλείσιμο
                  </button>
                </div>

                <div className="mb-4 flex-1 overflow-y-auto rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <p className="text-sm text-stone-600 mb-3 p-2 bg-white rounded border border-stone-200">
                    <strong>Αγοραστής:</strong> Θα ήθελα {chatRequest?.requested_quantity} {getUnitLabel(chatRequest?.unit_at_request || '', chatRequest?.requested_quantity || 0)} του {chatRequest?.product_title}
                  </p>
                  {chatRequest?.message && (
                    <p className="text-sm text-stone-600 mb-3 p-2 bg-white rounded border border-stone-200">
                      <strong>Μήνυμα:</strong> {chatRequest.message}
                    </p>
                  )}
                  <p className="text-xs text-stone-500 italic">Ξεκινήστε τη συνεννόηση με τον αγοραστή...</p>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!chatMessage.trim() || !chatRequestId) return;

                    setSendingChat(true);
                    // In a real app, this would save the message to a messages table
                    // For now, we just show a confirmation
                    alert('Μήνυμα που θα στείλετε: ' + chatMessage);
                    setChatMessage('');
                    setChatRequestId(null);
                    setSendingChat(false);
                  }}
                  className="space-y-3"
                >
                  <textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Γράψτε το μήνυμά σας εδώ..."
                    maxLength={500}
                    rows={3}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={sendingChat || !chatMessage.trim()}
                      className="flex-1 rounded-lg bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:bg-emerald-400"
                    >
                      {sendingChat ? 'Αποστολή...' : 'Αποστολή μηνύματος'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChatRequestId(null);
                        setChatMessage('');
                      }}
                      className="flex-1 rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                    >
                      Αργότερα
                    </button>
                  </div>
                </form>
              </div>
            );
          })()}
        </div>
      )}

      {/* Email Verification Warning Modal */}
      {showEmailVerificationWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-stone-900 mb-2">📧 Επιβεβαίωση Email Απαιτείται</h3>
            <p className="text-stone-600 mb-6">
              Για να μπορέσεις να δημοσιεύσεις προϊόντα και να ενεργοποιήσεις λειτουργίες, πρέπει πρώτα να επιβεβαιώσεις το email σου. 
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
