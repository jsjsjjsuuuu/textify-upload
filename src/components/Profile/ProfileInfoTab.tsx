
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface ProfileInfoTabProps {
  userData: {
    email: string;
    username: string;
    fullName: string;
  };
  isUpdating: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpdateProfile: () => Promise<void>;
}

const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({
  userData,
  isUpdating,
  handleInputChange,
  handleUpdateProfile
}) => {
  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">الاسم الكامل</Label>
        <Input
          id="fullName"
          name="fullName"
          value={userData.fullName}
          onChange={handleInputChange}
          placeholder="أدخل الاسم الكامل"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">اسم المستخدم</Label>
        <Input
          id="username"
          name="username"
          value={userData.username}
          onChange={handleInputChange}
          placeholder="أدخل اسم المستخدم"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input
          id="email"
          type="email"
          value={userData.email}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">لا يمكن تغيير البريد الإلكتروني</p>
      </div>
      <Button 
        onClick={handleUpdateProfile} 
        className="w-full mt-4"
        disabled={isUpdating}
      >
        {isUpdating ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            جاري التحديث...
          </>
        ) : 'حفظ التغييرات'}
      </Button>
    </div>
  );
};

export default ProfileInfoTab;
