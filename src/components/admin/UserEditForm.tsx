
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { CalendarIcon, RefreshCw, Save, Mail } from 'lucide-react';

import { UserProfile } from '@/types/UserProfile';
import PasswordResetPopover from './PasswordResetPopover';

interface UserEditFormProps {
  userData: UserProfile;
  isProcessing?: boolean;
  selectedDate?: Date | undefined;
  onCancel?: () => void;
  onSave?: () => void;
  onUserDataChange?: (field: string, value: any) => void;
  onDateSelect?: (date: Date | undefined) => void;
  onEmailChange?: (newEmail: string) => void;
}

const UserEditForm: React.FC<UserEditFormProps> = ({
  userData,
  isProcessing = false,
  selectedDate,
  onCancel = () => {},
  onSave = () => {},
  onUserDataChange = () => {},
  onDateSelect = () => {},
  onEmailChange
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const handleEmailChangeSubmit = () => {
    if (newEmail && onEmailChange) {
      onEmailChange(newEmail);
      setIsEditingEmail(false);
      setNewEmail('');
    }
  };

  return (
    <div className="bg-muted/20 p-4 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="edit-name">الاسم الكامل</Label>
          <Input 
            id="edit-name"
            value={userData?.full_name || ''} 
            onChange={(e) => onUserDataChange('full_name', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="edit-email">البريد الإلكتروني</Label>
          {isEditingEmail ? (
            <div className="flex gap-2">
              <Input 
                id="edit-email-new"
                value={newEmail} 
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="البريد الإلكتروني الجديد"
              />
              <Button 
                variant="outline" 
                onClick={handleEmailChangeSubmit} 
                disabled={!newEmail}
                size="sm"
                className="whitespace-nowrap"
              >
                <Mail className="h-4 w-4 mr-1" />
                تغيير
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsEditingEmail(false)}
                size="sm"
              >
                إلغاء
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <Input 
                id="edit-email"
                value={userData?.email || ''} 
                disabled
              />
              <Button 
                variant="outline" 
                onClick={() => setIsEditingEmail(true)}
                size="sm"
                className="whitespace-nowrap"
              >
                <Mail className="h-4 w-4 mr-1" />
                تعديل
              </Button>
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="edit-plan">نوع الباقة</Label>
          <Select 
            value={userData?.subscription_plan || 'standard'} 
            onValueChange={(value) => onUserDataChange('subscription_plan', value)}
          >
            <SelectTrigger id="edit-plan" className="w-full">
              <SelectValue placeholder="اختر الباقة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">الباقة العادية</SelectItem>
              <SelectItem value="vip">الباقة VIP</SelectItem>
              <SelectItem value="pro">الباقة المتميزة PRO</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="edit-status">حالة الحساب</Label>
          <Select 
            value={userData?.account_status || 'active'} 
            onValueChange={(value) => onUserDataChange('account_status', value)}
          >
            <SelectTrigger id="edit-status" className="w-full">
              <SelectValue placeholder="اختر الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="suspended">موقوف</SelectItem>
              <SelectItem value="expired">منتهي</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="edit-approved">معتمد</Label>
          <div className="flex items-center space-x-2 mt-2 justify-end">
            <Label htmlFor="edit-approved-switch">
              {userData?.is_approved ? 'معتمد' : 'غير معتمد'}
            </Label>
            <Switch
              id="edit-approved-switch"
              checked={userData?.is_approved || false}
              onCheckedChange={(checked) => onUserDataChange('is_approved', checked)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="edit-end-date">تاريخ انتهاء الاشتراك</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-right font-normal mt-1"
                id="edit-end-date"
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP', { locale: arSA }) : 'اختر تاريخًا'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={onDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mt-6">
        <div className="flex-none">
          {userData && (
            <PasswordResetPopover user={userData} />
          )}
        </div>
      </div>
      
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button onClick={onSave} disabled={isProcessing}>
          {isProcessing ? (
            <>
              <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="mr-1 h-4 w-4" />
              حفظ التغييرات
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default UserEditForm;
