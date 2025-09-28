import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { User, UsersFilter } from '../../../types/user.types';
import { adminService } from '../../../services/api/adminService';
import UserTable from './UserTable';
import UserFilters from './UserFilters';
import UserStats from './UserStats';
import styles from './UserManagement.module.scss';

// Cache với expiry
const cache = new Map<string, { data: User[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

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
  });
  const [stats, setStats] = useState<any>(null);

  // Fetch users với cache + expiry
  const fetchUsers = async (currentFilters: UsersFilter) => {
    try {
      const key = JSON.stringify(currentFilters);
      const cached = cache.get(key);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setUsers(cached.data);
        return;
      }

      setLoading(true);
      const response = await adminService.getUsers(currentFilters);
      setUsers(response.users);
      setPagination({
        totalPages: response.totalPages,
        currentPage: response.currentPage,
        total: response.total,
      });

      cache.set(key, { data: response.users, timestamp: Date.now() });
    } catch (err: any) {
      setError(err.message || 'Error while fetching users');
    } finally {
      setLoading(false);
    }
  };

  // debounce fetch
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

  // Fetch stats (không cần cache vì số liệu luôn thay đổi)
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

  const handleFilterChange = (newFilters: UsersFilter) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      role: '',
      isActive: undefined,
      isVerified: undefined,
    });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      await adminService.updateUser(userId, updates);
      fetchUsers(filters);
      fetchStats();
    } catch (err: any) {
      setError(err.message || 'Error updating user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminService.deleteUser(userId);
        fetchUsers(filters);
        fetchStats();
      } catch (err: any) {
        setError(err.message || 'Error deleting user');
      }
    }
  };

  return (
    <div className={styles.userManagement}>
      <h1>User Management</h1>

      {stats && <UserStats stats={stats} />}

      <UserFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        onResetFilters={handleResetFilters} 
      />

      {error && (
        <div className={styles.errorMessage}>
          <span>{error}</span>
          <button onClick={() => setError(null)}>Close</button>
        </div>
      )}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Loading...</span>
        </div>
      )}

      <UserTable
        users={users}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
        loading={loading}
      />

      <div className={styles.pagination}>
        <button
          disabled={filters.page === 1}
          onClick={() => handlePageChange(filters.page! - 1)}
          className={styles.paginationButton}
        >
          Prev
        </button>
        <span>
          Page {filters.page} / {pagination.totalPages}
        </span>
        <button
          disabled={filters.page === pagination.totalPages}
          onClick={() => handlePageChange(filters.page! + 1)}
          className={styles.paginationButton}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default UserManagement;
