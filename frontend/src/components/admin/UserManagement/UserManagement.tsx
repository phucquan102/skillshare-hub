import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { User, UsersFilter } from '../../../types/user.types';
import { adminService } from '../../../services/api/adminService';
import UserTable from './UserTable';
import UserFilters from './UserFilters';
import UserStats from './UserStats';
import styles from './UserManagement.module.scss';

// Cache với expiry
const cache = new Map<string, { data: User[]; timestamp: number; pagination: any }>();
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
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [stats, setStats] = useState<any>(null);

  // Tính toán hasNextPage và hasPrevPage dựa trên currentPage và totalPages
  const calculatePaginationFlags = (currentPage: number, totalPages: number) => {
    return {
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  };

  // Fetch users với cache + expiry
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
      // Clear cache khi có thay đổi user
      cache.clear();
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
        // Clear cache khi có thay đổi user
        cache.clear();
        fetchUsers(filters);
        fetchStats();
      } catch (err: any) {
        setError(err.message || 'Error deleting user');
      }
    }
  };

  // Render phân trang với các nút trang
  const renderPaginationButtons = () => {
    const buttons = [];
    const currentPage = pagination.currentPage;
    const totalPages = pagination.totalPages;

    // Hiển thị tối đa 5 trang xung quanh trang hiện tại
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    // Điều chỉnh để luôn hiển thị 5 nút nếu có đủ
    if (endPage - startPage < 4) {
      if (currentPage < 3) {
        endPage = Math.min(totalPages, 5);
      } else {
        startPage = Math.max(1, totalPages - 4);
      }
    }

    // Nút Previous
    buttons.push(
      <button
        key="prev"
        disabled={!pagination.hasPrevPage}
        onClick={() => handlePageChange(currentPage - 1)}
        className={`${styles.paginationButton} ${!pagination.hasPrevPage ? styles.disabled : ''}`}
      >
        Previous
      </button>
    );

    // Nút trang đầu tiên
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className={styles.paginationButton}
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="ellipsis1" className={styles.paginationEllipsis}>...</span>);
      }
    }

    // Các nút trang
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`${styles.paginationButton} ${
            i === currentPage ? styles.active : ''
          }`}
        >
          {i}
        </button>
      );
    }

    // Nút trang cuối cùng
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="ellipsis2" className={styles.paginationEllipsis}>...</span>);
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={styles.paginationButton}
        >
          {totalPages}
        </button>
      );
    }

    // Nút Next
    buttons.push(
      <button
        key="next"
        disabled={!pagination.hasNextPage}
        onClick={() => handlePageChange(currentPage + 1)}
        className={`${styles.paginationButton} ${!pagination.hasNextPage ? styles.disabled : ''}`}
      >
        Next
      </button>
    );

    return buttons;
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
          <button onClick={() => setError(null)} className={styles.closeButton}>
            Close
          </button>
        </div>
      )}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Loading users...</span>
        </div>
      )}

      <UserTable
        users={users}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
        loading={loading}
      />

      {/* Phân trang */}
      {!loading && users.length > 0 && (
        <div className={styles.paginationContainer}>
          <div className={styles.paginationInfo}>
            Showing {((filters.page || 1) - 1) * (filters.limit || 10) + 1} -{' '}
            {Math.min((filters.page || 1) * (filters.limit || 10), pagination.total)} of {pagination.total} users
            {filters.search && ' (filtered)'}
          </div>
          <div className={styles.pagination}>
            {renderPaginationButtons()}
          </div>
        </div>
      )}

      {!loading && users.length === 0 && (
        <div className={styles.noUsers}>
          No users found
          {filters.search && ' matching your search criteria'}
        </div>
      )}
    </div>
  );
};

export default UserManagement;