
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CalendarIcon, RefreshCw, Save, Mail, AlertCircle, X, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { UserProfile } from '@/types/UserProfile';

interface UserEditFormProps {
  userData: UserProfile;
  newPassword: string;
  showPassword: boolean;
  isProcessing: boolean;
  selectedDate: Date | undefined;
  onCancel: () => void;
  onSave: () => void;
  onShowPasswordToggle: () => void;
  onNewPasswordChange: (password: string) => void;
  onUserDataChange: (field: string, value: any) => void;
  onDateSelect: (date: Date | undefined) => void;
  onPasswordReset: () => void;
  onEmailChange?: (userId: string, newEmail: string) => void;
}

const UserEditForm: React.FC<UserEditFormProps> = ({
  userData,
  newPassword,
  showPassword,
  isProcessing,
  selectedDate,
  onCancel,
  onSave,
  onShowPasswordToggle,
  onNewPasswordChange,
  onUserDataChange,
  onDateSelect,
  onPasswordReset,
  onEmailChange
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // تحقق من صحة كلمة المرور
  const validatePassword = (password: string): boolean => {
    if (!password || password.trim() === '') {
      setPasswordError('كلمة المرور لا يمكن أن تكون فارغة');
      return false;
    }
    
    if (password.length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    
    setPasswordError(null);
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onNewPasswordChange(newValue);
    
    // نتحقق من صحة كلمة المرور مباشرةً أثناء الكتابة
    if (newValue.trim() !== '') {
      validatePassword(newValue);
    } else {
      setPasswordError(null); // نزيل رسالة الخطأ إذا كان الحقل فارغًا
    }
  };

  const handleEmailChangeSubmit = () => {
    if (newEmail && onEmailChange) {
      onEmailChange(userData.id, newEmail);
      setIsEditingEmail(false);
      setNewEmail('');
    }
  };

  const handlePasswordReset = () => {
    if (!newPassword || !validatePassword(newPassword)) {
      return; // منع الإرسال إذا كانت كلمة المرور غير صالحة
    }
    
    onPasswordReset();
  };

  return (
    <div className="rounded-xl bg-[#1a2544]/60 border border-[#2a325a]/30 p-8 backdrop-blur-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <label htmlFor="edit-name" className="admin-form-label">الاسم الكامل</label>
          <input 
            id="edit-name"
            type="text"
            value={userData?.full_name || ''} 
            onChange={(e) => onUserDataChange('full_name', e.target.value)}
            className="admin-form-input"
          />
        </div>
        
        <div>
          <label htmlFor="edit-email" className="admin-form-label">البريد الإلكتروني</label>
          {isEditingEmail ? (
            <div className="flex gap-3">
              <input 
                id="edit-email-new"
                type="email"
                value={newEmail} 
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="البريد الإلكتروني الجديد"
                className="admin-form-input"
              />
              <button 
                className="admin-button admin-button-primary"
                onClick={handleEmailChangeSubmit} 
                disabled={!newEmail}
              >
                <Mail className="h-5 w-5" />
                تغيير
              </button>
              <button 
                className="admin-button admin-button-secondary"
                onClick={() => setIsEditingEmail(false)}
              >
                <X className="h-5 w-5" />
                إلغاء
              </button>
            </div>
          ) : (
            <div className="flex gap-3 items-center">
              <input 
                id="edit-email"
                type="email"
                value={userData?.email || ''} 
                disabled
                className="admin-form-input bg-[#1a2544]/90 text-blue-200/80"
              />
              <button 
                className="admin-button admin-button-outline"
                onClick={() => setIsEditingEmail(true)}
              >
                <Mail className="h-5 w-5" />
                تعديل
              </button>
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="edit-plan" className="admin-form-label">نوع الباقة</label>
          <select 
            id="edit-plan"
            value={userData?.subscription_plan || 'standard'} 
            onChange={(e) => onUserDataChange('subscription_plan', e.target.value)}
            className="admin-select"
          >
            <option value="standard">الباقة العادية</option>
            <option value="vip">الباقة VIP</option>
            <option value="pro">الباقة المتميزة PRO</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="edit-status" className="admin-form-label">حالة الحساب</label>
          <select 
            id="edit-status"
            value={userData?.account_status || 'active'} 
            onChange={(e) => onUserDataChange('account_status', e.target.value)}
            className="admin-select"
          >
            <option value="active">نشط</option>
            <option value="suspended">موقوف</option>
            <option value="expired">منتهي</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="edit-approved" className="admin-form-label">حالة الاعتماد</label>
          <div className="flex items-center gap-4 mt-2">
            <button
              type="button" 
              onClick={() => onUserDataChange('is_approved', true)}
              className={`admin-button flex-1 ${userData?.is_approved ? 'admin-button-success' : 'admin-button-outline'}`}
            >
              <CheckCircle className="h-5 w-5" />
              معتمد
            </button>
            
            <button
              type="button" 
              onClick={() => onUserDataChange('is_approved', false)}
              className={`admin-button flex-1 ${!userData?.is_approved ? 'admin-button-danger' : 'admin-button-outline'}`}
            >
              <XCircle className="h-5 w-5" />
              غير معتمد
            </button>
          </div>
        </div>
        
        <div>
          <label htmlFor="edit-end-date" className="admin-form-label">تاريخ انتهاء الاشتراك</label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                id="edit-end-date"
                type="button"
                className="admin-form-input flex items-center justify-between"
              >
                {selectedDate ? format(selectedDate, 'PPP', { locale: arSA }) : 'اختر تاريخًا'}
                <CalendarIcon className="h-5 w-5 opacity-60" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#1a2544] border border-[#2a325a]/50">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={onDateSelect}
                initialFocus
                className="bg-[#1a2544]"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="border-t border-[#2a325a]/30 pt-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <label htmlFor="new-password" className="admin-form-label">تعيين كلمة مرور جديدة (اختياري)</label>
            <div className="relative">
              <Lock className="absolute right-5 top-3.5 h-5 w-5 text-blue-200/60" />
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="كلمة المرور الجديدة"
                className={`admin-form-input pr-12 ${passwordError ? 'border-red-500' : ''}`}
                value={newPassword}
                onChange={handlePasswordChange}
              />
              <button
                type="button"
                className="absolute left-5 top-3.5 text-blue-200/60"
                onClick={onShowPasswordToggle}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {passwordError && (
              <div className="flex items-center gap-1.5 mt-2 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{passwordError}</span>
              </div>
            )}
          </div>
          <div className="flex items-end">
            <button 
              className="admin-button admin-button-danger w-full"
              onClick={handlePasswordReset}
              disabled={!newPassword || !!passwordError}
            >
              <Lock className="h-5 w-5" />
              تغيير كلمة المرور
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-4 mt-8">
        <button 
          className="admin-button admin-button-secondary"
          onClick={onCancel}
        >
          <X className="h-5 w-5" />
          إلغاء
        </button>
        <button 
          className="admin-button admin-button-primary"
          onClick={onSave} 
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              حفظ التغييرات
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UserEditForm;
