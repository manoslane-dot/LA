'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '~/lib/supabase';

interface Product {
  id: number;
  title: string;
  quantity: number;
  price: number;
  unit: string;
  status: string;
}

export default function ConsumerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    void fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Σφάλμα κατά τη φόρτωση:', error.message);
      } else if (data) {
        setProducts(data as Product[]);
      }
    } catch (err) {
      console.error('Σφάλμα:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOrder = (title: string) => {
    setSuccessMsg(`Επιτυχής παραγγελία για: ${title}! Ο παραγωγός ειδοποιήθηκε.`);
    window.setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-800">🛒 AgroDirect - Καταναλωτής</h1>
            <p className="text-sm text-gray-500">Φρέσκα προϊόντα απευθείας από τους παραγωγούς</p>
          </div>
          <Link href="/" className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium">
            Αρχική
          </Link>
        </div>

        {successMsg && (
          <div className="mb-6 rounded-xl border border-green-400 bg-green-100 px-4 py-3 text-sm font-medium text-green-700">
            {successMsg}
          </div>
        )}

        <h2 className="mb-4 text-lg font-semibold text-gray-800">🍏 Διαθέσιμες Σοδειές Παραγωγών</h2>

        {loading ? (
          <p className="text-sm text-gray-500">Φόρτωση φρέσκων προϊόντων...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-gray-500">Δεν υπάρχουν διαθέσιμα προϊόντα αυτή τη στιγμή.</p>
        ) : (
          products.map((item) => (
            <div key={item.id} className="mb-4 rounded-xl border border-green-200 bg-green-50/30 p-4 shadow-sm">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                <span className="rounded-full bg-green-200 px-2 py-1 text-xs font-medium text-green-800">
                  {item.status}
                </span>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                Τιμή: <strong className="text-green-700">{item.price}€ / {item.unit}</strong> | Διαθέσιμη Ποσότητα: <strong>{item.quantity} {item.unit}</strong>
              </p>
              <button
                onClick={() => handleOrder(item.title)}
                className="w-full rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white transition duration-200 hover:bg-green-700"
              >
                🛍️ Παραγγελία Προϊόντος
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
