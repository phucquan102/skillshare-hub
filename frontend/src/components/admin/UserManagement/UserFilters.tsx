import React from 'react';
import { UsersFilter } from '../../../types/user.types';

interface UserFiltersProps {
  filters: UsersFilter;
  onFilterChange: (filters: UsersFilter) => void;
  onResetFilters: () => void;
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
    <div className="user-filters flex flex-wrap gap-4 items-end mb-6">
      {/* Search */}
      <div className="filter-group">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700">
          Search
        </label>
        <input
          id="search"
          type="text"
          placeholder="Search by name or email..."
          value={filters.search || ''}
          onChange={handleSearchChange}
          className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#3a0ca3] focus:border-[#3a0ca3] sm:text-sm"
          aria-label="Search users"
        />
      </div>

      {/* Role */}
      <div className="filter-group">
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <select
          id="role"
          value={filters.role || ''}
          onChange={handleRoleChange}
          className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#3a0ca3] focus:border-[#3a0ca3] sm:text-sm"
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Administrator</option>
        </select>
      </div>

      {/* Status */}
      <div className="filter-group">
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          value={filters.isActive === undefined ? '' : filters.isActive ? 'active' : 'inactive'}
          onChange={handleStatusChange}
          className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#3a0ca3] focus:border-[#3a0ca3] sm:text-sm"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Verification */}
      <div className="filter-group">
        <label htmlFor="verification" className="block text-sm font-medium text-gray-700">
          Verification
        </label>
        <select
          id="verification"
          value={filters.isVerified === undefined ? '' : filters.isVerified ? 'verified' : 'unverified'}
          onChange={handleVerificationChange}
          className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#3a0ca3] focus:border-[#3a0ca3] sm:text-sm"
          aria-label="Filter by verification"
        >
          <option value="">All verifications</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      {/* Reset */}
      <div>
        <button
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          onClick={onResetFilters}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default UserFilters;
