'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  PrinterIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  UserIcon,
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronDownIcon,
  ShoppingBagIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { BDTIcon } from '../../../components/ui/BDTIcon';
import { useToast, useAuth } from '@/lib/context';
import { adminApi } from '@/lib/api';
import type { AdminOrder } from '@/lib/admin-types';

interface OrderFilters {
  search: string;
  status: string;
  paymentStatus: string;
  dateRange: string;
  paymentMethod: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const ORDER_STATUSES = [
  { value: '', label: 'All Orders', color: 'gray' },
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'preorder', label: 'Preorder', color: 'purple' },
  { value: 'confirmed', label: 'Confirmed', color: 'blue' },
  { value: 'processing', label: 'Processing', color: 'indigo' },
  { value: 'delivered', label: 'Delivered', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'refunded', label: 'Refunded', color: 'gray' },
];

const PAYMENT_STATUSES = [
  { value: '', label: 'All Payments', color: 'gray' },
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'partial', label: 'Partial', color: 'orange' },
  { value: 'processing', label: 'Processing', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'failed', label: 'Failed', color: 'red' },
  { value: 'refunded', label: 'Refunded', color: 'gray' },
];

const PAYMENT_METHODS = [
  { value: '', label: 'All Methods' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'cod', label: 'Cash on Delivery' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Order Date' },
  { value: 'total', label: 'Order Total' },
  { value: 'status', label: 'Status' },
  { value: 'customerName', label: 'Customer Name' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<AdminOrder | null>(null);
  const [showQuickStatusModal, setShowQuickStatusModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    status: '',
    paymentStatus: '',
    dateRange: '',
    paymentMethod: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { addToast } = useToast();
  const { user } = useAuth();
  const canMutate = user?.role !== 'monitor';

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build API filters
      const apiFilters: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      if (filters.search) apiFilters.search = filters.search;
      if (filters.status) apiFilters.status = filters.status;
      if (filters.paymentStatus) apiFilters.paymentStatus = filters.paymentStatus;
      if (filters.paymentMethod) apiFilters.paymentMethod = filters.paymentMethod;
      if (filters.dateRange) {
        const [startDate, endDate] = filters.dateRange.split(' to ');
        if (startDate) apiFilters.dateFrom = startDate;
        if (endDate) apiFilters.dateTo = endDate;
      }
      
      const response = await adminApi.orders.getOrders(apiFilters);
      
      // Transform backend order format to frontend AdminOrder format
      const transformedOrders: AdminOrder[] = response.orders.map((order: any) => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentInfo?.status || 'pending',
        paymentMethod: order.paymentInfo?.method || 'cod',
        customer: {
          _id: order.userId || order.guestId || 'unknown',
          name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ''}`.trim(),
          email: order.shippingAddress.email || 'N/A',
          phone: order.shippingAddress.phone,
        },
        items: order.items.map((item: any) => ({
          _id: `${order._id}-${item.productId}`,
          productId: item.productId,
          productName: item.title,
          productImage: item.image || '/logo/scarletlogo.png',
          sku: item.sku || 'N/A',
          variant: item.variant || null,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        subtotal: order.subtotal,
        shippingCost: order.shipping,
        tax: order.tax,
        discount: order.discount,
        total: order.total,
        currency: order.currency,
        shippingAddress: {
          name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ''}`.trim(),
          phone: order.shippingAddress.phone,
          address: order.shippingAddress.address,
          city: order.shippingAddress.city,
          state: order.shippingAddress.area,
          postalCode: order.shippingAddress.postalCode,
          country: 'Bangladesh',
        },
        billingAddress: {
          name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ''}`.trim(),
          phone: order.shippingAddress.phone,
          address: order.shippingAddress.address,
          city: order.shippingAddress.city,
          state: order.shippingAddress.area,
          postalCode: order.shippingAddress.postalCode,
          country: 'Bangladesh',
        },
        notes: order.notes || '',
        trackingNumber: order.trackingNumber || null,
        estimatedDelivery: order.estimatedDelivery || null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }));
      
      setOrders(transformedOrders);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages,
      }));
      
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(err.message || 'Failed to load orders');
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load orders. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, addToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset pagination when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters.search, filters.status, filters.paymentStatus, filters.paymentMethod, filters.dateRange]);

  // Since we're using server-side filtering, we don't need client-side filtering
  const filteredOrders = orders;

  const handleSelectOrder = useCallback((orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o._id));
    }
  }, [selectedOrders.length, filteredOrders]);

  const handleStatusUpdate = useCallback(async (orderId: string, newStatus: string) => {
    try {
      await adminApi.orders.updateOrderStatus(orderId, newStatus as any);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order._id === orderId ? { ...order, status: newStatus as any, updatedAt: new Date().toISOString() } : order
      ));
      
      addToast({
        type: 'success',
        title: 'Status updated',
        message: `Order status updated to ${newStatus}.`,
      });
    } catch (error: any) {
      console.error('Failed to update order status:', error);
      addToast({
        type: 'error',
        title: 'Update failed',
        message: error.message || 'Failed to update order status. Please try again.',
      });
    }
  }, [addToast]);

  const handleQuickStatusChange = useCallback((order: AdminOrder) => {
    setSelectedOrderForStatus(order);
    setShowQuickStatusModal(true);
  }, []);

  const handleQuickStatusUpdate = useCallback(async (newStatus: string) => {
    if (!selectedOrderForStatus) return;
    
    try {
      await adminApi.orders.updateOrderStatus(selectedOrderForStatus._id, newStatus as any);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order._id === selectedOrderForStatus._id
          ? { ...order, status: newStatus as any, updatedAt: new Date().toISOString() } 
          : order
      ));
      
      setShowQuickStatusModal(false);
      setSelectedOrderForStatus(null);
      
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `Order ${selectedOrderForStatus.orderNumber} updated to ${newStatus}.`
      });
    } catch (error: any) {
      console.error('Failed to update order:', error);
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update order status. Please try again.'
      });
    }
  }, [selectedOrderForStatus, addToast]);

  const handleBulkStatusUpdate = useCallback(async (newStatus: string) => {
    if (selectedOrders.length === 0) return;
    
    try {
      // Update each order individually
      const updatePromises = selectedOrders.map(orderId => 
        adminApi.orders.updateOrderStatus(orderId, newStatus as any)
      );
      
      await Promise.all(updatePromises);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        selectedOrders.includes(order._id) 
          ? { ...order, status: newStatus as any, updatedAt: new Date().toISOString() } 
          : order
      ));
      setSelectedOrders([]);
      
      addToast({
        type: 'success',
        title: 'Bulk update completed',
        message: `${selectedOrders.length} order(s) updated to ${newStatus}.`,
      });
    } catch (error: any) {
      console.error('Failed to bulk update orders:', error);
      addToast({
        type: 'error',
        title: 'Bulk update failed',
        message: error.message || 'Failed to update orders. Please try again.',
      });
    }
  }, [selectedOrders, addToast]);

  const getStatusBadge = (status: string) => {
    const statusConfig = ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
    const colorClasses = {
      gray: 'bg-gray-100 text-gray-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      purple: 'bg-purple-100 text-purple-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
    };
    
    const getStatusIcon = () => {
      switch (status) {
        case 'pending': return <ClockIcon className="w-3 h-3 mr-1" />;
        case 'confirmed': return <CheckCircleIcon className="w-3 h-3 mr-1" />;
        case 'processing': return <ArrowPathIcon className="w-3 h-3 mr-1" />;
        case 'delivered': return <CheckCircleIcon className="w-3 h-3 mr-1" />;
        case 'cancelled': return <XCircleIcon className="w-3 h-3 mr-1" />;
        case 'refunded': return <BDTIcon className="w-3 h-3 mr-1" />;
        default: return null;
      }
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[statusConfig.color as keyof typeof colorClasses]}`}>
        {getStatusIcon()}
        {statusConfig.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string, order?: AdminOrder) => {
    const statusConfig = PAYMENT_STATUSES.find(s => s.value === status) || PAYMENT_STATUSES[0];
    
    // Determine label: show "Partial (Preorder)" only if it's actually a preorder
    let label = statusConfig.label;
    if (status === 'partial' && order?.isPreorder) {
      label = 'Partial (Preorder)';
    }
    
    const colorClasses = {
      gray: 'bg-gray-100 text-gray-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      orange: 'bg-orange-100 text-orange-900', // Improved contrast for partial payments
      purple: 'bg-purple-100 text-purple-900', // Improved contrast for preorders
    };
    
    // Use purple for preorder partial payments, orange for regular partial payments
    const badgeColor = (status === 'partial' && order?.isPreorder) ? 'purple' : statusConfig.color;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colorClasses[badgeColor as keyof typeof colorClasses]}`}>
        {label}
      </span>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodConfig = {
      bkash: { label: 'bKash', color: 'bg-red-100 text-red-900' },
      nagad: { label: 'Nagad', color: 'bg-orange-100 text-orange-800' },
      rocket: { label: 'Rocket', color: 'bg-purple-100 text-purple-800' },
      card: { label: 'Card', color: 'bg-blue-100 text-blue-800' },
      cod: { label: 'COD', color: 'bg-green-100 text-green-800' },
    };
    
    const config = methodConfig[method as keyof typeof methodConfig] || { label: method, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Management</h1>
            <p className="text-gray-600">
              Process orders, manage fulfillment, and track customer satisfaction
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => {/* Export orders */}}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => {/* Print selected */}}
              disabled={selectedOrders.length === 0}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PrinterIcon className="w-4 h-4 mr-2" />
              Print Selected
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {orders.filter(order => order.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">
                  {orders.filter(order => order.status === 'processing').length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ArrowPathIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ৳{orders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <BDTIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders, customers..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  showFilters 
                    ? 'border-red-500 text-red-800 bg-red-50' 
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filters
              </button>

              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-red-50 text-red-700' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <ListBulletIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2 border-l border-gray-300 ${viewMode === 'card' ? 'bg-red-50 text-red-700' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Squares2X2Icon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                >
                  {ORDER_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                >
                  {PAYMENT_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({
                    search: '',
                    status: '',
                    paymentStatus: '',
                    dateRange: '',
                    paymentMethod: '',
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions - hidden for monitor (view only) */}
        {canMutate && selectedOrders.length > 0 && (
          <div className="p-4 bg-blue-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <p className="text-sm font-medium text-blue-900">
                  {selectedOrders.length} order(s) selected
                </p>
                <button
                  onClick={() => setSelectedOrders([])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkStatusUpdate('confirmed')}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
                >
                  Confirm
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('processing')}
                  className="px-3 py-1 text-sm bg-indigo-100 text-indigo-800 rounded-lg hover:bg-indigo-200"
                >
                  Process
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('delivered')}
                  className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
                >
                  Deliver
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('cancelled')}
                  className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Orders List/Grid */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {canMutate && (
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-red-700 bg-white border-gray-300 rounded focus:ring-red-500"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    {canMutate && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order._id)}
                          onChange={() => handleSelectOrder(order._id)}
                          className="w-4 h-4 text-red-700 bg-white border-gray-300 rounded focus:ring-red-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items.length} item(s)
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-red-700" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {order.customer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {getPaymentStatusBadge(order.paymentStatus, order)}
                        {getPaymentMethodBadge(order.paymentMethod)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ৳{order.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="text-red-700 hover:text-red-950 font-medium"
                        >
                          View Details
                        </Link>
                        {canMutate && (
                          <button
                            onClick={() => handleQuickStatusChange(order)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Update Status
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Card View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {canMutate && (
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order._id)}
                        onChange={() => handleSelectOrder(order._id)}
                        className="w-4 h-4 text-red-700 bg-white border-gray-300 rounded focus:ring-red-500"
                      />
                    )}
                    <h3 className="text-lg font-medium text-gray-900">
                      {order.orderNumber}
                    </h3>
                  </div>
                  <div className="relative">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                      <EllipsisVerticalIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{order.customer.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{order.customer.email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <PhoneIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{order.customer.phone}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{order.shippingAddress.city}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Status</span>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Payment</span>
                    <div className="flex items-center space-x-2">
                      {getPaymentStatusBadge(order.paymentStatus, order)}
                      {getPaymentMethodBadge(order.paymentMethod)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total</span>
                    <span className="text-lg font-bold text-gray-900">
                      ৳{order.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="p-2 text-red-700 hover:text-red-900 rounded-lg hover:bg-red-50"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Link>
                      {canMutate && (
                        <Link
                          href={`/admin/orders/${order._id}/edit`}
                          className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Link>
                      )}
                      <button
                        onClick={() => {/* Print order */}}
                        className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-50"
                      >
                        <PrinterIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm border border-gray-200 mt-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{pagination.total}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronDownIcon className="h-5 w-5 transform rotate-90" aria-hidden="true" />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i;
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === pagination.page
                          ? 'z-10 bg-red-50 border-red-500 text-red-700'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronDownIcon className="h-5 w-5 transform -rotate-90" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading orders</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchOrders}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredOrders.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.status || filters.paymentStatus || filters.paymentMethod
              ? 'Try adjusting your search or filter criteria.'
              : 'Orders will appear here once customers start placing them.'
            }
          </p>
        </div>
      )}

      {/* Quick Status Update Modal */}
      {showQuickStatusModal && selectedOrderForStatus && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Update Order Status
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Order #{selectedOrderForStatus.orderNumber}
              </p>
              <p className="text-sm text-gray-700 mb-6">
                Current status: <span className="font-semibold capitalize">{selectedOrderForStatus.status}</span>
              </p>
              
              <div className="space-y-2 mb-6">
                {ORDER_STATUSES.filter(s => s.value !== '').map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleQuickStatusUpdate(status.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      selectedOrderForStatus.status === status.value
                        ? 'border-red-700 bg-red-50'
                        : 'border-gray-200 hover:border-red-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{status.label}</span>
                      {selectedOrderForStatus.status === status.value && (
                        <span className="text-xs text-red-700 font-medium">Current</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowQuickStatusModal(false);
                    setSelectedOrderForStatus(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
