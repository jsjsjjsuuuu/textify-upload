
import { useState } from 'react';
import { UserProfile } from '@/types/UserProfile';

export const useUserFilters = (users: UserProfile[]) => {
  const [activeTab, setActiveTab] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // تصفية المستخدمين حسب الحالة
  const filterUsersByTab = (users: UserProfile[]) => {
    switch (activeTab) {
      case 'pending':
        return users.filter(user => !user.is_approved);
      case 'approved':
        return users.filter(user => user.is_approved);
      case 'all':
      default:
        return users;
    }
  };

  // تصفية المستخدمين حسب نوع الباقة
  const filterUsersByPlan = (users: UserProfile[]) => {
    if (filterPlan === 'all') return users;
    return users.filter(user => user.subscription_plan === filterPlan);
  };

  // تصفية المستخدمين حسب حالة الحساب
  const filterUsersByStatus = (users: UserProfile[]) => {
    if (filterStatus === 'all') return users;
    return users.filter(user => user.account_status === filterStatus);
  };

  // البحث عن المستخدمين
  const searchUsers = (users: UserProfile[]) => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase().trim();
    return users.filter(user => 
      (user.full_name && user.full_name.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query))
    );
  };

  // تطبيق جميع الفلاتر
  const getFilteredUsers = () => {
    let filteredUsers = [...users];
    filteredUsers = filterUsersByTab(filteredUsers);
    filteredUsers = filterUsersByPlan(filteredUsers);
    filteredUsers = filterUsersByStatus(filteredUsers);
    filteredUsers = searchUsers(filteredUsers);
    return filteredUsers;
  };

  // عدد المستخدمين في كل فئة
  const getUserCounts = () => {
    return {
      total: users.length,
      pending: users.filter(u => !u.is_approved).length,
      approved: users.filter(u => u.is_approved).length
    };
  };

  return {
    activeTab,
    filterPlan,
    filterStatus,
    searchQuery,
    setActiveTab,
    setFilterPlan,
    setFilterStatus,
    setSearchQuery,
    getFilteredUsers,
    getUserCounts
  };
};
