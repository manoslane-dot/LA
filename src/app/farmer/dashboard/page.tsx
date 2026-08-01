'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, CircleDollarSign, ClipboardList, House, LayoutDashboard, Leaf, LogOut, Mail, Menu, Package, Pencil, Phone, Plus, Settings, ShoppingBag, Trash2, User, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatGreekPhoneInput } from '@/lib/auth/contactInfo';
import { sanitizePhoneForTel } from '@/lib/serviceAreas';
import {
  clearLoginPreference,
  ensureLoginPreferenceInitialized,
  shouldLogoutOnAppClose,
} from '@/lib/auth/sessionPersistence';
import { getDashboardForRole, normalizeUserRole } from '@/lib/auth/roleRouting';
import { validateUsername } from '@/lib/auth/credentialsPolicy';
import {
  addNotification,
  getNotificationStorageKey,
  getUnreadNotificationCount,
  loadNotifications,
  markNotificationsRead,
  type NotificationItem,
} from '@/lib/notifications';
import { uploadImageToSupabase } from '@/lib/supabase/images';

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
  farmer_id: string;
  buyer_id: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  requested_quantity: number;
  message: string | null;
  status: 'pending' | 'confirmed' | 'ready' | 'rejected';
  created_at: string;
  unit_at_request: string;
  unit_price_at_request: number;
  profit: number;
  products?: { unit: string; price: number } | { unit: string; price: number }[] | null;
}

