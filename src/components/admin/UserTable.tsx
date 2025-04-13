
import React from 'react';
import { Edit, UserX, UserCheck, CalendarIcon, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

import { UserProfile } from '@/types/UserProfile';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

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
          <span className="bg-blue-500/20 text-blue-300 py-1.5 px-4 rounded-md inline-block min-w-[100px] text-center">
            الباقة العادية
          </span>
        );
      case 'vip':
        return (
          <span className="bg-amber-500/20 text-amber-300 py-1.5 px-4 rounded-md inline-block min-w-[100px] text-center">
            الباقة VIP
          </span>
        );
      case 'pro':
        return (
          <span className="bg-purple-500/20 text-purple-300 py-1.5 px-4 rounded-md inline-block min-w-[100px] text-center">
            الباقة المتميزة PRO
          </span>
        );
      default:
        return (
          <span className="bg-blue-500/20 text-blue-300 py-1.5 px-4 rounded-md inline-block min-w-[100px] text-center">
            الباقة العادية
          </span>
        );
    }
  };

  // الحصول على بادج حالة الحساب
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="bg-emerald-500/20 text-emerald-300 py-1.5 px-4 rounded-md inline-block min-w-[80px] text-center">نشط</span>;
      case 'suspended':
        return <span className="bg-amber-500/20 text-amber-300 py-1.5 px-4 rounded-md inline-block min-w-[80px] text-center">موقوف</span>;
      case 'expired':
        return <span className="bg-red-500/20 text-red-300 py-1.5 px-4 rounded-md inline-block min-w-[80px] text-center">منتهي</span>;
      default:
        return <span className="bg-emerald-500/20 text-emerald-300 py-1.5 px-4 rounded-md inline-block min-w-[80px] text-center">نشط</span>;
    }
  };

  // الحصول على بادج الاعتماد
  const getApprovalBadge = (isApproved: boolean) => {
    if (isApproved) {
      return (
        <span className="bg-emerald-500/20 text-emerald-300 py-1.5 px-4 rounded-md inline-flex items-center justify-center min-w-[80px]">
          <CheckCircle className="h-4 w-4 ml-1.5" />
          معتمد
        </span>
      );
    } else {
      return (
        <span className="bg-red-500/20 text-red-300 py-1.5 px-4 rounded-md inline-flex items-center justify-center min-w-[80px]">
          <XCircle className="h-4 w-4 ml-1.5" />
          غير معتمد
        </span>
      );
    }
  };

  // الحصول على دائرة الأحرف الأولى للمستخدم
  const getUserAvatar = (name: string, email: string) => {
    const initial = name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();
    return (
      <div className={`h-11 w-11 rounded-full flex items-center justify-center text-white text-base font-medium ${initial.toUpperCase().charCodeAt(0) % 5 === 0 ? 'bg-blue-500' : initial.toUpperCase().charCodeAt(0) % 3 === 0 ? 'bg-purple-500' : 'bg-indigo-500'}`}>
        {initial}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (users.length === 0) {
    return (
      <div className="text-center py-16 bg-[#0e1834]/30 rounded-xl">
        <p className="text-blue-200/70 text-sm">لا توجد نتائج مطابقة للبحث</p>
      </div>
    );
  }
  
  return (
    <div className="rounded-xl overflow-hidden">
      <Table className="w-full border-collapse admin-data-table">
        <TableHeader className="bg-[#0a0f1d] text-right">
          <TableRow>
            <TableHead className="table-header-cell">المستخدم</TableHead>
            <TableHead className="table-header-cell">البريد الإلكتروني</TableHead>
            <TableHead className="table-header-cell">الباقة</TableHead>
            <TableHead className="table-header-cell">حالة الحساب</TableHead>
            <TableHead className="table-header-cell">تاريخ الانتهاء</TableHead>
            <TableHead className="table-header-cell">معتمد</TableHead>
            <TableHead className="table-header-cell">تاريخ التسجيل</TableHead>
            <TableHead className="table-header-cell">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="table-row-style">
              <TableCell className="table-cell-style">
                <div className="flex items-center gap-3">
                  {getUserAvatar(user.full_name || '', user.email)}
                  <span className="text-base font-medium text-white">{user.full_name || 'بدون اسم'}</span>
                </div>
              </TableCell>
              <TableCell className="table-cell-style text-sm text-white/90">{user.email}</TableCell>
              <TableCell className="table-cell-style">
                {getPlanBadge(user.subscription_plan || 'standard')}
              </TableCell>
              <TableCell className="table-cell-style">
                {getStatusBadge(user.account_status || 'active')}
              </TableCell>
              <TableCell className="table-cell-style text-sm text-white/80">
                {user.subscription_end_date ? (
                  formatDate(user.subscription_end_date)
                ) : (
                  <span className="text-white/50">غير محدد</span>
                )}
              </TableCell>
              <TableCell className="table-cell-style">
                {getApprovalBadge(user.is_approved || false)}
              </TableCell>
              <TableCell className="table-cell-style text-sm text-white/80">
                {user.created_at ? formatDate(user.created_at) : 'غير متوفر'}
              </TableCell>
              <TableCell className="table-cell-style">
                <div className="flex items-center gap-2">
                  <button 
                    className="bg-[#1a253f] hover:bg-[#273353] text-white/90 py-1.5 px-4 rounded-md inline-flex items-center"
                    onClick={() => onEdit(user)}
                  >
                    <Edit className="h-4 w-4 ml-1.5" />
                    تعديل
                  </button>
                  
                  {user.is_approved ? (
                    <button 
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-300 py-1.5 px-4 rounded-md inline-flex items-center"
                      onClick={() => onReject(user.id)}
                    >
                      <UserX className="h-4 w-4 ml-1.5" />
                      إلغاء
                    </button>
                  ) : (
                    <button 
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 py-1.5 px-4 rounded-md inline-flex items-center"
                      onClick={() => onApprove(user.id)}
                    >
                      <UserCheck className="h-4 w-4 ml-1.5" />
                      اعتماد
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserTable;
