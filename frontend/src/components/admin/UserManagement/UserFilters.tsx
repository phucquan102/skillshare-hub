import React from 'react';
import { UsersFilter } from '../../../types/user.types';
import { Search, Filter, RotateCcw } from 'lucide-react';

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
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Filter Users</h3>
            <p className="text-sm text-gray-600">Refine your user search</p>
          </div>
        </div>
        <button
          onClick={onResetFilters}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all duration-200"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Users
          </label>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors duration-200" />
            <input
              id="search"
              type="text"
              placeholder="Search by name, email, or ID..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              aria-label="Search users"
            />
          </div>
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            User Role
          </label>
          <select
            id="role"
            value={filters.role || ''}
            onChange={handleRoleChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Account Status
          </label>
          <select
            id="status"
            value={filters.isActive === undefined ? '' : filters.isActive ? 'active' : 'inactive'}
            onChange={handleStatusChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Verification */}
        <div>
          <label htmlFor="verification" className="block text-sm font-medium text-gray-700 mb-2">
            Verification Status
          </label>
          <select
            id="verification"
            value={filters.isVerified === undefined ? '' : filters.isVerified ? 'verified' : 'unverified'}
            onChange={handleVerificationChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
          >
            <option value="">All Users</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default UserFilters;