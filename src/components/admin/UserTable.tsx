
import React from 'react';
import { Edit, UserX, UserCheck, CalendarIcon, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

import { UserProfile } from '@/types/UserProfile';

interface UserTableProps {
  users: UserProfile[];
  isLoading: boolean;
  onEdit: (user: UserProfile) => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  onEdit,
  onApprove,
  onReject
}) => {
  // تنسيق التاريخ بالعربية
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP', { locale: arSA });
    } catch (error) {
      return 'تاريخ غير صالح';
    }
  };

  // ترجمة نوع الباقة
  const getSubscriptionLabel = (plan: string) => {
    switch (plan) {
      case 'standard':
        return 'الباقة العادية';
      case 'vip':
        return 'الباقة VIP';
      case 'pro':
        return 'الباقة المتميزة PRO';
      default:
        return 'غير معروف';
    }
  };

  // ترجمة حالة الحساب
  const getAccountStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'suspended':
        return 'موقوف';
      case 'expired':
        return 'منتهي';
      default:
        return 'غير معروف';
    }
  };

  // الحصول على لون الباقة
  const getSubscriptionBadgeClass = (plan: string) => {
    switch (plan) {
      case 'standard':
        return 'admin-badge-blue';
      case 'vip':
        return 'admin-badge-yellow';
      case 'pro':
        return 'admin-badge-purple';
      default:
        return 'admin-badge-blue';
    }
  };

  // الحصول على لون حالة الحساب
  const getAccountStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'admin-badge-green';
      case 'suspended':
        return 'admin-badge-yellow';
      case 'expired':
        return 'admin-badge-red';
      default:
        return 'admin-badge-blue';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (users.length === 0) {
    return (
      <div className="text-center py-20 bg-[#1a2544]/30 rounded-xl border border-[#2a325a]/20">
        <p className="text-blue-200/70 text-lg">لا توجد نتائج مطابقة للبحث أو الفلتر المحدد</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="admin-table">
        <thead className="admin-table-header">
          <tr>
            <th>المستخدم</th>
            <th>البريد الإلكتروني</th>
            <th>الباقة</th>
            <th>حالة الحساب</th>
            <th>تاريخ الانتهاء</th>
            <th>معتمد</th>
            <th>تاريخ التسجيل</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="admin-table-row">
              <td className="admin-table-cell">
                <div className="flex items-center gap-4">
                  <div className="admin-avatar">
                    {user.full_name ? (
                      <span>{user.full_name.charAt(0)}</span>
                    ) : (
                      <span>{user.email.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-lg font-medium">{user.full_name || 'بدون اسم'}</span>
                </div>
              </td>
              <td className="admin-table-cell">{user.email}</td>
              <td className="admin-table-cell">
                <span className={`admin-badge ${getSubscriptionBadgeClass(user.subscription_plan || 'standard')}`}>
                  {getSubscriptionLabel(user.subscription_plan || 'standard')}
                </span>
              </td>
              <td className="admin-table-cell">
                <span className={`admin-badge ${getAccountStatusBadgeClass(user.account_status || 'active')}`}>
                  {getAccountStatusLabel(user.account_status || 'active')}
                </span>
              </td>
              <td className="admin-table-cell">
                {user.subscription_end_date ? (
                  <div className="flex items-center gap-2 text-base text-blue-200/70">
                    <Clock className="h-4 w-4" />
                    {formatDate(user.subscription_end_date)}
                  </div>
                ) : (
                  <span className="text-base text-blue-200/50">غير محدد</span>
                )}
              </td>
              <td className="admin-table-cell">
                {user.is_approved ? (
                  <span className="admin-badge admin-badge-green">
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    معتمد
                  </span>
                ) : (
                  <span className="admin-badge admin-badge-red">
                    <XCircle className="h-4 w-4 mr-1.5" />
                    غير معتمد
                  </span>
                )}
              </td>
              <td className="admin-table-cell">
                <div className="flex items-center gap-2 text-base text-blue-200/70">
                  <CalendarIcon className="h-4 w-4" />
                  {user.created_at ? formatDate(user.created_at) : 'غير متوفر'}
                </div>
              </td>
              <td className="admin-table-cell">
                <div className="flex items-center gap-3">
                  <button 
                    className="admin-button admin-button-icon admin-button-outline"
                    onClick={() => onEdit(user)}
                  >
                    <Edit className="h-4 w-4" />
                    <span>تعديل</span>
                  </button>
                  
                  {user.is_approved ? (
                    <button 
                      className="admin-button admin-button-icon admin-button-danger"
                      onClick={() => onReject(user.id)}
                    >
                      <UserX className="h-4 w-4" />
                      <span>إلغاء الاعتماد</span>
                    </button>
                  ) : (
                    <button 
                      className="admin-button admin-button-icon admin-button-success"
                      onClick={() => onApprove(user.id)}
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>اعتماد</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
