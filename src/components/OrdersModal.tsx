import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Package, RotateCcw, Clock, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import { Order, Language } from '../types';
import { getTranslation } from '../translations';

interface OrdersModalProps {
  isOpen: boolean;
  orders: Order[];
  lang: Language;
  onClose: () => void;
  onCancelOrder: (orderId: string) => void;
  onRequestReturn: (order: Order) => void;
  onReorder: (order: Order) => void;
}

export function OrdersModal({
  isOpen,
  orders,
  lang,
  onClose,
  onCancelOrder,
  onRequestReturn,
  onReorder
}: OrdersModalProps) {
  if (!isOpen) return null;

  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  const getStatusBadge = (status: string) => {
    const s = (status || 'placed').toLowerCase().trim();
    switch (s) {
      case 'delivered':
        return {
          bg: 'bg-green-100 text-green-800 border-green-200',
          text: t('statusText.delivered') || 'Delivered'
        };
      case 'placed':
      case 'pending':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          text: t('statusText.placed') || 'Order Placed'
        };
      case 'preparing':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          text: t('statusText.preparing') || 'Preparing'
        };
      case 'out for delivery':
      case 'out_for_delivery':
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          text: t('statusText.out_for_delivery') || 'Out for Delivery'
        };
      case 'return_requested':
      case 'return_pending':
        return {
          bg: 'bg-orange-100 text-orange-800 border-orange-200',
          text: t('statusText.return_requested') || (lang === 'hi' ? 'वापसी अनुरोध' : 'Return Requested')
        };
      case 'return_approved':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          text: t('statusText.return_approved') || (lang === 'hi' ? 'वापसी स्वीकृत' : 'Return Approved')
        };
      case 'return_rejected':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          text: t('statusText.return_rejected') || (lang === 'hi' ? 'वापसी अस्वीकृत' : 'Return Rejected')
        };
      case 'returned':
        return {
          bg: 'bg-teal-100 text-teal-800 border-teal-200',
          text: t('statusText.returned') || (lang === 'hi' ? 'वापस किया गया' : 'Returned')
        };
      case 'cancelled':
        return {
          bg: 'bg-red-100 text-red-800 border-red-200',
          text: t('statusText.cancelled') || 'Cancelled'
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          text: status
        };
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[180] flex justify-center items-end sm:items-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="bg-white w-full max-w-xl h-[90vh] sm:h-auto sm:max-h-[88vh] rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col p-5 sm:p-6 overflow-hidden text-slate-900 border border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-black text-slate-900">
                {t('myOrders')}
              </h2>
              <span className="bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded-full text-xs">
                {orders.length}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Orders Stream Container */}
          <div className="flex-1 overflow-y-auto overscroll-contain hide-scrollbar py-4 space-y-4">
            {orders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  {t('noOrders')}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'hi'
                    ? 'जब आप ऑर्डर देंगे, उसकी स्थिति यहाँ दिखाई देगी।'
                    : 'When you place an order, its live tracking will show up here.'}
                </p>
              </div>
            ) : (
              orders.map((order) => {
                const normStatus = (order.status || 'placed').toLowerCase().trim();
                const badge = getStatusBadge(order.status);

                let formattedDate = 'Just now';
                if (order.createdAt?.toDate) {
                  formattedDate = order.createdAt.toDate().toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });
                } else if (order.createdAt?.seconds) {
                  formattedDate = new Date(order.createdAt.seconds * 1000).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });
                }

                const canCancel = normStatus === 'placed' || normStatus === 'pending';
                const canReturn = normStatus === 'delivered';
                const isReturned = normStatus === 'returned';
                const isReturnRequested = normStatus === 'return_requested' || normStatus === 'return_pending';
                const isReturnApproved = normStatus === 'return_approved';
                const isReturnRejected = normStatus === 'return_rejected';
                const canReorder =
                  normStatus === 'delivered' ||
                  normStatus === 'cancelled' ||
                  normStatus === 'returned' ||
                  isReturnApproved ||
                  isReturnRejected;

                return (
                  <div
                    key={order.id}
                    className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 space-y-3 shadow-xs hover:border-slate-300 transition-colors"
                  >
                    {/* Top Row: Order ID, Date & Badge */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          {lang === 'hi' ? 'ऑर्डर ID' : 'ORDER'} #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[11px] text-slate-600 font-semibold mt-0.5">
                          {formattedDate}
                        </span>
                      </div>

                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border tracking-tight ${badge.bg}`}>
                        {badge.text}
                      </span>
                    </div>

                    {/* Order Items List */}
                    <div className="bg-white p-3 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                      <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                        {t('items')}:
                      </div>
                      <div className="space-y-0.5">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between font-medium">
                            <span className="truncate pr-2">{item.name} × {item.qty}</span>
                            <span className="font-semibold text-slate-900 shrink-0">₹{item.price * item.qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Return Info Box if Return was requested, approved, rejected, or completed */}
                    {(isReturnRequested || isReturnApproved || isReturnRejected || isReturned) && (
                      <div
                        className={`p-3 rounded-xl text-xs space-y-1.5 ${
                          isReturnApproved
                            ? 'bg-emerald-50/95 border border-emerald-200 text-emerald-950'
                            : isReturnRejected
                            ? 'bg-rose-50/95 border border-rose-200 text-rose-950'
                            : 'bg-amber-50/95 border border-amber-200 text-amber-950'
                        }`}
                      >
                        <div
                          className={`flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider ${
                            isReturnApproved
                              ? 'text-emerald-800'
                              : isReturnRejected
                              ? 'text-rose-800'
                              : 'text-amber-800'
                          }`}
                        >
                          {isReturnApproved ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : isReturnRejected ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span>
                            {isReturnApproved
                              ? (lang === 'hi' ? 'वापसी अनुरोध स्वीकृत' : 'Return Request Approved')
                              : isReturnRejected
                              ? (lang === 'hi' ? 'वापसी अनुरोध अस्वीकृत' : 'Return Request Rejected')
                              : isReturned
                              ? (lang === 'hi' ? 'वापसी विवरण' : 'Return Completed (Legacy)')
                              : (lang === 'hi' ? 'वापसी अनुरोध विचाराधीन' : 'Return Request In Review')}
                          </span>
                        </div>

                        {isReturnApproved && (
                          <p className="text-[11px] text-emerald-800 font-medium">
                            {lang === 'hi'
                              ? 'आपकी वापसी स्वीकार कर ली गई है। डिलीवरी पार्टनर जल्द ही सामान लेने पहुंचेगा और रिफंड प्रोसेस होगा।'
                              : 'Your return has been approved. A pickup partner will collect the items soon and initiate your refund.'}
                          </p>
                        )}
                        {isReturnRejected && (
                          <p className="text-[11px] text-rose-800 font-medium">
                            {lang === 'hi'
                              ? 'दुकानदार द्वारा यह वापसी अनुरोध अस्वीकार कर दिया गया है।'
                              : 'This return request was reviewed and could not be approved.'}
                          </p>
                        )}
                        {isReturnRequested && (
                          <p className="text-[11px] text-amber-800 font-medium">
                            {lang === 'hi'
                              ? 'आपका वापसी अनुरोध स्टोर टीम द्वारा समीक्षा के अधीन है।'
                              : 'Your return request is currently under review by our store team.'}
                          </p>
                        )}

                        {order.returnReason && (
                          <p className="text-[11px] font-semibold text-slate-800 pt-0.5">
                            <span className="font-bold opacity-75">{lang === 'hi' ? 'कारण:' : 'Reason:'}</span> {order.returnReason}
                          </p>
                        )}
                        {order.returnNotes && (
                          <p className="text-[10px] text-slate-600 italic">
                            "{order.returnNotes}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Bottom Row: Total & Action Buttons */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          {t('grandTotal')}
                        </span>
                        <span className="font-black text-sm text-slate-900">
                          ₹{order.total}
                        </span>
                      </div>

                      {/* Action Buttons: Cancel, Return, Reorder */}
                      <div className="flex items-center gap-2">
                        {/* Cancel Order */}
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => onCancelOrder(order.id)}
                            className="text-[11px] font-black text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer uppercase tracking-tight"
                          >
                            {t('cancel')}
                          </button>
                        )}

                        {/* Return Order Button */}
                        {canReturn && (
                          <button
                            type="button"
                            onClick={() => onRequestReturn(order)}
                            className="text-[11px] font-black text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1 uppercase tracking-tight shadow-2xs"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{t('return')}</span>
                          </button>
                        )}

                        {/* Reorder Button */}
                        {canReorder && (
                          <button
                            type="button"
                            onClick={() => onReorder(order)}
                            className="text-[11px] font-black text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1 uppercase tracking-tight shadow-2xs"
                          >
                            <span>{t('reorder')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
