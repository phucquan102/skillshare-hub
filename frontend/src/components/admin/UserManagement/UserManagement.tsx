import React, { useState, useEffect } from 'react';
import { User, UsersFilter } from '../../../types/user.types';
import { adminService } from '../../../services/api/adminService';
import UserTable from './UserTable';
import UserFilters from './UserFilters';
import UserStats from './UserStats';
import styles from './UserManagement.module.scss';

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

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers(filters);
      setUsers(response.users);
      setPagination({
        totalPages: response.totalPages,
        currentPage: response.currentPage,
        total: response.total,
      });
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await adminService.getUsersStats();
      setStats(statsData);
    } catch (err) {
      console.error('Lỗi khi tải thống kê:', err);
    }
  };

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
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật người dùng');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await adminService.deleteUser(userId);
        fetchUsers();
        fetchStats();
      } catch (err: any) {
        setError(err.message || 'Lỗi khi xóa người dùng');
      }
    }
  };

  return (
    <div className={styles.userManagement}>
      <h1>Quản lý Người dùng</h1>

      {stats && <UserStats stats={stats} />}

      <UserFilters filters={filters} onFilterChange={handleFilterChange} onResetFilters={handleResetFilters} />

      {error && (
        <div className={styles.errorMessage}>
          <span>{error}</span>
          <button onClick={() => setError(null)}>Đóng</button>
        </div>
      )}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Đang tải...</span>
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
          Trước
        </button>
        <span>
          Trang {filters.page} / {pagination.totalPages}
        </span>
        <button
          disabled={filters.page === pagination.totalPages}
          onClick={() => handlePageChange(filters.page! + 1)}
          className={styles.paginationButton}
        >
          Sau
        </button>
      </div>
    </div>
  );
};

export default UserManagement;