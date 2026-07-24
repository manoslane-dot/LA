'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CircleDollarSign, ClipboardList, LayoutDashboard, Leaf, LogOut, Package, Pencil, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
  product_title: string;
  buyer_email: string | null;
  requested_quantity: number;
  message: string | null;
  status: 'pending' | 'confirmed' | 'ready' | 'rejected';
  created_at: string;
}

const requestStatusLabels: Record<PurchaseRequest['status'], string> = {
  pending: 'Σε αναμονή',
  confirmed: 'Επιβεβαιώθηκε',
  ready: 'Έτοιμο για παραλαβή',
  rejected: 'Απορρίφθηκε',
};

export default function FarmerDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
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
      .select('id, product_title, buyer_email, requested_quantity, message, status, created_at')
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
      
      setUserEmail(session.user.email ?? 'Πωλητής');
      setUserId(session.user.id);
      await Promise.all([fetchCrops(), fetchProducts(session.user.id), fetchRequests(session.user.id)]);
      setLoading(false);
    };

    void checkUserAndFetchData();
  }, [router, supabase, fetchCrops, fetchProducts, fetchRequests]);

  const handleAddCrop = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  const activeProducts = products.filter((product) => product.status.toLowerCase().includes('ενεργ')).length;
  const estimatedInventoryValue = products.reduce(
    (total, product) => total + product.price * product.quantity,
    0,
  );
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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-white"><Leaf className="h-5 w-5" /></div>
            <div>
              <h1 className="text-lg font-bold text-emerald-900">AgroDirect</h1>
              <p className="text-xs text-stone-500">Χώρος αγρότη</p>
            </div>
          </div>
        </div>
        <nav className="mt-5 px-3 space-y-1" aria-label="Κύρια πλοήγηση">
          <a href="#overview" className="flex items-center gap-3 rounded-md bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800">
            <LayoutDashboard className="h-4 w-4" /> Επισκόπηση
          </a>
          <a href="#products" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900">
            <Package className="h-4 w-4" /> Προϊόντα
          </a>
          <a href="#requests" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900">
            <ClipboardList className="h-4 w-4" /> Αιτήματα πελατών
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-stone-200 h-16 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2 lg:hidden"><Leaf className="h-5 w-5 text-emerald-700" /><span className="font-bold text-emerald-900">AgroDirect</span></div>
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
          <section id="overview" className="border-b border-stone-200 pb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-wide text-emerald-700">ΠΙΝΑΚΑΣ ΕΛΕΓΧΟΥ</p>
              <h2 className="mt-2 text-3xl font-bold text-stone-900">Καλώς ήρθες, {userEmail}</h2>
              <p className="mt-2 text-sm text-stone-600">Παρακολούθησε την παραγωγή σου και διαχειρίσου τις καταχωρήσεις σου.</p>
            </div>
            <a href="#new-product" className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-sm font-semibold transition-colors"><Plus className="h-4 w-4" />Νέο προϊόν</a>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Στατιστικά προϊόντων">
            <article className="border border-stone-200 bg-white p-5">
              <div className="flex justify-between"><div><p className="text-sm font-medium text-stone-500">Συνολικά προϊόντα</p><p className="mt-2 text-3xl font-bold">{products.length}</p></div><Package className="h-5 w-5 text-emerald-700" /></div>
            </article>
            <article className="border border-stone-200 bg-white p-5">
              <div className="flex justify-between"><div><p className="text-sm font-medium text-stone-500">Ενεργές καταχωρήσεις</p><p className="mt-2 text-3xl font-bold">{activeProducts}</p></div><ShoppingBag className="h-5 w-5 text-amber-600" /></div>
            </article>
            <article className="border border-stone-200 bg-white p-5">
              <div className="flex justify-between"><div><p className="text-sm font-medium text-stone-500">Αξία αποθέματος</p><p className="mt-2 text-2xl font-bold">{formatCurrency(estimatedInventoryValue)}</p></div><CircleDollarSign className="h-5 w-5 text-sky-700" /></div>
            </article>
          </section>
          
          {/* Grid για Προϊόντα Προς Πώληση */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                      <option value="τεμάχιο">Ανά τεμάχιο</option>
                      <option value="τενεκές">Τενεκές</option>
                      <option value="λίτρα">Δοχείο σε λίτρα</option>
                      <option value="ματσάκι">Ματσάκι</option>
                      <option value="κούτα">Κούτα</option>
                      <option value="κιλό">Κιλό</option>
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
                          <p className="text-xs text-gray-500">Ποσότητα: {prod.quantity} {prod.unit}</p>
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

          <section id="requests" className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
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
                        <p className="font-semibold text-stone-900">{request.product_title}</p>
                        <p className="mt-1 text-sm text-stone-600">Ποσότητα: {request.requested_quantity} · Αγοραστής: {request.buyer_email ?? 'Δεν υπάρχει email'}</p>
                        {request.message && <p className="mt-2 rounded-md bg-stone-50 p-2 text-sm text-stone-600">{request.message}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="mr-1 text-sm font-medium text-emerald-800">{requestStatusLabels[request.status]}</span>
                        {request.status === 'pending' && <>
                          <button type="button" disabled={updatingRequestId === request.id} onClick={() => void handleRequestStatus(request.id, 'confirmed')} className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-emerald-400">Επιβεβαίωση</button>
                          <button type="button" disabled={updatingRequestId === request.id} onClick={() => void handleRequestStatus(request.id, 'rejected')} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">Απόρριψη</button>
                        </>}
                        {request.status === 'confirmed' && <button type="button" disabled={updatingRequestId === request.id} onClick={() => void handleRequestStatus(request.id, 'ready')} className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-sky-400">Έτοιμο για παραλαβή</button>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

        </main>
      </div>
    </div>
  );
}
