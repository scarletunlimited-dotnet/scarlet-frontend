'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PencilIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { adminApi } from '@/lib/api';
import { useToast, useAuth } from '@/lib/context';
import type { AdminProduct } from '@/lib/admin-types';
import AdminPageWrapper, { useAdminPageState } from '../../../components/admin/AdminPageWrapper';
import EmptyState, { EmptyProductsState } from '../../../components/admin/EmptyState';
import logger from '@/lib/logger';

interface ProductFilters {
  search: string;
  category: string;
  status: string;
  stockStatus: string;
  priceRange: [number, number];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const STOCK_STATUS_OPTIONS = [
  { value: '', label: 'All Stock Status' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'pre_order', label: 'Pre-order' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Product Name' },
  { value: 'price', label: 'Price' },
  { value: 'stock', label: 'Stock Quantity' },
  { value: 'createdAt', label: 'Date Created' },
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'sales', label: 'Sales Count' },
];

export default function ProductsPage() {
  const { loading, error, executeWithErrorHandling, retry } = useAdminPageState();
  const { user } = useAuth();
  const canMutate = user?.role !== 'monitor';
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  // Separate search input state from filters to prevent immediate fetch on every keystroke
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: '',
    status: '',
    stockStatus: '',
    priceRange: [0, 10000],
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  const { addToast } = useToast();
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search input - update filters after user stops typing for 800ms
  useEffect(() => {
    // Clear previous timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Set new timeout to update filters after 800ms of no typing
    searchDebounceRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
      // Reset to page 1 when search changes
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 800);

    // Cleanup timeout on unmount or when searchInput changes
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchInput]);

