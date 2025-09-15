import React from 'react';
import { UsersFilter } from '../../../types/user.types';

interface UserFiltersProps {
  filters: UsersFilter;
  onFilterChange: (filters: UsersFilter) => void;
  onResetFilters: () => void; // New prop for resetting filters
}

const UserFilters: React.FC<UserFiltersProps> = ({ filters, onFilterChange, onResetFilters }) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, role: e.target.value || undefined });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    let isActive;
    if (value === 'active') isActive = true;
    else if (value === 'inactive') isActive = false;
    else isActive = undefined;
    onFilterChange({ ...filters, isActive });
  };

  const handleVerificationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    let isVerified;
    if (value === 'verified') isVerified = true;
    else if (value === 'unverified') isVerified = false;
    else isVerified = undefined;
    onFilterChange({ ...filters, isVerified });
  };

  return (
    <div className="user-filters">
      <div className="filter-group search-group">
        <label htmlFor="search">Tìm kiếm</label>
        <input
          id="search"
          type="text"
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={filters.search || ''}
          onChange={handleSearchChange}
          className="search-input"
          aria-label="Tìm kiếm người dùng"
        />
      </div>

      <div className="filter-group">
        <label htmlFor="role">Vai trò</label>
        <select id="role" value={filters.role || ''} onChange={handleRoleChange} aria-label="Lọc theo vai trò">
          <option value="">Tất cả vai trò</option>
          <option value="student">Học viên</option>
          <option value="instructor">Giảng viên</option>
          <option value="admin">Quản trị viên</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="status">Trạng thái</label>
        <select
          id="status"
          value={filters.isActive === undefined ? '' : filters.isActive ? 'active' : 'inactive'}
          onChange={handleStatusChange}
          aria-label="Lọc theo trạng thái"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Đã khóa</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="verification">Xác thực</label>
        <select
          id="verification"
          value={filters.isVerified === undefined ? '' : filters.isVerified ? 'verified' : 'unverified'}
          onChange={handleVerificationChange}
          aria-label="Lọc theo trạng thái xác thực"
        >
          <option value="">Tất cả xác thực</option>
          <option value="verified">Đã xác thực</option>
          <option value="unverified">Chưa xác thực</option>
        </select>
      </div>

      <button className="reset-button" onClick={onResetFilters}>
        Đặt lại
      </button>
    </div>
  );
};

export default UserFilters;