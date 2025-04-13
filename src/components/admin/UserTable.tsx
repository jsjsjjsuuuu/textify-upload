
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
      return format(new Date(dateString), 'MMM dd, yyyy', { locale: arSA });
    } catch (error) {
      return 'تاريخ غير صالح';
    }
  };

  // الحصول على بادج الباقة
  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'standard':
        return (
          <span className="bg-blue-500/20 text-blue-300 text-xs py-1 px-3 rounded-md">
            الباقة العادية
          </span>
        );
      case 'vip':
        return (
          <span className="bg-amber-500/20 text-amber-300 text-xs py-1 px-3 rounded-md">
            الباقة VIP
          </span>
        );
      case 'pro':
        return (
          <span className="bg-purple-500/20 text-purple-300 text-xs py-1 px-3 rounded-md">
            الباقة المتميزة PRO
          </span>
        );
      default:
        return (
          <span className="bg-blue-500/20 text-blue-300 text-xs py-1 px-3 rounded-md">
            الباقة العادية
          </span>
        );
    }
  };

  // الحصول على بادج حالة الحساب
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="bg-emerald-500/20 text-emerald-300 text-xs py-1 px-3 rounded-md">نشط</span>;
      case 'suspended':
        return <span className="bg-amber-500/20 text-amber-300 text-xs py-1 px-3 rounded-md">موقوف</span>;
      case 'expired':
        return <span className="bg-red-500/20 text-red-300 text-xs py-1 px-3 rounded-md">منتهي</span>;
      default:
        return <span className="bg-emerald-500/20 text-emerald-300 text-xs py-1 px-3 rounded-md">نشط</span>;
    }
  };

  // الحصول على دائرة الأحرف الأولى للمستخدم
  const getUserAvatar = (name: string, email: string) => {
    const initial = name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();
    return (
      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-medium ${initial.toUpperCase().charCodeAt(0) % 5 === 0 ? 'bg-blue-500' : initial.toUpperCase().charCodeAt(0) % 3 === 0 ? 'bg-purple-500' : 'bg-indigo-500'}`}>
        {initial}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (users.length === 0) {
    return (
      <div className="text-center py-12 bg-[#131b31]/30 rounded-md">
        <p className="text-blue-200/70 text-sm">لا توجد نتائج مطابقة للبحث</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-[#131b31]/80 text-right">
          <tr>
            <th className="py-3 px-4 text-xs font-medium text-white/70 border-b border-[#1e2a47]/20">المستخدم</th>
            <th className="py-3 px-4 text-xs font-medium text-white/70 border-b border-[#1e2a47]/20">البريد الإلكتروني</th>
            <th className="py-3 px-4 text-xs font-medium text-white/70 border-b border-[#1e2a47]/20">الباقة</th>
            <th className="py-3 px-4 text-xs font-medium text-white/70 border-b border-[#1e2a47]/20">حالة الحساب</th>
            <th className="py-3 px-4 text-xs font-medium text-white/70 border-b border-[#1e2a47]/20">تاريخ الانتهاء</th>
            <th className="py-3 px-4 text-xs font-medium text-white/70 border-b border-[#1e2a47]/20">معتمد</th>
            <th className="py-3 px-4 text-xs font-medium text-white/70 border-b border-[#1e2a47]/20">تاريخ التسجيل</th>
            <th className="py-3 px-4 text-xs font-medium text-white/70 border-b border-[#1e2a47]/20">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-[#1e2a47]/20 hover:bg-[#131b31]/30">
              <td className="py-3 px-4 text-sm">
                <div className="flex items-center gap-3">
                  {getUserAvatar(user.full_name || '', user.email)}
                  <span className="text-sm font-medium text-white">{user.full_name || 'بدون اسم'}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-xs text-white/80">{user.email}</td>
              <td className="py-3 px-4">
                {getPlanBadge(user.subscription_plan || 'standard')}
              </td>
              <td className="py-3 px-4">
                {getStatusBadge(user.account_status || 'active')}
              </td>
              <td className="py-3 px-4 text-xs text-white/70">
                {user.subscription_end_date ? (
                  formatDate(user.subscription_end_date)
                ) : (
                  <span className="text-white/50">غير محدد</span>
                )}
              </td>
              <td className="py-3 px-4">
                {user.is_approved ? (
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs py-1 px-2 rounded-md inline-flex items-center">
                    <CheckCircle className="h-3 w-3 ml-1" />
                    معتمد
                  </span>
                ) : (
                  <span className="bg-red-500/20 text-red-300 text-xs py-1 px-2 rounded-md inline-flex items-center">
                    <XCircle className="h-3 w-3 ml-1" />
                    غير معتمد
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-xs text-white/70">
                {user.created_at ? formatDate(user.created_at) : 'غير متوفر'}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <button 
                    className="bg-[#131b31]/80 hover:bg-[#1a253f] text-white/80 text-xs py-1 px-3 rounded-md inline-flex items-center"
                    onClick={() => onEdit(user)}
                  >
                    <Edit className="h-3 w-3 ml-1" />
                    تعديل
                  </button>
                  
                  {user.is_approved ? (
                    <button 
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs py-1 px-3 rounded-md inline-flex items-center"
                      onClick={() => onReject(user.id)}
                    >
                      <UserX className="h-3 w-3 ml-1" />
                      إلغاء
                    </button>
                  ) : (
                    <button 
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs py-1 px-3 rounded-md inline-flex items-center"
                      onClick={() => onApprove(user.id)}
                    >
                      <UserCheck className="h-3 w-3 ml-1" />
                      اعتماد
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
