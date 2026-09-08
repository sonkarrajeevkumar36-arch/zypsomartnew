import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Package, RotateCcw, Plus, Trash2, Edit3, DollarSign, Store, Phone, Image as ImageIcon, CheckCircle2, AlertTriangle, ShieldCheck, Key } from 'lucide-react';
import { doc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth, getFriendlyErrorMessage } from '../firebase';
import { Order, Product, Category, Language } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  orders: Order[];
  products: Product[];
  categories: Category[];
  isShopClosed: boolean;
  supportNumber: string;
  appLogoUrl: string;
  lang: Language;
  onClose: () => void;
  onRefreshProducts: () => void;
  onShowSuccess: (title: string, msg: string) => void;
  onShowError: (title: string, msg: string) => void;
}

export function AdminModal({
  isOpen,
  orders,
  products,
  categories,
  isShopClosed,
  supportNumber,
  appLogoUrl,
  lang,
  onClose,
  onRefreshProducts,
  onShowSuccess,
  onShowError
}: AdminModalProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'analytics' | 'settings'>('orders');

  // Category creation state
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatIcon, setNewCatIcon] = useState<string>('📦');

  // Product edit/create state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState<{
    name: string;
    price: string;
    unit: string;
    imageUrl: string;
    category: string;
    status: 'Available' | 'Out of Stock' | 'Unavailable';
  }>({
    name: '',
    price: '',
    unit: 'kg',
    imageUrl: '',
    category: '',
    status: 'Available'
  });

  // Settings state
  const [logoInput, setLogoInput] = useState<string>(appLogoUrl || '');
  const [supportInput, setSupportInput] = useState<string>(supportNumber || '8090315246');

  // Operation states
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [adminAuthEmail, setAdminAuthEmail] = useState<string>('sonkarrajeevkumar36@gmail.com');
  const [adminAuthPassword, setAdminAuthPassword] = useState<string>('');
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentAdminEmail = auth.currentUser?.email || '';
  const isDirectStoreAdmin = currentAdminEmail.toLowerCase() === 'sonkarrajeevkumar36@gmail.com';

  const handleAdminDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminAuthEmail || !adminAuthPassword) {
      onShowError('Missing Credentials', 'Please enter admin password.');
      return;
    }
    setIsAdminLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, adminAuthEmail.trim(), adminAuthPassword);
      onShowSuccess('Admin Authenticated', `Successfully signed in as ${adminAuthEmail.trim()}`);
      setAdminAuthPassword('');
    } catch (err: any) {
      console.error('[Admin Direct Auth Error]:', err);
      onShowError('Login Failed', getFriendlyErrorMessage(err));
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    if (updatingOrderId) return; // Prevent double-clicks or concurrent writes
    setUpdatingOrderId(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updatePayload: Record<string, any> = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };

      if (newStatus === 'return_approved') {
        updatePayload.returnApprovedAt = serverTimestamp();
      } else if (newStatus === 'return_rejected') {
        updatePayload.returnRejectedAt = serverTimestamp();
      } else if (newStatus === 'delivered') {
        updatePayload.deliveredAt = serverTimestamp();
      }

      await updateDoc(orderRef, updatePayload);

      let successLabel = newStatus.toUpperCase();
      if (newStatus === 'return_approved') successLabel = 'RETURN APPROVED';
      if (newStatus === 'return_rejected') successLabel = 'RETURN REJECTED';

      onShowSuccess('Status Updated', `Order #${orderId.slice(-6).toUpperCase()} is now ${successLabel}`);
    } catch (err: any) {
      console.error('[Admin Order Update Error]:', err);
      onShowError('Update Failed', getFriendlyErrorMessage(err));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const normName = newCatName.trim().toLowerCase();
    if (categories.some((c) => (c.normalizedName || (c?.name || '').toLowerCase()) === normName)) {
      onShowError('Duplicate Category', 'A category with this name already exists.');
      return;
    }

    try {
      await addDoc(collection(db, 'categories'), {
        name: newCatName.trim(),
        normalizedName: normName,
        icon: newCatIcon || '📦',
        createdAt: serverTimestamp()
      });
      setNewCatName('');
      setNewCatIcon('📦');
      onShowSuccess('Category Added', 'New category created successfully.');
      onRefreshProducts();
    } catch (err: any) {
      onShowError('Failed to Create Category', getFriendlyErrorMessage(err));
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete "${catName}"?`)) return;
    try {
      await deleteDoc(doc(db, 'categories', catId));
      onShowSuccess('Category Deleted', 'Category removed successfully.');
      onRefreshProducts();
    } catch (err: any) {
      onShowError('Delete Failed', getFriendlyErrorMessage(err));
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const current = editingProduct || prodForm;

    if (!current.name || !current.price || !current.category) {
      onShowError('Missing Fields', 'Please fill in product name, price, and category.');
      return;
    }

    try {
      const productPayload = {
        name: current.name.trim(),
        price: Number(current.price),
        unit: current.unit || 'kg',
        imageUrl: current.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
        category: current.category,
        normalizedCategory: current.category.trim().toLowerCase(),
        status: current.status || 'Available',
        updatedAt: serverTimestamp()
      };

      if (editingProduct?.id) {
        await updateDoc(doc(db, 'products', editingProduct.id), productPayload);
        onShowSuccess('Product Updated', 'Product details saved successfully.');
        setEditingProduct(null);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productPayload,
          createdAt: serverTimestamp()
        });
        onShowSuccess('Product Added', 'New item added to grocery inventory.');
      }

      setProdForm({
        name: '',
        price: '',
        unit: 'kg',
        imageUrl: '',
        category: '',
        status: 'Available'
      });
      onRefreshProducts();
    } catch (err: any) {
      onShowError('Failed to Save Product', getFriendlyErrorMessage(err));
    }
  };

  const handleDeleteProduct = async (prodId: string, prodName: string) => {
    if (!confirm(`Delete product "${prodName}"?`)) return;
    try {
      await deleteDoc(doc(db, 'products', prodId));
      onShowSuccess('Product Deleted', 'Item removed from inventory.');
      onRefreshProducts();
    } catch (err: any) {
      onShowError('Delete Failed', getFriendlyErrorMessage(err));
    }
  };

  const handleToggleShopStatus = async () => {
    try {
      await updateDoc(doc(db, 'shopControl', 'status'), {
        isClosed: !isShopClosed,
        updatedAt: serverTimestamp()
      });
      onShowSuccess('Shop Status Changed', isShopClosed ? 'Shop is now OPEN for customer orders.' : 'Shop is now CLOSED for restocking.');
    } catch (err: any) {
      onShowError('Status Update Failed', getFriendlyErrorMessage(err));
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateDoc(doc(db, 'shopControl', 'status'), {
        appLogoUrl: logoInput.trim(),
        supportNumber: supportInput.trim(),
        updatedAt: serverTimestamp()
      });
      onShowSuccess('Settings Saved', 'Logo URL and support number have been updated.');
    } catch (err: any) {
      onShowError('Settings Error', getFriendlyErrorMessage(err));
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-slate-900 flex flex-col text-slate-100"
      >
        {/* Top Navbar */}
        <div className="border-b border-slate-800 bg-slate-950">
          <div className="max-w-6xl mx-auto flex items-center justify-between p-4 sm:p-5">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-green-500" />
                <span>Admin Management</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold">
                Live orders, return requests & grocery inventory
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto flex px-4">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'text-green-400 border-green-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'text-green-400 border-green-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Inventory ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'text-green-400 border-green-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Analytics 📊
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'text-green-400 border-green-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Settings ⚙️
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-28 bg-slate-900 text-slate-100">
          <div className="max-w-6xl mx-auto space-y-6">
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Admin Session Authorization Banner */}
              {!isDirectStoreAdmin ? (
                <div className="bg-amber-950/40 border border-amber-500/40 p-3.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-200">
                        Store Admin Authorization Required: {currentAdminEmail ? `Currently signed in as ${currentAdminEmail}` : 'Currently Guest'}
                      </p>
                      <p className="text-amber-300/80 text-[11px] mt-0.5">
                        Firestore security rules require the store administrator account (<strong className="text-white">sonkarrajeevkumar36@gmail.com</strong>) to update order statuses, approve/reject returns, and modify inventory.
                      </p>
                    </div>
                  </div>
                  <form onSubmit={handleAdminDirectLogin} className="flex flex-wrap items-center gap-2">
                    <input
                      type="password"
                      placeholder="Admin Password"
                      value={adminAuthPassword}
                      onChange={(e) => setAdminAuthPassword(e.target.value)}
                      className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={isAdminLoggingIn || !adminAuthPassword}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {isAdminLoggingIn ? (
                        <>
                          <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-3.5 h-3.5" />
                          <span>Authenticate Admin</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-emerald-950/30 border border-emerald-500/30 px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-[11px]">
                      Store Admin Active: <span className="text-white">sonkarrajeevkumar36@gmail.com</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Full Admin Access
                  </span>
                </div>
              )}

              {/* Quick Status Bar */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-slate-300">Store Acceptance</h3>
                  <p className="text-xs font-extrabold text-white">
                    {isShopClosed ? '🔴 Shop is currently CLOSED' : '🟢 Shop is currently OPEN'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleShopStatus}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isShopClosed
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isShopClosed ? 'OPEN SHOP' : 'CLOSE SHOP'}
                </button>
              </div>

              {/* Orders Stream */}
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="bg-slate-800/40 border border-slate-800 rounded-2xl py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold uppercase tracking-wider">No active orders</p>
                  </div>
                ) : (
                  orders.map((order) => {
                    const normStatus = (order.status || 'placed').toLowerCase().trim();
                    const isReturnReq = normStatus === 'return_requested' || normStatus === 'return_pending';
                    const isReturnApproved = normStatus === 'return_approved';
                    const isReturnRejected = normStatus === 'return_rejected';
                    const isReturned = normStatus === 'returned';

                    return (
                      <div
                        key={order.id}
                        className={`bg-slate-800 rounded-2xl border overflow-hidden shadow-sm space-y-3 p-4 transition-all ${
                          isReturnReq
                            ? 'border-amber-500/60 bg-amber-950/20'
                            : isReturnApproved
                            ? 'border-emerald-500/50 bg-emerald-950/15'
                            : isReturnRejected
                            ? 'border-rose-500/40 bg-rose-950/15'
                            : 'border-slate-700'
                        }`}
                      >
                        {/* Order Header */}
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white">
                                #{order.id.slice(-6).toUpperCase()}
                              </span>
                              <span
                                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-tight ${
                                  normStatus === 'delivered'
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                    : isReturnApproved
                                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                                    : isReturnRejected
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : isReturnReq
                                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                                    : isReturned
                                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                    : normStatus === 'cancelled'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}
                              >
                                {isReturnApproved
                                  ? 'Return Approved'
                                  : isReturnRejected
                                  ? 'Return Rejected'
                                  : isReturnReq
                                  ? 'Return Requested'
                                  : isReturned
                                  ? 'Returned (Legacy)'
                                  : order.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium mt-1">
                              Customer: <strong className="text-slate-200">{order.customerName}</strong> • 📞 {order.customerPhone}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              📍 {order.customerAddress}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-green-400">
                              ₹{order.total}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 text-xs space-y-1">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-slate-300">
                              <span>{item.name} × {item.qty}</span>
                              <span className="font-semibold text-white">₹{item.price * item.qty}</span>
                            </div>
                          ))}
                        </div>

                        {/* Return Request Details in Admin */}
                        {isReturnReq && (
                          <div className="bg-amber-900/30 border border-amber-500/40 p-3 rounded-xl text-xs space-y-1.5">
                            <div className="flex items-center gap-1.5 text-amber-400 font-black uppercase text-[10px]">
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Customer Return Requested</span>
                            </div>
                            {order.returnReason && (
                              <p className="text-amber-200">
                                <strong>Reason:</strong> {order.returnReason}
                              </p>
                            )}
                            {order.returnNotes && (
                              <p className="text-amber-300 text-[11px] italic">
                                Notes: "{order.returnNotes}"
                              </p>
                            )}
                          </div>
                        )}

                        {/* Return Approved Banner */}
                        {isReturnApproved && (
                          <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-emerald-400 font-black uppercase text-[10px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Return Request Approved</span>
                            </div>
                            <p className="text-emerald-200 text-[11px]">
                              Return approved by admin. Pickup & refund are in progress.
                            </p>
                            {order.returnReason && (
                              <p className="text-emerald-300/90 text-[11px]">
                                <strong>Reason:</strong> {order.returnReason}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Return Rejected Banner */}
                        {isReturnRejected && (
                          <div className="bg-rose-950/40 border border-rose-500/40 p-3 rounded-xl text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-rose-400 font-black uppercase text-[10px]">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Return Request Rejected</span>
                            </div>
                            <p className="text-rose-200 text-[11px]">
                              This return request was reviewed and rejected.
                            </p>
                            {order.returnReason && (
                              <p className="text-rose-300/90 text-[11px]">
                                <strong>Reason:</strong> {order.returnReason}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Legacy Returned Banner */}
                        {isReturned && (
                          <div className="bg-teal-950/40 border border-teal-500/40 p-3 rounded-xl text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-teal-400 font-black uppercase text-[10px]">
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Returned & Refunded (Legacy Order)</span>
                            </div>
                            <p className="text-teal-200 text-[11px]">
                              Completed under legacy return flow.
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-700/60">
                          {/* Standard Delivery State Flow */}
                          {(normStatus === 'placed' || normStatus === 'pending') && (
                            <button
                              type="button"
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                              className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              {updatingOrderId === order.id ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : null}
                              <span>Start Preparing</span>
                            </button>
                          )}
                          {normStatus === 'preparing' && (
                            <button
                              type="button"
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleUpdateOrderStatus(order.id, 'out for delivery')}
                              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              {updatingOrderId === order.id ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : null}
                              <span>Send for Delivery</span>
                            </button>
                          )}
                          {(normStatus === 'out for delivery' || normStatus === 'out_for_delivery') && (
                            <button
                              type="button"
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                              className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              {updatingOrderId === order.id ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : null}
                              <span>Mark Delivered</span>
                            </button>
                          )}

                          {/* Return Management Flow in Admin: Approve and Reject */}
                          {isReturnReq && (
                            <div className="flex flex-1 flex-col sm:flex-row gap-2">
                              {/* Approve Return Button */}
                              <button
                                type="button"
                                disabled={updatingOrderId === order.id}
                                onClick={() => handleUpdateOrderStatus(order.id, 'return_approved')}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
                              >
                                {updatingOrderId === order.id ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                <span>Approve Return</span>
                              </button>

                              {/* Reject Return Button */}
                              <button
                                type="button"
                                disabled={updatingOrderId === order.id}
                                onClick={() => handleUpdateOrderStatus(order.id, 'return_rejected')}
                                className="bg-rose-900/70 hover:bg-rose-800/90 border border-rose-700/60 disabled:opacity-50 disabled:cursor-not-allowed text-rose-200 text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                              >
                                {updatingOrderId === order.id ? (
                                  <span className="w-3.5 h-3.5 border-2 border-rose-200 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                )}
                                <span>Reject Return</span>
                              </button>
                            </div>
                          )}

                          {/* Cancel button for non-finalized orders */}
                          {normStatus !== 'delivered' &&
                            normStatus !== 'cancelled' &&
                            normStatus !== 'returned' &&
                            normStatus !== 'return_approved' &&
                            normStatus !== 'return_rejected' &&
                            !isReturnReq && (
                              <button
                                type="button"
                                disabled={updatingOrderId === order.id}
                                onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                className="bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white disabled:opacity-50 text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer"
                              >
                                Cancel Order
                              </button>
                            )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* INVENTORY TAB */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Category Creator */}
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Add / Manage Categories
                </h3>
                <form onSubmit={handleCreateCategory} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Icon (e.g. 🍎)"
                    className="w-16 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-center text-sm outline-none"
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Category Name"
                    className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </form>

                {/* Category List */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {categories.map((cat) => (
                    <div
                      key={cat.id || Math.random().toString()}
                      className="flex items-center gap-2 bg-slate-900 border border-slate-700 pl-3 pr-2 py-1 rounded-full text-xs font-medium text-slate-300"
                    >
                      <span>{cat.icon || '📦'}</span>
                      <span>{cat.name || 'Category'}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.name || 'Category')}
                        className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Form */}
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    {editingProduct ? 'Edit Grocery Item' : 'Add New Grocery Item'}
                  </h3>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="text-xs font-bold text-amber-400 underline"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Product Name (e.g. Fresh Milk, Red Apples)"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none"
                    value={editingProduct ? editingProduct.name : prodForm.name}
                    onChange={(e) => {
                      if (editingProduct) setEditingProduct({ ...editingProduct, name: e.target.value });
                      else setProdForm({ ...prodForm, name: e.target.value });
                    }}
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Price in ₹"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none"
                      value={editingProduct ? editingProduct.price : prodForm.price}
                      onChange={(e) => {
                        if (editingProduct) setEditingProduct({ ...editingProduct, price: Number(e.target.value) });
                        else setProdForm({ ...prodForm, price: e.target.value });
                      }}
                      required
                    />

                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none text-slate-200"
                      value={editingProduct ? editingProduct.unit : prodForm.unit}
                      onChange={(e) => {
                        if (editingProduct) setEditingProduct({ ...editingProduct, unit: e.target.value });
                        else setProdForm({ ...prodForm, unit: e.target.value });
                      }}
                    >
                      <option value="kg">kg</option>
                      <option value="gram">gram</option>
                      <option value="litre">litre</option>
                      <option value="ml">ml</option>
                      <option value="piece">piece</option>
                      <option value="pack">pack</option>
                      <option value="bunch">bunch</option>
                      <option value="plate">plate</option>
                      <option value="dozen">dozen</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    placeholder="Image URL"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none"
                    value={editingProduct ? editingProduct.imageUrl : prodForm.imageUrl}
                    onChange={(e) => {
                      if (editingProduct) setEditingProduct({ ...editingProduct, imageUrl: e.target.value });
                      else setProdForm({ ...prodForm, imageUrl: e.target.value });
                    }}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none text-slate-200"
                      value={editingProduct ? editingProduct.category : prodForm.category}
                      onChange={(e) => {
                        if (editingProduct) setEditingProduct({ ...editingProduct, category: e.target.value });
                        else setProdForm({ ...prodForm, category: e.target.value });
                      }}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none text-slate-200"
                      value={editingProduct ? editingProduct.status : prodForm.status}
                      onChange={(e) => {
                        const statusVal = e.target.value as any;
                        if (editingProduct) setEditingProduct({ ...editingProduct, status: statusVal });
                        else setProdForm({ ...prodForm, status: statusVal });
                      }}
                    >
                      <option value="Available">Available</option>
                      <option value="Out of Stock">Out of Stock</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {editingProduct ? 'Update Product' : 'Add to Stock'}
                  </button>
                </form>
              </div>

              {/* Product Listing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-xs font-bold text-slate-300">Inventory Items ({products.length})</h3>
                  <button
                    type="button"
                    onClick={onRefreshProducts}
                    className="text-[10px] font-bold text-green-400 hover:underline cursor-pointer"
                  >
                    Refresh List
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {products.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center justify-between gap-3"
                    >
                      <div className="w-10 h-10 bg-slate-900 rounded-lg p-1 flex items-center justify-center shrink-0">
                        <img
                          src={prod.imageUrl}
                          alt=""
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                        <p className="text-[10px] text-slate-400">
                          ₹{prod.price} / {prod.unit} • {prod.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(prod)}
                          className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                  <span className="text-xl">💰</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Delivered Revenue</p>
                  <h4 className="text-lg font-black text-green-400">
                    ₹{orders.filter((o) => (o.status || '').toLowerCase() === 'delivered').reduce((s, o) => s + (o.total || 0), 0)}
                  </h4>
                </div>

                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                  <span className="text-xl">📦</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Orders</p>
                  <h4 className="text-lg font-black text-white">{orders.length}</h4>
                </div>

                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                  <span className="text-xl">🔄</span>
                  <p className="text-[10px] font-bold text-amber-400 uppercase mt-1">Return Requests</p>
                  <h4 className="text-lg font-black text-amber-300">
                    {orders.filter((o) => {
                      const s = (o.status || '').toLowerCase();
                      return s === 'return_requested' || s === 'return_pending';
                    }).length}
                  </h4>
                </div>

                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                  <span className="text-xl">⚡</span>
                  <p className="text-[10px] font-bold text-blue-400 uppercase mt-1">Active Deliveries</p>
                  <h4 className="text-lg font-black text-blue-300">
                    {orders.filter((o) => {
                      const s = (o.status || '').toLowerCase();
                      return s === 'placed' || s === 'preparing' || s === 'out for delivery';
                    }).length}
                  </h4>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                General Store Settings
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">
                    App Logo Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={logoInput}
                    onChange={(e) => setLogoInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">
                    Support Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="8090315246"
                    value={supportInput}
                    onChange={(e) => setSupportInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Save Store Settings
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
