
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  const getSubscriptionColor = (plan: string) => {
    switch (plan) {
      case 'standard':
        return 'bg-gray-200 text-gray-700';
      case 'vip':
        return 'bg-amber-200 text-amber-700';
      case 'pro':
        return 'bg-blue-200 text-blue-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  // الحصول على لون حالة الحساب
  const getAccountStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-200 text-green-700';
      case 'suspended':
        return 'bg-orange-200 text-orange-700';
      case 'expired':
        return 'bg-red-200 text-red-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (users.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/30 rounded-lg">
        <p className="text-muted-foreground">لا توجد نتائج مطابقة للبحث أو الفلتر المحدد</p>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>المستخدم</TableHead>
            <TableHead>البريد الإلكتروني</TableHead>
            <TableHead>الباقة</TableHead>
            <TableHead>حالة الحساب</TableHead>
            <TableHead>تاريخ الانتهاء</TableHead>
            <TableHead>معتمد</TableHead>
            <TableHead>تاريخ التسجيل</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={user.avatar_url || `https://avatar.iran.liara.run/public/${user.email}`} 
                    alt={user.full_name || user.email}
                  />
                  <AvatarFallback>{user.full_name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{user.full_name || 'بدون اسم'}</span>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getSubscriptionColor(user.subscription_plan || 'standard')}>
                  {getSubscriptionLabel(user.subscription_plan || 'standard')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getAccountStatusColor(user.account_status || 'active')}>
                  {getAccountStatusLabel(user.account_status || 'active')}
                </Badge>
              </TableCell>
              <TableCell>
                {user.subscription_end_date ? (
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    {formatDate(user.subscription_end_date)}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">غير محدد</span>
                )}
              </TableCell>
              <TableCell>
                {user.is_approved ? (
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    معتمد
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100 text-red-700">
                    <XCircle className="h-3 w-3 mr-1" />
                    غير معتمد
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CalendarIcon className="h-3 w-3" />
                  {user.created_at ? formatDate(user.created_at) : 'غير متوفر'}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => onEdit(user)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    تعديل
                  </Button>
                  
                  {user.is_approved ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => onReject(user.id)}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      إلغاء الاعتماد
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => onApprove(user.id)}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      اعتماد
                    </Button>
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
