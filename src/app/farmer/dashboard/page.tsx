'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
}

export default function FarmerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Καλλιέργειες
  const [crops, setCrops] = useState<Crop[]>([]);
  const [cropName, setCropName] = useState('');
  const [cropArea, setCropArea] = useState('');
  const [submittingCrop, setSubmittingCrop] = useState(false);

  // Προϊόντα προς Πώληση
  const [products, setProducts] = useState<Product[]>([]);
  const [prodTitle, setProdTitle] = useState('');
  const [prodQuantity, setProdQuantity] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodUnit, setProdUnit] = useState('κιλό');
  const [submittingProd, setSubmittingProd] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth');
      } else {
        setUserEmail(session.user.email ?? 'Πωλητής');
        fetchCrops();
        fetchProducts();
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const fetchCrops = async () => {
    const { data } = await supabase.from('crops').select('*');
    if (data) setCrops(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*');
    if (data) setProducts(data);
  };

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
      fetchCrops();
    }
    setSubmittingCrop(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle || !prodQuantity || !prodPrice) return;

    setSubmittingProd(true);
    const { error } = await supabase.from('products').insert([
      { 
        title: prodTitle, 
        quantity: parseFloat(prodQuantity), 
        price: parseFloat(prodPrice), 
        unit: prodUnit,
        status: '🟢 Ενεργό / Δημοσιευμένο'
      }
    ]);

    if (!error) {
      setProdTitle('');
      setProdQuantity('');
      setProdPrice('');
      fetchProducts();
    } else {
      alert('Σφάλμα: ' + error.message);
    }
    setSubmittingProd(false);
  };

  // Νέα συνάρτηση διαγραφής προϊόντος
  const handleDeleteProduct = async (id: number) => {
    const confirmDelete = window.confirm('Είστε σίγουρος ότι θέλετε να διαγράψετε αυτό το προϊόν;');
    if (!confirmDelete) return;

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (!error) {
      fetchProducts(); // Ανανέωση της λίστας
    } else {
      alert('Σφάλμα διαγραφής: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Φόρτωση πίνακα ελέγχου...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md hidden md:block">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-green-700">AgroApp</h1>
          <p className="text-xs text-gray-500 mt-1">Πίνακας Πωλητή / Αγρότη</p>
        </div>
        <nav className="mt-6">
          <a href="#" className="flex items-center px-6 py-3 text-gray-700 bg-gray-200 font-medium">
            🏠 Διαχείριση & Προϊόντα
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8">
          <h2 className="text-xl font-semibold text-gray-800">Καλωσήρθες, {userEmail}</h2>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Αποσύνδεση
          </button>
        </header>

        {/* Dashboard Body */}
        <main className="p-8 flex-1 space-y-8">
          
          {/* Grid για Προϊόντα Προς Πώληση */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">🏷️ Καταχώρηση Προϊόντος προς Πώληση</h3>
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
                    <input
                      type="text"
                      value={prodUnit}
                      onChange={(e) => setProdUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="κιλό"
                    />
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                >
                  {submittingProd ? 'Αποθήκευση...' : 'Προσθήκη Προϊόντος'}
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">🛒 Τα Προϊόντα μου προς Πώληση</h3>
              {products.length === 0 ? (
                <p className="text-gray-500 text-sm">Δεν έχετε καταχωρήσει προϊόντα προς πώληση.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {products.map((prod) => (
                    <li key={prod.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{prod.title}</p>
                        <p className="text-xs text-gray-500">Ποσότητα: {prod.quantity} {prod.unit} | Τιμή: {prod.price} €</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                          {prod.status}
                        </span>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors"
                        >
                          🗑️ Διαγραφή
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