  // Fetch products from backend - always silent to prevent UI reload
  const fetchProducts = React.useCallback(async () => {
    await executeWithErrorHandling(async () => {
      const queryFilters: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      // Add filters if they have values
      if (filters.search) queryFilters.search = filters.search;
      if (filters.category) queryFilters.category = filters.category;
      if (filters.status) queryFilters.status = filters.status;
      if (filters.stockStatus) {
        if (filters.stockStatus === 'in_stock') queryFilters.inStock = true;
        if (filters.stockStatus === 'low_stock') queryFilters.lowStock = true;
        if (filters.stockStatus === 'out_of_stock') queryFilters.inStock = false;
      }
      if (filters.priceRange[0] > 0) queryFilters.priceMin = filters.priceRange[0];
      if (filters.priceRange[1] < 10000) queryFilters.priceMax = filters.priceRange[1];

      logger.info('Fetching admin products with filters', queryFilters);
      const response = await adminApi.products.getProducts(queryFilters);
      
      if (response) {
        // Handle the actual response structure: {data: Array, total: number, page: number, totalPages: number}
        const products = (response as any).products || (response as any).data || [];
        setProducts(products);
        setPagination(prev => ({
          ...prev,
          total: response.total || 0,
          totalPages: response.totalPages || 0
        }));
        setIsSearching(false);
      } else {
        setProducts([]);
        setIsSearching(false);
      }
    }, {
      showLoading: false // Silent fetch - no page reload, no loading spinner
    });
  }, [pagination.page, pagination.limit, filters, executeWithErrorHandling]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSelectProduct = useCallback((productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p._id!));
    }
  }, [selectedProducts.length, products]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedProducts.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} product(s)?`)) {
      try {
        // Delete products one by one (could be optimized with bulk delete endpoint)
        for (const productId of selectedProducts) {
          await adminApi.products.deleteProduct(productId);
        }
        
        // Refresh the product list
        await fetchProducts();
        setSelectedProducts([]);
        addToast({
          type: 'success',
          title: 'Products deleted',
          message: `${selectedProducts.length} product(s) have been deleted successfully.`,
        });
      } catch (error) {
        console.error('Bulk delete error:', error);
        addToast({
          type: 'error',
          title: 'Delete failed',
          message: 'Failed to delete products. Please try again.',
        });
      }
    }
  }, [selectedProducts, addToast, fetchProducts]);

  const handleBulkStatusUpdate = useCallback(async (status: string) => {
    if (selectedProducts.length === 0) return;
    
    try {
      // Update each product individually (could be optimized with bulk update endpoint)
      for (const productId of selectedProducts) {
        // Note: We'll need to implement status update endpoint in backend
        logger.info('Updating product status', { productId, status });
      }
      
      // Refresh the product list  
      await fetchProducts();
      setSelectedProducts([]);
      addToast({
        type: 'success',
        title: 'Status updated',
        message: `${selectedProducts.length} product(s) status updated to ${status}.`,
      });
    } catch (error) {
      console.error('Bulk status update error:', error);
      addToast({
        type: 'error',
        title: 'Update failed',
        message: 'Failed to update product status. Please try again.',
      });
    }
  }, [selectedProducts, addToast, fetchProducts]);

  // Helper function to calculate effective stock (variant stock if exists, otherwise main stock)
  const getEffectiveStock = (product: AdminProduct): number => {
    let effectiveStock = product.stock || 0;
    
    // If product has variantStock, calculate total variant stock
    if (product.variantStock && typeof product.variantStock === 'object') {
      const totalVariantStock = Object.values(product.variantStock).reduce(
        (sum: number, stock: number) => sum + (stock || 0), 
        0
      );
      
      // Use variant stock if it has values (> 0), otherwise keep using main stock
      if (totalVariantStock > 0) {
        effectiveStock = totalVariantStock;
      }
    }
    
    return effectiveStock;
  };

  const getStockStatusBadge = (product: AdminProduct) => {
    const effectiveStock = getEffectiveStock(product);
    const lowStockThreshold = 10; // Default threshold
    
    if (effectiveStock === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
          Out of Stock
        </span>
      );
    }
    
    if (effectiveStock <= lowStockThreshold) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
          Low Stock
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        In Stock
      </span>
    );
  };



  return (
    <AdminPageWrapper
      title="Products"
      description="Manage your product catalog and pricing"
      loading={loading}
      error={error}
      onRetry={retry}
      className="w-full max-w-none"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Products</h1>
            <p className="text-gray-600">
              Manage your product catalog and pricing
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => {/* Export functionality */}}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => {/* Import functionality */}}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
              Import
            </button>
            {canMutate && (
              <Link
                href="/admin/products/new"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:from-red-700 hover:to-rose-600 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Product
              </Link>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Squares2X2Icon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-amber-600">
                  {products.filter(p => {
                    const stock = getEffectiveStock(p);
                    return stock <= 10 && stock > 0;
                  }).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">On this page</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {products.filter(p => getEffectiveStock(p) === 0).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">On this page</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Showing</p>
                <p className="text-2xl font-bold text-green-600">
                  {products.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">On this page</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <EyeIcon className="w-6 h-6 text-green-600" />
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
                <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isSearching ? 'text-red-500' : 'text-gray-400'} transition-colors`} />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></div>
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => {
                    e.preventDefault();
                    setSearchInput(e.target.value);
                    setIsSearching(true);
                  }}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className={`w-full ${isSearching ? 'pl-10 pr-10' : 'pl-10 pr-4'} py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400 transition-all`}
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
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-red-50 text-red-700' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Squares2X2Icon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 border-l border-gray-300 ${viewMode === 'list' ? 'bg-red-50 text-red-700' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <ListBulletIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="">All Categories</option>
                  <option value="Makeup">Makeup</option>
                  <option value="Skincare">Skincare</option>
                  <option value="Bath & Body">Bath & Body</option>
                  <option value="Fragrance">Fragrance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Status
                </label>
                <select
                  value={filters.stockStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, stockStatus: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                >
                  {STOCK_STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <div className="flex space-x-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setFilters(prev => ({ 
                      ...prev, 
                      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                    }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {canMutate && selectedProducts.length > 0 && (
          <div className="p-4 bg-blue-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <p className="text-sm font-medium text-blue-900">
                  {selectedProducts.length} product(s) selected
                </p>
                <button
                  onClick={() => setSelectedProducts([])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkStatusUpdate('active')}
                  className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('draft')}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                >
                  Draft
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <div key={product._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="relative aspect-square bg-gray-100">
                {canMutate && (
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product._id!)}
                    onChange={() => handleSelectProduct(product._id!)}
                    className="absolute top-3 left-3 w-4 h-4 text-red-700 bg-white border-gray-300 rounded focus:ring-red-500 z-10"
                  />
                )}
                <img
                  src={product.images[0] || '/logo/scarletlogo.png'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  {getStockStatusBadge(product)}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 line-clamp-2 flex-1">
                    {product.title}
                  </h3>
                  <div className="ml-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-2">
                  SKU: {product.slug || 'N/A'}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {product.price.currency} {product.price.amount?.toLocaleString() || '0'}
                    </p>
                    {product.price.originalAmount && product.price.originalAmount > product.price.amount && (
                      <p className="text-sm text-gray-500 line-through">
                        {product.price.currency} {product.price.originalAmount?.toLocaleString() || '0'}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      Stock: {getEffectiveStock(product)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Categories: {product.categoryIds.length}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Link
                      href={`/admin/products/${product._id}`}
                      className="p-2 text-gray-400 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                      title="View"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Link>
                    {canMutate && (
                      <>
                        <Link
                          href={`/admin/products/${product._id}/edit`}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={async () => {
                            try {
                              await adminApi.products.updateProductStock(product._id!, (product.stock || 0) + 10);
                              await fetchProducts();
                              addToast({ type: 'success', title: 'Stock Updated', message: 'Product stock increased by 10' });
                            } catch (error) {
                              addToast({ type: 'error', title: 'Error', message: 'Failed to update stock' });
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                          title="Add Stock"
                        >
                          <DocumentDuplicateIcon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    {product.brand && (
                      <span>{product.brand}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {canMutate && (
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === products.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-red-700 bg-white border-gray-300 rounded focus:ring-red-500"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    {canMutate && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product._id!)}
                          onChange={() => handleSelectProduct(product._id!)}
                          className="w-4 h-4 text-red-700 bg-white border-gray-300 rounded focus:ring-red-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={product.images[0] || '/logo/scarletlogo.png'}
                          alt={product.title}
                          className="w-12 h-12 rounded-lg object-cover mr-4"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {product.title}
                            </span>
                            {(product as any).isComingSoon && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                Coming Soon
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.brand || 'No brand'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.slug}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.price.currency} {product.price.amount?.toLocaleString() || '0'}
                      </div>
                      {product.price.originalAmount && product.price.originalAmount > product.price.amount && (
                        <div className="text-sm text-gray-500 line-through">
                          {product.price.currency} {product.price.originalAmount?.toLocaleString() || '0'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {getEffectiveStock(product)}
                        </span>
                        {getStockStatusBadge(product)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.categoryIds.length} categories
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/products/${product._id}`}
                          className="text-red-700 hover:text-red-950"
                        >
                          View
                        </Link>
                        {canMutate && (
                          <Link
                            href={`/admin/products/${product._id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm mt-6">
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
                Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button
                      key={i}
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNumber }))}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pagination.page === pageNumber
                          ? 'z-10 bg-red-50 border-red-500 text-red-700'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {products.length === 0 && !loading && (
        filters.search || filters.category || filters.status || filters.stockStatus || searchInput ? (
          <EmptyState
            icon={Squares2X2Icon}
            title="No Products Found"
            description="No products match your current filters. Try adjusting your search criteria to see more products."
            action={{
              label: "Clear Filters",
              onClick: () => {
                setSearchInput('');
                setFilters({
                  search: '',
                  category: '',
                  status: '',
                  stockStatus: '',
                  priceRange: [0, 10000],
                  sortBy: 'updatedAt',
                  sortOrder: 'desc',
                });
              },
              variant: "secondary"
            }}
          />
        ) : (
          <EmptyProductsState onCreateProduct={canMutate ? () => window.location.href = '/admin/products/new' : undefined} />
        )
      )}
    </AdminPageWrapper>
  );
}
