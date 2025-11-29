import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { User, UsersFilter } from '../../../types/user.types';
import { adminService } from '../../../services/api/adminService';
import UserTable from './UserTable';
import UserFilters from './UserFilters';
import UserStats from './UserStats';

// Cache với expiry
const cache = new Map<string, { data: User[]; timestamp: number; pagination: any }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UsersFilter>({
    page: 1,
    limit: 10,
    search: '',
    role: '',
    isActive: undefined,
    isVerified: undefined,
  });
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    total: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [stats, setStats] = useState<any>(null);

  // Calculate pagination flags
  const calculatePaginationFlags = (currentPage: number, totalPages: number) => {
    return {
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  };

  // Fetch users with cache + expiry
  const fetchUsers = async (currentFilters: UsersFilter) => {
    try {
      const key = JSON.stringify(currentFilters);
      const cached = cache.get(key);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setUsers(cached.data);
        setPagination(cached.pagination);
        return;
      }

      setLoading(true);
      setError(null);
      
      const response = await adminService.getUsers(currentFilters);
      
      if (response && response.users) {
        const currentPage = response.currentPage || currentFilters.page || 1;
        const totalPages = response.totalPages || 1;
        const paginationFlags = calculatePaginationFlags(currentPage, totalPages);

        setUsers(response.users);
        setPagination({
          totalPages: totalPages,
          currentPage: currentPage,
          total: response.total || 0,
          hasNextPage: paginationFlags.hasNextPage,
          hasPrevPage: paginationFlags.hasPrevPage,
        });

        cache.set(key, { 
          data: response.users, 
          timestamp: Date.now(),
          pagination: {
            totalPages: totalPages,
            currentPage: currentPage,
            total: response.total || 0,
            hasNextPage: paginationFlags.hasNextPage,
            hasPrevPage: paginationFlags.hasPrevPage,
          }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error while fetching users');
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch
  const debouncedFetch = useCallback(
    debounce((currentFilters: UsersFilter) => {
      fetchUsers(currentFilters);
    }, 400),
    []
  );

  useEffect(() => {
    debouncedFetch(filters);
    return () => {
      debouncedFetch.cancel();
    };
  }, [filters, debouncedFetch]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const statsData = await adminService.getUsersStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleFilterChange = (newFilters: Partial<UsersFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleResetFilters = () => {
    const resetFilters = {
      page: 1,
      limit: 10,
      search: '',
      role: '',
      isActive: undefined,
      isVerified: undefined,
    };
    setFilters(resetFilters);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page }));
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      await adminService.updateUser(userId, updates);
      // Clear cache when user changes
      cache.clear();
      fetchUsers(filters);
      fetchStats();
    } catch (err: any) {
      setError(err.message || 'Error updating user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await adminService.deleteUser(userId);
        // Clear cache when user changes
        cache.clear();
        fetchUsers(filters);
        fetchStats();
      } catch (err: any) {
        setError(err.message || 'Error deleting user');
      }
    }
  };

  // Render pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const currentPage = pagination.currentPage;
    const totalPages = pagination.totalPages;

    // Show max 5 pages around current page
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    // Adjust to always show 5 buttons if possible
    if (endPage - startPage < 4) {
      if (currentPage < 3) {
        endPage = Math.min(totalPages, 5);
      } else {
        startPage = Math.max(1, totalPages - 4);
      }
    }

    // Previous button
    buttons.push(
      <button
        key="prev"
        disabled={!pagination.hasPrevPage}
        onClick={() => handlePageChange(currentPage - 1)}
        className={`px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium transition-all duration-200 ${
          !pagination.hasPrevPage 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-white text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'
        }`}
      >
        Previous
      </button>
    );

    // First page button
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all duration-200"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="ellipsis1" className="px-2 py-2 text-gray-500">...</span>);
      }
    }

    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
            i === currentPage 
              ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-emerald-500 shadow-lg' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'
          }`}
        >
          {i}
        </button>
      );
    }

    // Last page button
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="ellipsis2" className="px-2 py-2 text-gray-500">...</span>);
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all duration-200"
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    buttons.push(
      <button
        key="next"
        disabled={!pagination.hasNextPage}
        onClick={() => handlePageChange(currentPage + 1)}
        className={`px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium transition-all duration-200 ${
          !pagination.hasNextPage 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-white text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'
        }`}
      >
        Next
      </button>
    );

    return buttons;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent mb-2">
            User Management
          </h1>
          <p className="text-gray-600 text-lg">
            Manage platform users, roles, and permissions
          </p>
        </div>

        {/* Statistics */}
        {stats && <UserStats stats={stats} />}

        {/* Filters */}
        <UserFilters 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          onResetFilters={handleResetFilters} 
        />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-500 text-sm">!</span>
              </div>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-red-500 hover:text-red-700 font-medium text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-emerald-200 rounded-full animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <span className="text-gray-600 font-medium">Loading users...</span>
            </div>
          </div>
        )}

        {/* User Table */}
        {!loading && <UserTable
          users={users}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          loading={loading}
        />}

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 p-6 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20">
            <div className="text-sm text-gray-600">
              Showing {((filters.page || 1) - 1) * (filters.limit || 10) + 1} -{' '}
              {Math.min((filters.page || 1) * (filters.limit || 10), pagination.total)} of {pagination.total} users
              {filters.search && ' (filtered results)'}
            </div>
            <div className="flex items-center gap-2">
              {renderPaginationButtons()}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && users.length === 0 && !error && (
          <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl">
            <div className="w-24 h-24 bg-gradient-to-r from-emerald-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600 mb-6">
              {filters.search || filters.role || filters.isActive !== undefined || filters.isVerified !== undefined
                ? 'Try adjusting your search criteria or filters'
                : 'There are no users in the system yet'
              }
            </p>
            {(filters.search || filters.role || filters.isActive !== undefined || filters.isVerified !== undefined) && (
              <button
                onClick={handleResetFilters}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;