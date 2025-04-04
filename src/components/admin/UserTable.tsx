
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, UserX, UserCheck, CalendarIcon, CheckCircle, XCircle, Mail, Phone, MapPin, FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import PasswordResetPopover from './PasswordResetPopover';
import { UserProfile } from '@/types/UserProfile';

interface UserTableProps {
  users: UserProfile[];
  detailedUsers?: {[key: string]: UserProfile};
  isLoading: boolean;
  isLoadingDetails?: {[key: string]: boolean};
  onEdit: (user: UserProfile) => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  onFetchDetails?: (userId: string) => Promise<UserProfile | null>;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  detailedUsers = {},
  isLoading,
  isLoadingDetails = {},
  onEdit,
  onApprove,
  onReject,
  onFetchDetails
}) => {
  // حالة لتتبع الصفوف المفتوحة
  const [expandedRows, setExpandedRows] = useState<{[key: string]: boolean}>({});
  
  // تنسيق التاريخ بالعربية
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'غير متوفر';
    
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
  
  // تنسيق البريد الإلكتروني
  const formatEmail = (email: string | undefined) => {
    if (!email) return 'البريد غير متوفر';
    if (email.trim() === '') return 'البريد غير متوفر';
    
    // التحقق من الصيغة الأساسية للبريد (وجود @ على الأقل)
    if (!email.includes('@')) {
      return <span className="text-yellow-500 font-medium">{email} (صيغة غير صحيحة)</span>;
    }
    
    return email;
  };

  // الحصول على حروف العرض للصورة الرمزية
  const getAvatarInitials = (user: UserProfile) => {
    if (user.full_name && user.full_name.length > 0) {
      return user.full_name.charAt(0).toUpperCase();
    }
    if (user.email && user.email.length > 0) {
      return user.email.charAt(0).toUpperCase();
    }
    if (user.username && user.username.length > 0) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };
  
  // توسيع صف المستخدم
  const toggleUserRow = async (userId: string) => {
    // إذا تم توسيع الصف بالفعل، نقوم بطيه
    if (expandedRows[userId]) {
      setExpandedRows(prev => ({ ...prev, [userId]: false }));
      return;
    }
    
    // إذا كانت وظيفة جلب التفاصيل متوفرة ولم تكن البيانات موجودة بالفعل
    if (onFetchDetails && !detailedUsers[userId]) {
      await onFetchDetails(userId);
    }
    
    // توسيع الصف
    setExpandedRows(prev => ({ ...prev, [userId]: true }));
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
            <TableHead className="w-8"></TableHead>
            <TableHead>المستخدم</TableHead>
            <TableHead>معلومات الاتصال</TableHead>
            <TableHead>الباقة</TableHead>
            <TableHead>حالة الحساب</TableHead>
            <TableHead>معتمد</TableHead>
            <TableHead>تاريخ التسجيل</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            // الحصول على بيانات المستخدم المفصلة إذا كانت متوفرة
            const detailedUser = detailedUsers[user.id] || null;
            const isExpanded = expandedRows[user.id] || false;
            const isLoadingDetailsForUser = isLoadingDetails[user.id] || false;
            
            return (
              <React.Fragment key={user.id}>
                <TableRow className={isExpanded ? "border-b-0" : ""}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleUserRow(user.id)}
                      disabled={isLoadingDetailsForUser}
                    >
                      {isLoadingDetailsForUser ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={user.avatar_url || `https://avatar.iran.liara.run/public/${user.email}`} 
                        alt={user.full_name || user.email || 'المستخدم'}
                      />
                      <AvatarFallback>{getAvatarInitials(user)}</AvatarFallback>
                    </Avatar>
                    <span>{user.full_name || 'بدون اسم'}</span>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="max-w-[200px] truncate" title={user.email || 'البريد غير متوفر'}>
                          {formatEmail(user.email)}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  
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
                      {formatDate(user.created_at)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          // إذا كانت البيانات التفصيلية متوفرة، استخدمها، وإلا استخدم البيانات الأساسية
                          onEdit(detailedUser || user);
                        }}
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
                      
                      <PasswordResetPopover user={user} />
                    </div>
                  </TableCell>
                </TableRow>
                
                {/* صف التفاصيل الإضافية - يظهر عند توسيع صف المستخدم */}
                {isExpanded && (
                  <TableRow className="bg-muted/20">
                    <TableCell colSpan={8} className="p-0">
                      {isLoadingDetailsForUser ? (
                        <div className="p-4 flex justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : detailedUser ? (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* معلومات الاتصال المفصلة */}
                          <div>
                            <h4 className="font-medium mb-2">معلومات الاتصال</h4>
                            <div className="space-y-2 text-sm">
                              {detailedUser.phone_number && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span>{detailedUser.phone_number}</span>
                                </div>
                              )}
                              
                              {detailedUser.address && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span>{detailedUser.address}</span>
                                </div>
                              )}
                              
                              {(!detailedUser.phone_number && !detailedUser.address) && (
                                <div className="text-muted-foreground">لا توجد معلومات اتصال إضافية</div>
                              )}
                            </div>
                          </div>
                          
                          {/* معلومات الاشتراك */}
                          <div>
                            <h4 className="font-medium mb-2">معلومات الاشتراك</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  تاريخ انتهاء الاشتراك: {detailedUser.subscription_end_date ? 
                                    formatDate(detailedUser.subscription_end_date) : 'غير محدد'}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  آخر تسجيل دخول: {detailedUser.last_login_at ? 
                                    formatDate(detailedUser.last_login_at) : 'غير متوفر'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* ملاحظات */}
                          <div>
                            <h4 className="font-medium mb-2">ملاحظات</h4>
                            <div className="text-sm">
                              {detailedUser.notes ? (
                                <div className="flex items-start gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <p>{detailedUser.notes}</p>
                                </div>
                              ) : (
                                <div className="text-muted-foreground">لا توجد ملاحظات</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          تعذر تحميل البيانات التفصيلية لهذا المستخدم
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserTable;