const requestStatusLabels: Record<PurchaseRequest['status'], string> = {
  pending: 'Σε αναμονή',
  confirmed: 'Επιβεβαιώθηκε',
  ready: 'Ολοκληρώθηκε',
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
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'requests' | 'profile'>('overview');  // Profile info shown in overview header
  const [profileSubTab, setProfileSubTab] = useState<'profile' | 'dashboard' | 'settings' | 'contacts'>('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [emailConfirmedAt, setEmailConfirmedAt] = useState<string | null>(null);
  const [showEmailVerificationWarning, setShowEmailVerificationWarning] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [selectedProductImage, setSelectedProductImage] = useState<string | null>(null);
  const [showProductImagePreview, setShowProductImagePreview] = useState(false);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [productImagesByProductId, setProductImagesByProductId] = useState<Record<number, Array<{ image_url: string; image_path: string; sort_order: number }>>>({});
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  
  // Προϊόντα προς Πώληση
  const [products, setProducts] = useState<Product[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [updatingRequestId, setUpdatingRequestId] = useState<number | null>(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodQuantity, setProdQuantity] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodUnit, setProdUnit] = useState('κιλό');
  const [submittingProd, setSubmittingProd] = useState(false);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingProductTitle, setEditingProductTitle] = useState('');
  const [editingProductQuantity, setEditingProductQuantity] = useState('');
  const [editingProductPrice, setEditingProductPrice] = useState('');
  const [editingProductUnit, setEditingProductUnit] = useState('κιλό');
  const [editingProductStatus, setEditingProductStatus] = useState('🟢 Ενεργό / Δημοσιευμένο');
  const [editingProductImages, setEditingProductImages] = useState<File[]>([]);
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [priceDraft, setPriceDraft] = useState('');
  const [updatingPrice, setUpdatingPrice] = useState(false);
  
  // Chat messaging for confirmed requests
  const [chatRequestId, setChatRequestId] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  
  // Confirmation dialog for request confirmation
  const [confirmingRequestId, setConfirmingRequestId] = useState<number | null>(null);

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

  useEffect(() => {
    if (!userId) {
      return;
    }

    const storageKey = getNotificationStorageKey(userId);
    const storedNotifications = loadNotifications(storageKey);
    setNotifications(storedNotifications);
    setNotificationCount(getUnreadNotificationCount(storedNotifications));

    const handleNotificationStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        const nextNotifications = loadNotifications(storageKey);
        setNotifications(nextNotifications);
        setNotificationCount(getUnreadNotificationCount(nextNotifications));
      }
    };

    window.addEventListener('storage', handleNotificationStorage);
    return () => window.removeEventListener('storage', handleNotificationStorage);
  }, [userId]);

  const fetchProductImages = useCallback(async (productIds: number[]) => {
    if (productIds.length === 0) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('product_id, image_url, image_path, sort_order')
        .in('product_id', productIds)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Σφάλμα φόρτωσης εικόνων προϊόντων:', error.message);
        return;
      }

      const mappedImages: Record<number, Array<{ image_url: string; image_path: string; sort_order: number }>> = {};
      for (const image of (data ?? []) as Array<{ product_id: number; image_url: string; image_path: string; sort_order: number }>) {
        const productId = Number(image.product_id);
        if (!Number.isFinite(productId)) continue;
        if (!mappedImages[productId]) {
          mappedImages[productId] = [];
        }
        mappedImages[productId].push(image);
      }

      setProductImagesByProductId((prev) => ({ ...prev, ...mappedImages }));
    } catch (err) {
      console.warn('Exception loading product images:', err);
    }
  }, [supabase]);

  const fetchProducts = useCallback(async (farmerId: string) => {
    const { data, error } = await supabase.from('products').select('*').eq('farmer_id', farmerId);
    if (error) {
      console.error('Error fetching products:', error.message);
    } else if (data) {
      const nextProducts = data as Product[];
      setProducts(nextProducts);
      void fetchProductImages(nextProducts.map((product) => product.id));
    }
  }, [fetchProductImages, supabase]);

  const fetchRequests = useCallback(async (farmerId: string) => {
    const { data, error } = await supabase
      .from('purchase_requests')
      .select('id, product_id, product_title, farmer_id, buyer_id, buyer_email, buyer_phone, requested_quantity, message, status, created_at, unit_at_request, unit_price_at_request, profit')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase requests:', error.message);
      return [] as PurchaseRequest[];
    }

    if (data) {
      const requestsData = data as unknown as PurchaseRequest[];
      setRequests(requestsData);
      return requestsData;
    }

    return [] as PurchaseRequest[];
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
      
      const metadata = session.user.user_metadata as Record<string, unknown> | undefined;
      const resolvedUsername = typeof metadata?.username === 'string' ? metadata.username.trim() : '';
      const resolvedFullName = typeof metadata?.full_name === 'string' ? metadata.full_name.trim() : '';

      setUserName(resolvedUsername || resolvedFullName || session.user.email || 'Παραγωγός');
      setUserEmail(session.user.email ?? 'Πωλητής');
      setUserId(session.user.id);
      setEmailConfirmedAt(session.user.email_confirmed_at ?? null);
      
      // Fetch farmer profile for phone and revenue
      const { data: profileData } = await supabase
        .from('farmer_profiles')
        .select('contact_phone, total_revenue, avatar_url')
        .eq('user_id', session.user.id)
        .maybeSingle();
      
      if (profileData?.contact_phone) {
        setUserPhone(profileData.contact_phone);
      }
      if (profileData?.avatar_url) {
        setAvatarUrl(profileData.avatar_url);
      }
      if (profileData?.total_revenue !== undefined && profileData?.total_revenue !== null) {
        setTotalRevenue(profileData.total_revenue);
      }
      
      const requestsData = await fetchRequests(session.user.id);
      const derivedTotalRevenue = requestsData.reduce((sum, request) => {
        if (request.status === 'ready' && typeof request.profit === 'number') {
          return sum + request.profit;
        }
        return sum;
      }, 0);

      const resolvedTotalRevenue = derivedTotalRevenue > 0
        ? derivedTotalRevenue
        : (profileData?.total_revenue ?? 0);

      setTotalRevenue(resolvedTotalRevenue);
      await fetchProducts(session.user.id);
      setLoading(false);
    };

    void checkUserAndFetchData();
  }, [router, supabase, fetchProducts, fetchRequests]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    setUploadingAvatar(true);

    try {
      const { publicUrl } = await uploadImageToSupabase(supabase, 'avatars', userId, file);
      const { error } = await supabase.from('farmer_profiles').upsert({
        user_id: userId,
        avatar_url: publicUrl,
      });

      if (error) throw error;

      setAvatarUrl(publicUrl);
    } catch (err) {
      console.error('Σφάλμα upload avatar:', err);
      alert('Δεν ήταν δυνατή η αποστολή της φωτογραφίας.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const resetEditProductState = useCallback(() => {
    setEditingProductId(null);
    setEditingProductTitle('');
    setEditingProductQuantity('');
    setEditingProductPrice('');
    setEditingProductUnit('κιλό');
    setEditingProductStatus('🟢 Ενεργό / Δημοσιευμένο');
    setEditingProductImages([]);
  }, []);

  const handleStartEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setEditingProductTitle(product.title);
    setEditingProductQuantity(String(product.quantity));
    setEditingProductPrice(String(product.price));
    setEditingProductUnit(product.unit || 'κιλό');
    setEditingProductStatus(product.status || '🟢 Ενεργό / Δημοσιευμένο');
    setEditingProductImages([]);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId || !userId) return;
    if (!editingProductTitle.trim() || !editingProductQuantity || !editingProductPrice) return;

    setUpdatingProduct(true);

    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          title: editingProductTitle.trim(),
          quantity: parseFloat(editingProductQuantity),
          price: parseFloat(editingProductPrice),
          unit: editingProductUnit,
          status: editingProductStatus,
        })
        .eq('id', editingProductId)
        .eq('farmer_id', userId);

      if (updateError) throw updateError;

      if (editingProductImages.length > 0) {
        const { error: deleteError } = await supabase
          .from('product_images')
          .delete()
          .eq('product_id', editingProductId);

        if (deleteError) throw deleteError;

        const imageRows = [] as Array<{ product_id: number; image_url: string; image_path: string; sort_order: number }>;
        for (const [index, file] of editingProductImages.entries()) {
          const { publicUrl, path } = await uploadImageToSupabase(supabase, 'product-images', userId, file);
          imageRows.push({
            product_id: editingProductId,
            image_url: publicUrl,
            image_path: path,
            sort_order: index,
          });
        }

        const { error: imageError } = await supabase.from('product_images').insert(imageRows);
        if (imageError) throw imageError;
      }

      resetEditProductState();
      await fetchProducts(userId);
    } catch (err) {
      console.error('Σφάλμα ενημέρωσης προϊόντος:', err);
      alert('Σφάλμα: ' + (err as Error).message);
    } finally {
      setUpdatingProduct(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle || !prodQuantity || !prodPrice || !userId) return;

    if (!emailConfirmedAt) {
      setShowEmailVerificationWarning(true);
      return;
    }

    setSubmittingProd(true);

    try {
      const { data: insertedProduct, error: insertError } = await supabase
        .from('products')
        .insert([
          {
            title: prodTitle,
            quantity: parseFloat(prodQuantity),
            price: parseFloat(prodPrice),
            unit: prodUnit,
            status: '🟢 Ενεργό / Δημοσιευμένο',
            farmer_id: userId,
          },
        ])
        .select('id')
        .single();

      if (insertError) throw insertError;

      if (insertedProduct?.id && productImages.length > 0) {
        const imageRows = [] as Array<{ product_id: number; image_url: string; image_path: string; sort_order: number }>;

        for (const [index, file] of productImages.entries()) {
          const { publicUrl, path } = await uploadImageToSupabase(supabase, 'product-images', userId, file);
          imageRows.push({
            product_id: insertedProduct.id,
            image_url: publicUrl,
            image_path: path,
            sort_order: index,
          });
        }

        const { error: imageError } = await supabase.from('product_images').insert(imageRows);
        if (imageError) throw imageError;
      }

      setProdTitle('');
      setProdQuantity('');
      setProdPrice('');
      setProductImages([]);
      setShowNewProductForm(false);
      await fetchProducts(userId);
    } catch (err) {
      console.error('Σφάλμα δημιουργίας προϊόντος:', err);
      alert('Σφάλμα: ' + (err as Error).message);
    } finally {
      setSubmittingProd(false);
    }
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
    
    // Find the request to get product_id and quantities
    const request = requests.find(r => r.id === requestId);
    if (!request) {
      alert('Αίτημα δεν βρέθηκε');
      setUpdatingRequestId(null);
      return;
    }

    try {
      // Update status
      const { error } = await supabase
        .from('purchase_requests')
        .update({ status })
        .eq('id', requestId)
        .eq('farmer_id', userId);

      if (error) {
        alert(`Σφάλμα ενημέρωσης αιτήματος: ${error.message}`);
        setUpdatingRequestId(null);
        return;
      }

      if (status !== 'pending') {
        const statusLabel = status === 'confirmed' ? 'Επιβεβαιώθηκε' : status === 'ready' ? 'Ολοκληρώθηκε' : 'Απορρίφθηκε';
        const notificationMessage = status === 'confirmed'
          ? `Η παραγγελία σας για ${request.product_title} επιβεβαιώθηκε.`
          : status === 'ready'
            ? `Η παραγγελία σας για ${request.product_title} ολοκληρώθηκε.`
            : `Η παραγγελία σας για ${request.product_title} απορρίφθηκε.`;

        const nextNotifications = addNotification(getNotificationStorageKey(request.buyer_id), {
          title: `Ενημέρωση παραγγελίας: ${statusLabel}`,
          status: statusLabel,
          message: `Κατάσταση παραγγελίας: ${statusLabel}`,
        });
        setNotifications(nextNotifications);
        setNotificationCount(getUnreadNotificationCount(nextNotifications));
      }

      // When changing status to 'ready', calculate profit and decrease product quantity
      if (status === 'ready') {
        const profit = request.requested_quantity * request.unit_price_at_request;
        
        // Update purchase_request with profit
        const { error: updateError } = await supabase
          .from('purchase_requests')
          .update({ profit })
          .eq('id', requestId)
          .eq('farmer_id', userId);

        if (updateError) {
          console.error('Σφάλμα αποθήκευσης κέρδους:', updateError.message);
        }

        // Decrease product quantity
        if (request.product_id) {
          const { error: quantityError } = await supabase
            .rpc('decrease_product_quantity', {
              product_id_param: request.product_id,
              quantity_to_decrease: request.requested_quantity,
            });

          if (quantityError) {
            console.error('Σφάλμα μείωσης ποσότητας:', quantityError.message);
          }
        }

        // Add profit to farmer's total revenue
        const newRevenue = totalRevenue + profit;
        const { error: revenueError } = await supabase
          .from('farmer_profiles')
          .update({ total_revenue: newRevenue })
          .eq('user_id', userId);

        if (revenueError) {
          console.error('Σφάλμα ενημέρωσης εισπράξεων:', revenueError.message);
        }
      }

      const updatedRequests = await fetchRequests(userId);
      const derivedRevenue = updatedRequests.reduce((sum, currentRequest) => {
        if (currentRequest.status === 'ready' && typeof currentRequest.profit === 'number') {
          return sum + currentRequest.profit;
        }
        return sum;
      }, 0);
      setTotalRevenue(derivedRevenue > 0 ? derivedRevenue : totalRevenue);
    } catch (err) {
      console.error('Exception in handleRequestStatus:', err);
      alert('Σφάλμα κατά την ενημέρωση του αιτήματος');
    }
    
    setUpdatingRequestId(null);
  };

  const handleNotificationSelect = (notification: NotificationItem) => {
    if (userId) {
      const updatedNotifications = markNotificationsRead(getNotificationStorageKey(userId), notifications.map((item) => item.id));
      setNotifications(updatedNotifications);
      setNotificationCount(getUnreadNotificationCount(updatedNotifications));
    }

    setSelectedNotificationId(notification.id);
    setShowNotifications(true);
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

  interface PurchaseRequest {
    id: number;
    product_id: number | null;
    product_title: string;
    farmer_id: string;
    buyer_id: string | null;
    buyer_email: string | null;
    buyer_phone: string | null;
    requested_quantity: number;
    status: 'pending' | 'confirmed' | 'ready' | 'rejected';
    unit_at_request: string;
    unit_price_at_request: number;
    profit: number;
    created_at?: string;
    message?: string | null;
    products?: { unit: string; price: number } | { unit: string; price: number }[] | null;
  }

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
  const markAllNotificationsAsRead = useCallback(() => {
    if (!userId || !notifications.some((item) => !item.read)) {
      return;
    }

    const updatedNotifications = markNotificationsRead(getNotificationStorageKey(userId), notifications.map((item) => item.id));
    setNotifications(updatedNotifications);
    setNotificationCount(getUnreadNotificationCount(updatedNotifications));
  }, [userId, notifications]);

  const closeNotifications = useCallback(() => {
    markAllNotificationsAsRead();
    setShowNotifications(false);
    setSelectedNotificationId(null);
  }, [markAllNotificationsAsRead]);

  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        closeNotifications();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, closeNotifications]);

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
    <div className="h-screen overflow-hidden overflow-x-hidden bg-stone-50 text-stone-900 flex">
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
            <LayoutDashboard className="h-4 w-4" /> Επισκόπηση
          </button>
          <button type="button" onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${activeTab === 'products' ? 'bg-emerald-50 font-semibold text-emerald-800' : 'font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}>
            <Package className="h-4 w-4" /> Προϊόντα
          </button>
          <button type="button" onClick={() => setActiveTab('requests')} className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${activeTab === 'requests' ? 'bg-emerald-50 font-semibold text-emerald-800' : 'font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}>
            <ClipboardList className="h-4 w-4" /> Αιτήματα πελατών
            {requests.filter((r) => r.status === 'pending').length > 0 && (
              <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">{requests.filter((r) => r.status === 'pending').length}</span>
            )}
          </button>
        </nav>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-stone-950/40 sm:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside id="logo-sidebar" className={`fixed inset-0 z-50 bg-white transition-transform duration-200 sm:hidden ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`} aria-label="Sidebar">
        <div className="flex h-full flex-col overflow-y-auto">
          <header className="flex items-center justify-between border-b border-stone-200 px-5 py-5">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-900">AgroDirect</p>
                <p className="text-xs text-stone-500">Χώρος αγρότη</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md p-2 text-stone-600 transition hover:bg-stone-100"
              aria-label="Κλείσιμο κινητού μενού"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-4 border-b border-stone-200 px-5 py-5 text-left"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-emerald-100 text-xl font-bold text-emerald-800">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Φωτογραφία προφίλ" className="h-full w-full object-cover" />
              ) : (
                (userName ?? userEmail ?? 'Α').charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-stone-900">{userName ?? 'Ο λογαριασμός μου'}</p>
              <p className="mt-1 truncate text-sm text-stone-500">{userEmail ?? 'Στοιχεία λογαριασμού'}</p>
            </div>
            <ChevronDown className="h-5 w-5 -rotate-90 text-stone-400" />
          </button>

          <nav className="flex-1 px-4 py-4" aria-label="Κύρια πλοήγηση κινητού">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Λογαριασμός</p>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center rounded-lg px-3 py-3 text-left text-base font-medium transition ${activeTab === 'profile' ? 'bg-emerald-50 text-emerald-800' : 'text-stone-700 hover:bg-stone-100 hover:text-emerald-700'}`}
                >
                  <User className="mr-3 h-5 w-5" />
                  Το Προφίλ μου
                  <ChevronDown className="ml-auto h-5 w-5 -rotate-90 text-stone-400" />
                </button>
              </li>
            </ul>

            <div className="my-4 border-t border-stone-100" />
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Προϊόντα</p>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('overview');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center rounded-lg px-3 py-3 text-left text-base font-medium transition ${activeTab === 'overview' ? 'bg-emerald-50 text-emerald-800' : 'text-stone-700 hover:bg-stone-100 hover:text-emerald-700'}`}
                >
                  <LayoutDashboard className="mr-3 h-5 w-5" />
                  Επισκόπηση
                  <ChevronDown className="ml-auto h-5 w-5 -rotate-90 text-stone-400" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('products');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center rounded-lg px-3 py-3 text-left text-base font-medium transition ${activeTab === 'products' ? 'bg-emerald-50 text-emerald-800' : 'text-stone-700 hover:bg-stone-100 hover:text-emerald-700'}`}
                >
                  <Package className="mr-3 h-5 w-5" />
                  Προϊόντα
                  <ChevronDown className="ml-auto h-5 w-5 -rotate-90 text-stone-400" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('requests');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center rounded-lg px-3 py-3 text-left text-base font-medium transition ${activeTab === 'requests' ? 'bg-emerald-50 text-emerald-800' : 'text-stone-700 hover:bg-stone-100 hover:text-emerald-700'}`}
                >
                  <ClipboardList className="mr-3 h-5 w-5" />
                  Τα αιτήματά μου
                  {requests.filter((r) => r.status === 'pending').length > 0 && (
                    <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      {requests.filter((r) => r.status === 'pending').length}
                    </span>
                  )}
                  <ChevronDown className="ml-auto h-5 w-5 -rotate-90 text-stone-400" />
                </button>
              </li>
            </ul>
          </nav>

          <div className="border-t border-stone-200 p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-base font-medium text-rose-700 transition hover:bg-rose-50"
            >
              <LogOut className="h-5 w-5" /> Αποσύνδεση
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-stone-200 h-16 flex items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 lg:hidden"><Leaf className="h-5 w-5 text-emerald-700" /><span className="font-bold text-emerald-900">AgroDirect</span></Link>
          <p className="hidden lg:block text-sm text-stone-500">Πίνακας ελέγχου αγρότη</p>
          <div className="flex items-center gap-2">
            <button
              data-drawer-target="logo-sidebar"
              data-drawer-toggle="logo-sidebar"
              aria-controls="logo-sidebar"
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex items-center rounded-md border border-stone-300 bg-transparent p-2 text-stone-700 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 sm:hidden"
              aria-label="Άνοιγμα κινητού μενού"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M5 7h14M5 12h14M5 17h10" />
              </svg>
            </button>
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => {
                  if (showNotifications) {
                    closeNotifications();
                  } else {
                    setShowNotifications(true);
                  }
                }}
                className="relative inline-flex items-center text-sm font-medium text-center text-stone-700 hover:text-stone-900 focus:outline-none"
              >
                <svg className="h-6 w-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5.365V3m0 2.365a5.338 5.338 0 0 1 5.133 5.368v1.8c0 2.386 1.867 2.982 1.867 4.175 0 .593 0 1.292-.538 1.292H5.538C5 18 5 17.301 5 16.708c0-1.193 1.867-1.789 1.867-4.175v-1.8A5.338 5.338 0 0 1 12 5.365ZM8.733 18c.094.852.306 1.54.944 2.112a3.48 3.48 0 0 0 4.646 0c.638-.572 1.236-1.26 1.33-2.112h-6.92Z" />
                </svg>
                {notificationCount > 0 && (
                  <div className="absolute top-0 start-3 block h-3 w-3 rounded-full border-2 border-white bg-rose-500" />
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-12 z-20 w-[90vw] max-w-[32rem] rounded-xl border border-stone-200 bg-white shadow-xl">
                  <div className="rounded-t-xl bg-stone-100 px-4 py-3 text-center text-sm font-medium text-stone-700">
                    Ειδοποιήσεις
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-stone-500">Δεν υπάρχουν ειδοποιήσεις ακόμη.</div>
                  ) : (
                    <div className="max-h-[32rem] divide-y divide-stone-100 overflow-y-auto">
                      {notifications.map((notification) => {
                        const isSelected = selectedNotificationId === notification.id;
                        const isCompleted = notification.status === 'Επιβεβαιώθηκε' || notification.status === 'Ολοκληρώθηκε';
                        const isRejected = notification.status === 'Δεν είναι διαθέσιμο' || notification.status === 'Απορρίφθηκε';
                        const iconColor = isRejected
                          ? 'bg-rose-100 text-rose-700'
                          : isCompleted
                            ? 'bg-emerald-100 text-emerald-700'
                            : notification.read
                              ? 'bg-stone-100 text-stone-600'
                              : 'bg-amber-100 text-amber-700';
                        return (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => handleNotificationSelect(notification)}
                            className={`flex w-full items-start px-4 py-4 text-left transition-colors ${isSelected ? 'bg-stone-50' : notification.read ? 'bg-white hover:bg-stone-50' : 'bg-amber-50 hover:bg-amber-100'}`}
                          >
                            <div className="shrink-0">
                              <div className={`flex h-11 w-11 items-center justify-center rounded-full ${iconColor}`}>
                                <Bell className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="w-full ps-3">
                              <div className="mb-1.5 text-sm text-stone-700">
                                <span className="font-semibold text-stone-900">{notification.title}</span>
                                <div className="mt-1 text-xs text-stone-500">{notification.status}</div>
                              </div>
                              <div className="text-sm leading-6 text-stone-600 break-words whitespace-pre-wrap">{notification.message}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {selectedNotificationId && (
                    <div className="border-t border-stone-200 bg-stone-50 px-4 py-4">
                      {(() => {
                        const selected = notifications.find((item) => item.id === selectedNotificationId);
                        if (!selected) return null;
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">Μήνυμα ειδοποίησης</p>
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{selected.status}</span>
                            </div>
                            <p className="text-sm leading-7 text-stone-700 break-words whitespace-pre-wrap">{selected.message}</p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
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
        <main className="mx-auto w-full max-w-7xl flex-1 overflow-y-auto overflow-x-hidden space-y-8 p-4 pb-24 sm:p-8 sm:pb-8">
          <section id="overview" className={`hidden border-b border-stone-200 pb-2 flex-col gap-2 sm:flex sm:flex-row sm:items-end sm:justify-between${activeTab !== 'overview' ? ' hidden' : ''}`}>
            <div>
              {activeTab === 'overview' && (
                <h2 className="text-3xl font-bold text-stone-900">Επισκόπηση</h2>
              )}
            </div>
          </section>

          <section className={`space-y-4${activeTab !== 'overview' ? ' hidden' : ''}`} aria-label="Επισκόπηση">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" aria-label="Στατιστικά προϊόντων">
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
                <div className="flex justify-between"><div><p className="text-sm font-medium text-stone-500">Εκτιμώμενο κέρδος</p><p className="mt-2 text-2xl font-bold">{formatCurrency(estimatedOpenRequestsRevenue)}</p></div><CircleDollarSign className="h-5 w-5 text-emerald-700" /></div>
              </article>
              <article className="border border-stone-200 bg-white p-5 lg:col-span-1">
                <div className="flex justify-between"><div><p className="text-sm font-medium text-stone-500">Συνολικές εισπράξεις</p><p className="mt-2 text-2xl font-bold">{formatCurrency(totalRevenue)}</p></div><CircleDollarSign className="h-5 w-5 text-green-600" /></div>
              </article>
            </div>
          </section>
          
          {activeTab === 'products' && (
            <section className="sm:hidden">
              <div className="mb-4 overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#1f6b3d_0%,#2d8c4a_55%,#1f6b3d_100%)] px-5 py-5 text-white shadow-[0_18px_36px_rgba(31,107,61,0.2)]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/80">AgroDirect Farmer</p>
                <h2 className="mt-2 text-2xl font-bold leading-tight">Τα προϊόντα μου</h2>
                <p className="mt-2 text-sm leading-6 text-white/90">Διαχειρίσου τα προϊόντα σου, ενημέρωσε τιμές και επιβεβαίωσε αιτήματα εύκολα από το κινητό.</p>
              </div>
            </section>
          )}

          {/* Grid για Προϊόντα Προς Πώληση */}
          <div className={`grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2${activeTab !== 'products' ? ' hidden' : ''}`}>
            {showNewProductForm && activeTab === 'products' && (
              <div id="new-product" className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Εικόνες προϊόντος (μέχρι 2)</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []).slice(0, 2);
                      setProductImages(files);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {productImages.length > 0 && (
                    <p className="mt-2 text-xs text-stone-500">Επιλεγμένες εικόνες: {productImages.length}</p>
                  )}
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
            )}

            <div id="products" className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-bold text-stone-900"><Package className="h-5 w-5 text-emerald-700" />Τα προϊόντα μου</h3>
                  <p className="mt-1 text-sm text-stone-500">{products.length} καταχωρήσεις προς πώληση</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewProductForm((prev) => !prev)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-3 text-sm font-semibold transition-colors"
                >
                  <Plus className="h-4 w-4" />Νέο προϊόν
                </button>
              </div>
              {products.length === 0 ? (
                <p className="text-gray-500 text-sm">Δεν έχετε καταχωρήσει προϊόντα προς πώληση.</p>
              ) : (
                <div className="space-y-4">
                  {products.map((prod) => {
                    const productImages = productImagesByProductId[prod.id] ?? [];
                    return (
                      <div key={prod.id} className="rounded-[22px] border border-stone-200 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 flex flex-col items-start">
                            {productImages.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProductImage(productImages[0].image_url);
                                  setShowProductImagePreview(true);
                                }}
                                className="mb-3 aspect-[1.08/1] w-full overflow-hidden self-start rounded-[16px] border border-stone-200 bg-stone-50"
                                aria-label={`Προεπισκόπηση εικόνας για ${prod.title}`}
                              >
                                <img src={productImages[0].image_url} alt={prod.title} className="h-full w-full object-cover" loading="lazy" />
                              </button>
                            )}
                            <p className="min-h-[56px] text-left text-lg font-semibold leading-7 text-gray-800">{prod.title}</p>
                            <p className="text-left text-sm text-gray-600">Ποσότητα: {prod.quantity} {getUnitLabel(prod.unit, prod.quantity)}</p>
                            <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:hidden">
                              {prod.status}
                            </span>
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
                            <p className="mt-1 text-left text-base font-semibold text-emerald-700">Τιμή: {prod.price.toFixed(2)} €</p>
                          )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2 self-start">
                            <span className="hidden sm:inline px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-full">
                              {prod.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStartEditProduct(prod)}
                              className="rounded-md p-2 text-stone-400 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                              title="Επεξεργασία προϊόντος"
                              aria-label={`Επεξεργασία προϊόντος ${prod.title}`}
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {editingProductId !== null && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/60 p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="edit-product-title">
              <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 id="edit-product-title" className="text-lg font-bold text-stone-900">Επεξεργασία προϊόντος</h3>
                    <p className="mt-1 text-sm text-stone-500">Άλλαξε όλα τα πεδία του προϊόντος και αποθήκευσε τις αλλαγές.</p>
                  </div>
                  <button
                    type="button"
                    onClick={resetEditProductState}
                    className="rounded-md p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                    aria-label="Κλείσιμο επεξεργασίας προϊόντος"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateProduct} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-gray-700">Τίτλος προϊόντος</label>
                      <input
                        type="text"
                        required
                        value={editingProductTitle}
                        onChange={(e) => setEditingProductTitle(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Ποσότητα</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={editingProductQuantity}
                        onChange={(e) => setEditingProductQuantity(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Μονάδα</label>
                      <select
                        value={editingProductUnit}
                        onChange={(e) => setEditingProductUnit(e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="κιλό">Κιλό</option>
                        <option value="τεμάχιο">Τεμάχιο(α)</option>
                        <option value="λίτρο">Λίτρο(α)</option>
                        <option value="γραμμάριο">Γραμμάριο(α)</option>
                        <option value="ματσάκι">Ματσάκι</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Τιμή (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editingProductPrice}
                        onChange={(e) => setEditingProductPrice(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Κατάσταση</label>
                      <select
                        value={editingProductStatus}
                        onChange={(e) => setEditingProductStatus(e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="🟢 Ενεργό / Δημοσιευμένο">🟢 Ενεργό / Δημοσιευμένο</option>
                        <option value="🟡 Μερικώς διαθέσιμο">🟡 Μερικώς διαθέσιμο</option>
                        <option value="🔴 Εκτός αποθέματος">🔴 Εκτός αποθέματος</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-gray-700">Νέες εικόνες προϊόντος (προαιρετικά)</label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []).slice(0, 2);
                          setEditingProductImages(files);
                        }}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                      {editingProductImages.length > 0 && (
                        <p className="mt-2 text-xs text-stone-500">Επιλεγμένες νέες εικόνες: {editingProductImages.length}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={resetEditProductState}
                      className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
                    >
                      Ακύρωση
                    </button>
                    <button
                      type="submit"
                      disabled={updatingProduct}
                      className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-400"
                    >
                      {updatingProduct ? 'Αποθήκευση...' : 'Αποθήκευση αλλαγών'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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
                              {request.status === 'confirmed' && (
                                <div className="mt-2 rounded-md border border-stone-200 bg-stone-50 p-2.5 w-full">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Στοιχεία επικοινωνίας</p>
                                  <div className="mt-1 space-y-1 text-sm text-stone-600">
                                    <p><span className="font-medium text-stone-800">Email:</span> {request.buyer_email || 'Δεν έχει καταχωρημένο email'}</p>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p><span className="font-medium text-stone-800">Τηλέφωνο:</span> {request.buyer_phone || 'Δεν έχει καταχωρημένο τηλέφωνο'}</p>
                                      {request.buyer_phone && (
                                        <a
                                          href={`tel:${request.buyer_phone}`}
                                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                                        >
                                          <Phone className="h-3.5 w-3.5" /> Κλήση
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                              {request.status === 'ready' && (
                                <div className="mt-2 rounded-md bg-emerald-50 border border-emerald-200 p-2 w-full">
                                  <p className="text-xs font-semibold text-emerald-700">Συνολικό κέρδος:</p>
                                  <p className="text-sm font-bold text-emerald-800">{formatCurrency(request.profit || (request.requested_quantity * request.unit_price_at_request))}</p>
                                </div>
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
                        {request.status === 'confirmed' && <button type="button" disabled={updatingRequestId === request.id} onClick={() => void handleRequestStatus(request.id, 'ready')} className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-sky-400">Ολοκληρώθηκε</button>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="profile" className={`rounded-lg border border-stone-200 bg-white shadow-sm${activeTab !== 'profile' ? ' hidden' : ''}`}>
            <div className="border-b border-stone-200 px-4 py-3 sm:px-6">
              <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-stone-600">
                {[
                  { key: 'profile', label: 'Προφίλ', icon: User },
                  { key: 'dashboard', label: 'Πίνακας', icon: LayoutDashboard },
                  { key: 'settings', label: 'Ρυθμίσεις', icon: Settings },
                  { key: 'contacts', label: 'Επικοινωνία', icon: Phone },
                ].map(({ key, label, icon: Icon }) => {
                  const isActive = profileSubTab === key;
                  return (
                    <li key={key} className="me-2">
                      <button
                        type="button"
                        onClick={() => setProfileSubTab(key as 'profile' | 'dashboard' | 'settings' | 'contacts')}
                        className={`inline-flex items-center justify-center rounded-t-lg border-b-2 px-4 py-3 transition-colors ${isActive ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:border-emerald-200 hover:text-emerald-700'}`}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="p-6">
              {profileSubTab === 'profile' && (
                <>
                  <h2 className="mb-5 text-xl font-semibold text-stone-800">Το Προφίλ μου</h2>
                  {!editingProfile ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-stone-300 bg-white">
                          {avatarUrl ? (
                            <button
                              type="button"
                              onClick={() => setShowAvatarPreview(true)}
                              className="h-full w-full"
                              aria-label="Προεπισκόπηση φωτογραφίας προφίλ"
                            >
                              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                            </button>
                          ) : (
                            <span className="text-lg font-semibold text-stone-700">
                              {(userName ?? userEmail ?? 'F').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <label className="cursor-pointer rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-700">
                          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarUpload} />
                          {uploadingAvatar ? 'Αποστολή...' : 'Αλλαγή φωτογραφίας'}
                        </label>
                      </div>
                      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                        <p className="mb-1 text-xs font-semibold text-stone-600">Ονοματεπώνυμο</p>
                        <p className="text-base text-stone-900">{userName || 'Επανόθηση απαιτείται'}</p>
                      </div>
                      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                        <p className="mb-1 text-xs font-semibold text-stone-600">Email</p>
                        <p className="text-base text-stone-900">{userEmail || 'Επανόθηση απαιτείται'}</p>
                      </div>
                      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                        <p className="mb-1 text-xs font-semibold text-stone-600">Κινητό τηλέφωνο</p>
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

                        if (!error && userId) {
                          await supabase.from('farmer_profiles').upsert({
                            user_id: userId,
                            contact_phone: profileForm.phone.trim(),
                          });
                        }

                        if (error) {
                          alert('Σφάλμα αποθήκευσης: ' + error.message);
                        } else {
                          setUserName(trimmedFullName);
                          setUserPhone(profileForm.phone.trim());
                          setEditingProfile(false);
                        }
                        setSavingProfile(false);
                      }}
                      className="space-y-4"
                    >
                      <label className="block text-sm font-semibold text-stone-700">
                        <span className="mb-1.5 inline-flex items-center gap-2">
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
                        <span className="mb-1.5 inline-flex items-center gap-2">
                          <Mail className="h-4 w-4 text-emerald-700" /> Email
                        </span>
                        <input
                          type="email"
                          disabled
                          value={profileForm.email}
                          className="w-full cursor-not-allowed rounded-lg border border-stone-300 bg-stone-100 px-3 py-2.5 text-sm text-stone-600"
                        />
                        <p className="mt-1 text-xs text-stone-500">Το email δεν μπορεί να αλλάξει</p>
                      </label>
                      <label className="block text-sm font-semibold text-stone-700">
                        <span className="mb-1.5 inline-flex items-center gap-2">
                          <Phone className="h-4 w-4 text-emerald-700" /> Κινητό τηλέφωνο
                        </span>
                        <input
                          type="tel"
                          required
                          value={profileForm.phone}
                          onChange={(e) => {
                            setProfileForm({ ...profileForm, phone: formatGreekPhoneInput(e.target.value) });
                          }}
                          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
                </>
              )}

              {profileSubTab === 'dashboard' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Στοιχεία αγρότη</p>
                    <p className="mt-3 text-lg font-semibold text-stone-900">{userName || 'Αγρότης'}</p>
                    <p className="mt-1 text-sm text-stone-600">{userEmail || 'Δεν έχει καταχωρημένο email'}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Συνολικές εισπράξεις</p>
                    <p className="mt-3 text-2xl font-bold text-emerald-900">{formatCurrency(totalRevenue)}</p>
                    <p className="mt-1 text-sm text-emerald-700">Σύνολο από ολοκληρωμένες παραγγελίες</p>
                  </div>
                </div>
              )}

              {profileSubTab === 'settings' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Κατάσταση λογαριασμού</p>
                    <p className="mt-2 text-sm text-stone-700">
                      {emailConfirmedAt ? 'Το email έχει επιβεβαιωθεί.' : 'Η επιβεβαίωση email είναι ακόμη εκκρεμής.'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-4">
                    <p className="text-sm font-semibold text-stone-900">Επεξεργασία στοιχείων</p>
                    <p className="mt-2 text-sm text-stone-600">Από την καρτέλα “Προφίλ” μπορείτε να ενημερώσετε το όνομα και το κινητό σας.</p>
                  </div>
                </div>
              )}

              {profileSubTab === 'contacts' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-stone-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Email</p>
                    <p className="mt-2 text-sm font-semibold text-stone-900">{userEmail || 'Δεν έχει καταχωρημένο email'}</p>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Τηλέφωνο</p>
                    <p className="mt-2 text-sm font-semibold text-stone-900">{userPhone || 'Δεν έχει καταχωρημένο τηλέφωνο'}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white sm:hidden" aria-label="Κάτω πλοήγηση παραγωγού">
        <div className="grid h-16 grid-cols-4">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-medium ${activeTab === 'overview' ? 'text-emerald-700' : 'text-stone-500'}`}
          >
            <House className="h-5 w-5" />
            Αρχική
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-medium ${activeTab === 'products' ? 'text-emerald-700' : 'text-stone-500'}`}
          >
            <Package className="h-5 w-5" />
            Προϊόντα
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-medium ${activeTab === 'requests' ? 'text-emerald-700' : 'text-stone-500'}`}
          >
            <ClipboardList className="h-5 w-5" />
            Αιτήματα
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-medium ${activeTab === 'profile' ? 'text-emerald-700' : 'text-stone-500'}`}
          >
            <User className="h-5 w-5" />
            Προφίλ
          </button>
        </div>
      </nav>

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
                      Συνεννόηση για το αίτημα
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
                    const chatRequest = requests.find((request) => request.id === chatRequestId);
                    if (chatRequest?.buyer_id) {
                      const nextNotifications = addNotification(getNotificationStorageKey(chatRequest.buyer_id), {
                        title: 'Νέο μήνυμα από τον παραγωγό',
                        status: 'Μήνυμα παραγωγού',
                        message: 'Κατάσταση παραγγελίας: Μήνυμα παραγωγού',
                      });
                      setNotifications(nextNotifications);
                      setNotificationCount(getUnreadNotificationCount(nextNotifications));
                    }
                    const nextCount = readNotificationCount() + 1;
                    syncNotificationCount(nextCount);
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

      {showProductImagePreview && selectedProductImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowProductImagePreview(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] rounded-2xl bg-white p-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowProductImagePreview(false)}
              className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-stone-700 shadow-sm transition hover:bg-white"
              aria-label="Κλείσιμο προεπισκόπησης προϊόντος"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={selectedProductImage} alt="Προεπισκόπηση προϊόντος" className="max-h-[80vh] max-w-full rounded-xl object-contain" />
          </div>
        </div>
      )}

      {showAvatarPreview && avatarUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowAvatarPreview(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] rounded-2xl bg-white p-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowAvatarPreview(false)}
              className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-stone-700 shadow-sm transition hover:bg-white"
              aria-label="Κλείσιμο προεπισκόπησης"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={avatarUrl} alt="Προεπισκόπηση φωτογραφίας προφίλ" className="max-h-[80vh] max-w-full rounded-xl object-contain" />
          </div>
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
