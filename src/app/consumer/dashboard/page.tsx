'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ClipboardList, LogOut, Leaf } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  clearLoginPreference,
  ensureLoginPreferenceInitialized,
  shouldLogoutOnAppClose,
} from '@/lib/auth/sessionPersistence';
import { getDashboardForRole, normalizeUserRole } from '@/lib/auth/roleRouting';

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
  buyer_email: string | null;
  buyer_phone: string | null;
  requested_quantity: number;
  status: 'pending' | 'confirmed' | 'ready' | 'rejected';
  unit_at_request: string;
  unit_price_at_request: number;
  products: { unit: string; price: number } | { unit: string; price: number }[] | null;
}

const requestStatusLabels: Record<PurchaseRequest['status'], string> = {
  pending: 'Σε αναμονή',
  confirmed: 'Επιβεβαιώθηκε',
  ready: 'Έτοιμο για παραλαβή',
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
  const [products, setProducts] = useState<Product[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState<string | null>(null);
  const [buyerPhone, setBuyerPhone] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [requestedQuantity, setRequestedQuantity] = useState('1');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatCurrency = (value: number) => new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .not('farmer_id', 'is', null)
      .order('id', { ascending: false });

    if (error) {
      console.error('Σφάλμα κατά τη φόρτωση προϊόντων:', error.message);
      setErrorMsg('Δεν ήταν δυνατή η φόρτωση των προϊόντων.');
      return;
    }

    setProducts((data ?? []) as Product[]);
  }, [supabase]);

  const fetchRequests = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('purchase_requests')
      .select('id, product_id, product_title, buyer_email, buyer_phone, requested_quantity, status, unit_at_request, unit_price_at_request, products(unit,price)')
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Σφάλμα κατά τη φόρτωση αιτημάτων:', error.message);
      return;
    }

    setRequests((data ?? []) as PurchaseRequest[]);
  }, [supabase]);

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
        }
      }

      setLoading(true);
      setBuyerId(session.user.id);
      setBuyerEmail(session.user.email ?? null);
      setBuyerPhone((session.user.user_metadata?.phone as string | undefined) ?? '');
      await Promise.all([fetchProducts(), fetchRequests(session.user.id)]);
      setLoading(false);
    };

    void loadDashboard();
  }, [fetchProducts, fetchRequests, supabase, router]);

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

    const sanitizedPhone = buyerPhone.trim();
    if (sanitizedPhone.length < 7) {
      setErrorMsg('Συμπληρώστε ένα έγκυρο κινητό τηλέφωνο.');
      return;
    }

    const quantity = Number(requestedQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setErrorMsg('Συμπληρώστε μια έγκυρη ποσότητα.');
      return;
    }

    if (quantity > selectedProduct.quantity) {
      setErrorMsg(`Η διαθέσιμη ποσότητα είναι ${selectedProduct.quantity} ${selectedProduct.unit}.`);
      return;
    }

    const totalCost = quantity * selectedProduct.price;

    setSubmitting(true);
    setErrorMsg('');
    const { error } = await supabase.from('purchase_requests').insert({
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
    });

    if (error) {
      setErrorMsg(`Δεν στάλθηκε το αίτημα: ${error.message}`);
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
          <a href="#products" className="flex items-center gap-3 rounded-md bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800">
            <ShoppingBag className="h-4 w-4" /> Διαθέσιμα Προϊόντα
          </a>
          <a href="#requests" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900">
            <ClipboardList className="h-4 w-4" /> Τα Αιτήματά μου
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-stone-200 h-16 flex items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 lg:hidden"><Leaf className="h-5 w-5 text-emerald-700" /><span className="font-bold text-emerald-900">AgroDirect</span></Link>
          <p className="hidden lg:block text-sm text-stone-500">Πίνακας ελέγχου καταναλωτή</p>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 border border-stone-300 hover:border-red-200 hover:bg-red-50 hover:text-red-700 text-stone-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Αποσύνδεση</span>
          </button>
        </header>

        {/* Dashboard Body */}
        <main className="p-4 sm:p-8 flex-1 space-y-8 max-w-7xl w-full mx-auto">
          <section id="overview" className="border-b border-stone-200 pb-7">
            <p className="text-xs font-bold tracking-wide text-emerald-700">ΠΙΝΑΚΑΣ ΕΛΕΓΧΟΥ</p>
            <h2 className="mt-2 text-3xl font-bold text-stone-900">Καλώς ήρθες, {buyerEmail}</h2>
            <p className="mt-2 text-sm text-stone-600">Ανακάλυψε φρέσκα προϊόντα και δες την κατάσταση των αιτημάτων σου.</p>
          </section>

          {successMsg && <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{successMsg}</div>}
          {errorMsg && !selectedProduct && <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errorMsg}</div>}

          <section id="products">
            <h2 className="mb-4 text-xl font-semibold text-stone-800">Διαθέσιμα προϊόντα</h2>
            {products.length === 0 ? <p className="text-sm text-stone-500">Δεν υπάρχουν διαθέσιμα προϊόντα αυτή τη στιγμή.</p> : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((item) => (
                  <article key={item.id} className="rounded-lg border border-emerald-200 bg-white p-4 flex flex-col">
                    <div className="mb-2 flex items-start justify-between gap-3"><h3 className="text-base font-bold text-stone-900">{item.title}</h3><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">{item.status}</span></div>
                    <p className="mb-4 text-sm text-stone-600">Τιμή: <strong className="text-emerald-700">{item.price} EUR / {item.unit}</strong><br />Διαθέσιμη ποσότητα: <strong>{item.quantity} {getUnitLabel(item.unit, item.quantity)}</strong></p>
                    <div className="mt-auto">
                      <button type="button" onClick={() => openRequestForm(item)} className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-800">Αποστολή αιτήματος</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="requests" className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold text-stone-800">Τα αιτήματά μου</h2>
            {requests.length === 0 ? <p className="text-sm text-stone-500">Δεν έχετε στείλει ακόμη αίτημα σε παραγωγό.</p> : (
              <ul className="divide-y divide-stone-200">
                {requests.map((request) => {
                  const productDetails = getRequestProductDetails(request);
                  const unit = productDetails.unit;
                  const unitPrice = productDetails.price;
                  const totalCost = request.requested_quantity * unitPrice;
                  const isContactVisible = request.status === 'confirmed' || request.status === 'ready';
                  return (
                    <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                      <div className="flex-grow">
                        <strong className="text-stone-900">{request.product_title}</strong>
                        <span className="text-stone-500"> · {request.requested_quantity} {getUnitLabel(unit, request.requested_quantity)}</span>
                        <p className="mt-1 text-sm text-stone-600">Εκτιμώμενο κόστος: <strong className="text-base font-bold text-emerald-700">{formatCurrency(totalCost)}</strong> <span className="text-xs">({formatCurrency(unitPrice)} / {unit || 'μονάδα'})</span></p>
                        {isContactVisible ? (
                          <p className="mt-1 text-xs text-emerald-700">
                            Στοιχεία επικοινωνίας που κοινοποιήθηκαν: {request.buyer_email ?? buyerEmail ?? 'χωρίς email'} · {(request.buyer_phone ?? buyerPhone) || 'χωρίς κινητό'}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-stone-500">Τα στοιχεία επικοινωνίας παραμένουν κρυφά μέχρι την έγκριση από τον παραγωγό.</p>
                        )}
                      </div>
                      <span className="shrink-0 font-medium text-emerald-800">{requestStatusLabels[request.status]}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </main>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="request-title">
          <form onSubmit={handleRequest} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4"><div><h2 id="request-title" className="text-lg font-bold text-stone-900">Αίτημα για {selectedProduct.title}</h2><p className="mt-1 text-sm text-stone-500">Ο παραγωγός θα απαντήσει στη διαθεσιμότητα.</p></div><button type="button" onClick={() => setSelectedProduct(null)} className="text-sm text-stone-500 hover:text-stone-900">Κλείσιμο</button></div>
            {errorMsg && <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errorMsg}</div>}
            <label className="mb-4 block text-sm font-medium text-stone-700">Κινητό τηλέφωνο επικοινωνίας
              <input
                type="tel"
                required
                value={buyerPhone}
                onChange={(event) => setBuyerPhone(event.target.value)}
                placeholder="π.χ. 69XXXXXXXX"
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
              />
            </label>
            <label className="mb-4 block text-sm font-medium text-stone-700">Ποσότητα ({selectedProduct.unit})<input type="number" min="0.01" step="any" max={selectedProduct.quantity} required value={requestedQuantity} onChange={(event) => setRequestedQuantity(event.target.value)} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2" /></label>
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
    </div>
  );
}
