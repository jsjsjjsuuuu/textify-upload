
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SecurityTab: React.FC = () => {
  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
        <Input
          id="currentPassword"
          type="password"
          placeholder="••••••••"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="••••••••"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
        />
      </div>
      <Button className="w-full mt-4">تغيير كلمة المرور</Button>
    </div>
  );
};

export default SecurityTab;
