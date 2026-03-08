'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  UserGroupIcon,
  TrashIcon,
  EyeIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  CheckBadgeIcon,
  XMarkIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { AdminDataTable, type Column } from '@/components/admin/AdminDataTable';
import { adminApi } from '@/lib/api';
import type { AdminUser, AdminUserFilters } from '@/lib/admin-types';
import { useToast } from '@/lib/context';
import logger from '@/lib/logger';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<AdminUserFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [adminDowngradeConfirmation, setAdminDowngradeConfirmation] = useState('');
  const { addToast } = useToast();

  const itemsPerPage = 20;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.users.getUsers({
        ...filters,
        page: currentPage,
        limit: itemsPerPage
      });
      
      logger.info('Users API response', { page: currentPage, limit: itemsPerPage });
      
      // Handle different response structures
      const usersData = response.data || (response as any).users || (response as any) || [];
      const totalPages = response.totalPages || (response as any).pages || 1;
      const totalItems = response.total || (response as any).count || usersData.length;
      
      logger.info('Processed user data', { totalPages, totalItems, count: usersData.length });
      
      setUsers(Array.isArray(usersData) ? usersData : []);
      setTotalPages(totalPages);
      setTotalItems(totalItems);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load users'
      });
    } finally {
      setLoading(false);
    }
  }, [addToast, currentPage, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (query: string) => {
    setFilters({ ...filters, search: query });
    setCurrentPage(1);
  };

  const handleViewUser = (user: AdminUser) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleEditRole = (user: AdminUser) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'staff' | 'monitor' | 'customer') => {
    // Check if we're downgrading an admin user
    const isDowngradingAdmin = selectedUser?.role === 'admin' && newRole !== 'admin';
    
    if (isDowngradingAdmin && adminDowngradeConfirmation !== 'Yes I am sure') {
      addToast({
        type: 'error',
        title: 'Confirmation Required',
        message: 'Please type "Yes I am sure" to downgrade an admin user'
      });
      return;
    }

    try {
      setActionLoading(true);
      await adminApi.users.updateUserRole(userId, newRole);
      addToast({
        type: 'success',
        title: 'Success',
        message: `User role updated to ${newRole}`
      });
      setShowRoleModal(false);
      setSelectedUser(null);
      setAdminDowngradeConfirmation('');
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to update user role:', error);
      
      // Handle specific error for last admin protection
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to update user role';
      const errorCode = error?.response?.data?.error?.code || error?.code;
      
      if (errorCode === 'LAST_ADMIN_PROTECTION') {
        addToast({
          type: 'error',
          title: 'Cannot Downgrade Last Admin',
          message: 'At least one admin must remain in the system. Please create another admin before downgrading this user.'
        });
      } else {
        addToast({
          type: 'error',
          title: 'Error',
          message: errorMessage
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    // Check if user typed "DELETE" correctly
    if (deleteConfirmation !== 'DELETE') {
      addToast({
        type: 'error',
        title: 'Confirmation Required',
        message: 'Please type "DELETE" to confirm user deletion'
      });
      return;
    }

    try {
      setActionLoading(true);
      await adminApi.users.deleteUser(selectedUser._id);
      addToast({
        type: 'success',
        title: 'Success',
        message: 'User deleted successfully'
      });
      setShowDeleteModal(false);
      setSelectedUser(null);
      setDeleteConfirmation('');
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete user'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: 'bg-gradient-to-r from-purple-500 to-violet-500 text-white',
      staff: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
      monitor: 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white',
      customer: 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[role as keyof typeof badges] || badges.customer}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getVerificationStatus = (isEmailVerified?: boolean, isPhoneVerified?: boolean) => {
    return (
      <div className="flex items-center space-x-2">
        {isEmailVerified ? (
          <CheckBadgeIcon className="w-4 h-4 text-green-500" title="Email Verified" />
        ) : (
          <XMarkIcon className="w-4 h-4 text-red-500" title="Email Not Verified" />
        )}
        {isPhoneVerified ? (
          <CheckBadgeIcon className="w-4 h-4 text-green-500" title="Phone Verified" />
        ) : (
          <XMarkIcon className="w-4 h-4 text-red-500" title="Phone Not Verified" />
        )}
      </div>
    );
  };

  const columns: Column<AdminUser>[] = [
    {
      key: 'firstName',
      header: 'Name',
      sortable: true,
      render: (_, user) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user.firstName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-gray-500">
              ID: {user._id}
            </div>
          </div>
        </div>
      ),
      width: 'w-64'
    },
    {
      key: 'email',
      header: 'Contact',
      render: (_, user) => (
        <div className="space-y-1">
          {user.email && (
            <div className="flex items-center space-x-2 text-sm">
              <EnvelopeIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{user.email}</span>
            </div>
          )}
          {user.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <PhoneIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{user.phone}</span>
            </div>
          )}
        </div>
      ),
      width: 'w-64'
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (role) => getRoleBadge(role),
      width: 'w-32'
    },
    {
      key: 'isEmailVerified',
      header: 'Verification',
      render: (_, user) => getVerificationStatus(user.isEmailVerified, user.isPhoneVerified),
      width: 'w-32'
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      render: (createdAt) => (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <CalendarIcon className="w-4 h-4" />
          <span>{new Date(createdAt).toLocaleDateString()}</span>
        </div>
      ),
      width: 'w-32'
    }
  ];

  const actions = [
    {
      label: 'View',
      icon: EyeIcon,
      onClick: handleViewUser
    },
    {
      label: 'Edit Role',
      icon: ShieldCheckIcon,
      onClick: handleEditRole
    },
    {
      label: 'Delete',
      icon: TrashIcon,
      variant: 'danger' as const,
      onClick: handleDeleteUser
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      <div className="space-y-8 p-6">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-pink-500/5 to-rose-500/5"></div>
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <UserGroupIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <SparklesIcon className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-red-600 to-rose-600 bg-clip-text text-transparent">
                    User Management
                  </h1>
                  <p className="text-gray-600 mt-2 text-lg">
                    Manage your beauty community with precision and care
                  </p>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <ClockIcon className="w-4 h-4" />
                      <span>Last updated: {new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <UserIcon className="w-4 h-4" />
                      <span>{totalItems.toLocaleString()} total users</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                    showFilters 
                      ? 'bg-red-100 text-red-700 border-2 border-red-200 shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                  }`}
                >
                  <FunnelIcon className="w-5 h-5" />
                  <span>Filters</span>
                </button>
                <button className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2">
                  <UserIcon className="w-5 h-5" />
                  <span>Add User</span>
                </button>
                <button
                  onClick={fetchUsers}
                  className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                  title="Refresh"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-rose-500/10"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{totalItems.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Total Users</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-600">All Users</span>
                <div className="flex items-center space-x-1 text-green-600">
                  <SparklesIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckBadgeIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {users.filter(u => u.isEmailVerified || u.isPhoneVerified).length}
                  </p>
                  <p className="text-sm text-gray-500">Verified</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-600">Trusted Users</span>
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckBadgeIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Verified</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <ShieldCheckIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {users.filter(u => u.role === 'staff').length}
                  </p>
                  <p className="text-sm text-gray-500">Staff</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-600">Team Members</span>
                <div className="flex items-center space-x-1 text-blue-600">
                  <UserIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Staff</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/10"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                  <ShieldCheckIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                  <p className="text-sm text-gray-500">Admins</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-600">Administrators</span>
                <div className="flex items-center space-x-1 text-purple-600">
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Admin</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6">
              <div className="flex items-center space-x-3">
                <FunnelIcon className="w-6 h-6 text-white" />
                <h3 className="text-xl font-bold text-white">Advanced Filters</h3>
              </div>
              <p className="text-red-100 mt-1">Refine your user search with precision</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">User Role</label>
                  <select
                    value={filters.role || ''}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-all duration-200"
                  >
                    <option value="">All Roles</option>
                    <option value="customer">Customer</option>
                    <option value="staff">Staff</option>
                    <option value="monitor">Monitor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Verification Status</label>
                  <select
                    value={filters.isEmailVerified?.toString() || ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  isEmailVerified: e.target.value === '' ? undefined : e.target.value === 'true' 
                } as AdminUserFilters)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-all duration-200"
                  >
                    <option value="">All Users</option>
                    <option value="true">Verified Only</option>
                    <option value="false">Unverified Only</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Registration From</label>
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Registration To</label>
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <MagnifyingGlassIcon className="w-4 h-4" />
                  <span>Filtering {users.length} users</span>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      setFilters({});
                      setCurrentPage(1);
                    }}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200 flex items-center space-x-2"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    <span>Clear All</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center space-x-2"
                  >
                    <FunnelIcon className="w-4 h-4" />
                    <span>Apply Filters</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Users Table</h3>
            <div className="text-sm text-gray-500">
              {loading ? 'Loading...' : `${users.length} users loaded`}
            </div>
          </div>
        </div>
        
        {/* Debug Info */}
        <div className="p-4 bg-gray-50 text-xs text-gray-600">
          <div>Users Array Length: {users.length}</div>
          <div>Loading State: {loading.toString()}</div>
          <div>Total Items: {totalItems}</div>
          <div>Current Page: {currentPage}</div>
          <div>Total Pages: {totalPages}</div>
        </div>
        
        <AdminDataTable
          data={users}
          columns={columns}
          loading={loading}
          searchable={true}
          onSearch={handleSearch}
          onRefresh={fetchUsers}
          pagination={{
            currentPage,
            totalPages,
            totalItems,
            itemsPerPage,
            onPageChange: setCurrentPage
          }}
          actions={actions}
          emptyMessage="No users found. Start by adding your first customer!"
        />
      </div>

        {/* Enhanced User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {selectedUser.firstName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </h3>
                      <p className="text-red-100">User Profile Details</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      setSelectedUser(null);
                    }}
                    className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors duration-200"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="p-8 space-y-8">
                {/* User Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <EnvelopeIcon className="w-6 h-6 text-red-500" />
                        <h4 className="font-semibold text-gray-900">Email Address</h4>
                      </div>
                      <p className="text-gray-700 font-medium">{selectedUser.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        {selectedUser.isEmailVerified ? (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckBadgeIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-red-600">
                            <XMarkIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">Unverified</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {selectedUser.phone && (
                      <div className="bg-gray-50 rounded-2xl p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <PhoneIcon className="w-6 h-6 text-red-500" />
                          <h4 className="font-semibold text-gray-900">Phone Number</h4>
                        </div>
                        <p className="text-gray-700 font-medium">{selectedUser.phone}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          {selectedUser.isPhoneVerified ? (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckBadgeIcon className="w-4 h-4" />
                              <span className="text-sm font-medium">Verified</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-red-600">
                              <XMarkIcon className="w-4 h-4" />
                              <span className="text-sm font-medium">Unverified</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <ShieldCheckIcon className="w-6 h-6 text-red-500" />
                        <h4 className="font-semibold text-gray-900">User Role</h4>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getRoleBadge(selectedUser.role)}
                        <span className="text-sm text-gray-500">
                          {selectedUser.role === 'admin' ? 'Full Access' : 
                           selectedUser.role === 'staff' ? 'Limited Access' : 
                           selectedUser.role === 'monitor' ? 'View Only' : 'Customer Access'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <CalendarIcon className="w-6 h-6 text-red-500" />
                        <h4 className="font-semibold text-gray-900">Account Details</h4>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">User ID:</span> {selectedUser._id}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Joined:</span> {new Date(selectedUser.createdAt || '').toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Member for:</span> {Math.floor((Date.now() - new Date(selectedUser.createdAt || '').getTime()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      handleEditRole(selectedUser);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                  >
                    Edit Role
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Edit Role Modal */}
        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <ShieldCheckIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Edit User Role</h3>
                      <p className="text-red-100">Update user permissions and access level</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowRoleModal(false);
                      setSelectedUser(null);
                    }}
                    className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors duration-200"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="p-8">
                {/* User Info */}
                <div className="flex items-center space-x-4 mb-8 p-6 bg-gray-50 rounded-2xl">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {selectedUser.firstName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h4>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-sm text-gray-500">Current Role:</span>
                      {getRoleBadge(selectedUser.role)}
                    </div>
                  </div>
                </div>
                
                {/* Role Selection */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Select New Role</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { 
                          role: 'customer', 
                          title: 'Customer', 
                          description: 'Standard user with basic access to shopping and account features',
                          color: 'from-red-500 to-rose-500',
                          bgColor: 'bg-red-50',
                          borderColor: 'border-red-200'
                        },
                        { 
                          role: 'staff', 
                          title: 'Staff Member', 
                          description: 'Team member with access to order management and customer support',
                          color: 'from-blue-500 to-indigo-500',
                          bgColor: 'bg-blue-50',
                          borderColor: 'border-blue-200'
                        },
                        { 
                          role: 'monitor', 
                          title: 'Monitor', 
                          description: 'View-only access to dashboard, orders, products, and categories',
                          color: 'from-teal-500 to-cyan-500',
                          bgColor: 'bg-teal-50',
                          borderColor: 'border-teal-200'
                        },
                        { 
                          role: 'admin', 
                          title: 'Administrator', 
                          description: 'Full system access including user management and system settings',
                          color: 'from-purple-500 to-violet-500',
                          bgColor: 'bg-purple-50',
                          borderColor: 'border-purple-200'
                        }
                      ].map((roleOption) => {
                        const isLastAdmin = selectedUser.role === 'admin' && 
                                          roleOption.role !== 'admin' && 
                                          users.filter(u => u.role === 'admin').length === 1;
                        const isDisabled = actionLoading || 
                                          roleOption.role === selectedUser.role || 
                                          isLastAdmin;
                        
                        return (
                        <button
                          key={roleOption.role}
                          onClick={() => handleRoleUpdate(selectedUser._id, roleOption.role as 'admin' | 'staff' | 'monitor' | 'customer')}
                          disabled={isDisabled}
                          className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                            roleOption.role === selectedUser.role
                              ? `${roleOption.bgColor} ${roleOption.borderColor} border-2 shadow-lg`
                              : isLastAdmin
                              ? 'bg-gray-100 border-gray-300'
                              : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={isLastAdmin ? 'Cannot downgrade the last admin' : ''}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 bg-gradient-to-r ${roleOption.color} rounded-xl flex items-center justify-center shadow-lg`}>
                              <ShieldCheckIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h5 className="text-lg font-semibold text-gray-900">{roleOption.title}</h5>
                                {roleOption.role === selectedUser.role && (
                                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                                    Current
                                  </span>
                                )}
                                {selectedUser.role === 'admin' && roleOption.role !== 'admin' && adminDowngradeConfirmation === 'Yes I am sure' && (
                                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                                    Ready to Change
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm">{roleOption.description}</p>
                            </div>
                            {actionLoading && roleOption.role !== selectedUser.role && (
                              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            )}
                          </div>
                        </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Warning for Admin Role */}
                  {selectedUser.role !== 'admin' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                      <div className="flex items-start space-x-3">
                        <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 mt-0.5" />
                        <div>
                          <h5 className="font-semibold text-amber-800">Important Notice</h5>
                          <p className="text-sm text-amber-700 mt-1">
                            Changing user roles will immediately affect the user's access permissions. 
                            Please ensure this change is authorized and necessary.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Downgrade Confirmation */}
                  {selectedUser.role === 'admin' && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-red-800 mb-2">⚠️ Admin Role Downgrade Warning</h4>
                          {users.filter(u => u.role === 'admin').length === 1 ? (
                            <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4 mb-4">
                              <p className="text-sm font-semibold text-red-900 mb-2">
                                🚨 This is the last admin in the system!
                              </p>
                              <p className="text-sm text-red-800">
                                You cannot downgrade this user because at least one admin must remain in the system. 
                                Please create another admin account before downgrading this user.
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-red-700 mb-4">
                              You are about to downgrade an administrator. This will immediately remove their admin privileges and access to the admin panel.
                            </p>
                          )}
                          <div className="space-y-3">
                            <label className="block text-sm font-semibold text-red-800">
                              Type "Yes I am sure" to confirm this action:
                            </label>
                            <input
                              type="text"
                              value={adminDowngradeConfirmation}
                              onChange={(e) => setAdminDowngradeConfirmation(e.target.value)}
                              placeholder="Yes I am sure"
                              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 text-gray-900 bg-white transition-all duration-200 ${
                                adminDowngradeConfirmation === 'Yes I am sure' 
                                  ? 'border-green-500 focus:border-green-500' 
                                  : 'border-red-300 focus:border-red-500'
                              }`}
                            />
                            {adminDowngradeConfirmation === 'Yes I am sure' ? (
                              <div className="flex items-center space-x-2 text-green-600">
                                <CheckBadgeIcon className="w-4 h-4" />
                                <span className="text-sm font-medium">Confirmation accepted. You can now proceed with the role change.</span>
                              </div>
                            ) : (
                              <p className="text-xs text-red-600">
                                This action cannot be undone. The user will lose all admin privileges immediately.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowRoleModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Delete Confirmation Modal */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <TrashIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Delete User Account</h3>
                      <p className="text-red-100">This action cannot be undone</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedUser(null);
                    }}
                    className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors duration-200"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="p-8">
                {/* User Info */}
                <div className="flex items-center space-x-4 mb-8 p-6 bg-gray-50 rounded-2xl">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {selectedUser.firstName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h4>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-sm text-gray-500">Role:</span>
                      {getRoleBadge(selectedUser.role)}
                    </div>
                  </div>
                </div>
                
                {/* Warning Section */}
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-red-800 mb-2">Permanent Deletion Warning</h4>
                      <div className="space-y-2 text-sm text-red-700">
                        <p>• This action will permanently delete the user account</p>
                        <p>• All user data, orders, and history will be removed</p>
                        <p>• This action cannot be undone or reversed</p>
                        <p>• The user will lose access to all services immediately</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Confirmation Input */}
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-red-800 mb-2">⚠️ Final Confirmation Required</h4>
                      <p className="text-sm text-red-700 mb-4">
                        This action will permanently delete the user account and all associated data. This cannot be undone.
                      </p>
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-red-800">
                          Type "DELETE" to confirm this action:
                        </label>
                        <input
                          type="text"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="DELETE"
                          className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-all duration-200"
                        />
                        <p className="text-xs text-red-600">
                          This action is irreversible. All user data, orders, and history will be permanently removed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteUser}
                    disabled={actionLoading || deleteConfirmation !== 'DELETE'}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {actionLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <TrashIcon className="w-4 h-4" />
                        <span>Delete User</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
