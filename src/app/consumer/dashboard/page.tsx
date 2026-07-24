'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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
  product_title: string;
  requested_quantity: number;
  status: 'pending' | 'confirmed' | 'ready' | 'rejected';
  products: { unit: string }[] | null;
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [requestedQuantity, setRequestedQuantity] = useState('1');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      .select('id, product_title, requested_quantity, status, products(unit)')
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
      setLoading(true);

      // Public products are visible to all visitors.
      await fetchProducts();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setBuyerId(session.user.id);
        setBuyerEmail(session.user.email ?? null);
        await fetchRequests(session.user.id);
      } else {
        setBuyerId(null);
        setBuyerEmail(null);
      }

      setLoading(false);
    };

    void loadDashboard();
  }, [fetchProducts, fetchRequests, supabase]);

  const openRequestForm = (product: Product) => {
    if (!buyerId) {
      // Redirect to login if user is not authenticated
      router.push('/auth');
      return;
    }

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

    const quantity = Number(requestedQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setErrorMsg('Συμπληρώστε μια έγκυρη ποσότητα.');
      return;
    }

    if (quantity > selectedProduct.quantity) {
      setErrorMsg(`Η διαθέσιμη ποσότητα είναι ${selectedProduct.quantity} ${selectedProduct.unit}.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    const { error } = await supabase.from('purchase_requests').insert({
      product_id: selectedProduct.id,
      product_title: selectedProduct.title,
      farmer_id: selectedProduct.farmer_id,
      buyer_id: buyerId,
      buyer_email: buyerEmail,
      requested_quantity: quantity,
      message: message.trim() || null,
    });

    if (error) {
      setErrorMsg(`Δεν στάλθηκε το αίτημα: ${error.message}`);
    } else {
      setSelectedProduct(null);
      setSuccessMsg(`Το αίτημα για ${selectedProduct.title} στάλθηκε στον παραγωγό.`);
      await fetchRequests(buyerId);
      window.setTimeout(() => setSuccessMsg(''), 5000);
    }

    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-stone-50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6 rounded-lg bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-900">AgroDirect - Καταναλωτής</h1>
            <p className="text-sm text-stone-500">Φρέσκα προϊόντα απευθείας από τους παραγωγούς</p>
          </div>
          <Link href="/" className="rounded-md bg-stone-100 px-3 py-1.5 text-sm font-medium hover:bg-stone-200">Αρχική</Link>
        </div>

        {successMsg && <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{successMsg}</div>}
        {errorMsg && <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errorMsg}</div>}

        <section>
          <h2 className="mb-4 text-lg font-semibold text-stone-800">Διαθέσιμα προϊόντα</h2>
          {loading ? <p className="text-sm text-stone-500">Φόρτωση φρέσκων προϊόντων...</p> : products.length === 0 ? <p className="text-sm text-stone-500">Δεν υπάρχουν διαθέσιμα προϊόντα αυτή τη στιγμή.</p> : (
            <div className="grid gap-4 sm:grid-cols-2">
              {products.map((item) => (
                <article key={item.id} className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-4">
                  <div className="mb-2 flex items-start justify-between gap-3"><h3 className="text-base font-bold text-stone-900">{item.title}</h3><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">{item.status}</span></div>
                  <p className="mb-4 text-sm text-stone-600">Τιμή: <strong className="text-emerald-700">{item.price} EUR / {item.unit}</strong><br />Διαθέσιμη ποσότητα: <strong>{item.quantity} {getUnitLabel(item.unit, item.quantity)}</strong></p>
                  <button type="button" onClick={() => openRequestForm(item)} className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-800">Αποστολή αιτήματος</button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="border-t border-stone-200 pt-6">
          <h2 className="mb-3 text-lg font-semibold text-stone-800">Τα αιτήματά μου</h2>
          {requests.length === 0 ? <p className="text-sm text-stone-500">Δεν έχετε στείλει ακόμη αίτημα σε παραγωγό.</p> : (
            <ul className="divide-y divide-stone-200 rounded-md border border-stone-200">
              {requests.map((request) => {
                const unit = request.products?.[0]?.unit ?? '';
                return (
                  <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                    <div><strong className="text-stone-900">{request.product_title}</strong><span className="text-stone-500"> · {request.requested_quantity} {getUnitLabel(unit, request.requested_quantity)}</span></div>
                    <span className="font-medium text-emerald-800">{requestStatusLabels[request.status]}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="request-title">
          <form onSubmit={handleRequest} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4"><div><h2 id="request-title" className="text-lg font-bold text-stone-900">Αίτημα για {selectedProduct.title}</h2><p className="mt-1 text-sm text-stone-500">Ο παραγωγός θα απαντήσει στη διαθεσιμότητα.</p></div><button type="button" onClick={() => setSelectedProduct(null)} className="text-sm text-stone-500 hover:text-stone-900">Κλείσιμο</button></div>
            <label className="mb-4 block text-sm font-medium text-stone-700">Ποσότητα ({selectedProduct.unit})<input type="number" min="0.01" step="any" max={selectedProduct.quantity} required value={requestedQuantity} onChange={(event) => setRequestedQuantity(event.target.value)} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2" /></label>
            <label className="mb-5 block text-sm font-medium text-stone-700">Μήνυμα για τον παραγωγό (προαιρετικό)<textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} rows={3} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2" /></label>
            <button type="submit" disabled={submitting} className="w-full rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-emerald-400">{submitting ? 'Αποστολή...' : 'Στείλε αίτημα'}</button>
          </form>
        </div>
      )}
    </main>
  );
}
