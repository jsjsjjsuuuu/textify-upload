
import React from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User as UserIcon } from 'lucide-react';

interface ProfileCardProps {
  userData: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    avatarUrl: string;
  };
  stats: {
    totalImages: number;
    processedImages: number;
    pendingImages: number;
  };
  uploadingAvatar: boolean;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSignOut: () => Promise<void>;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  userData,
  stats,
  uploadingAvatar,
  handleAvatarUpload,
  handleSignOut
}) => {
  return (
    <Card className="md:col-span-1 apple-card">
      <CardHeader className="pb-4">
        <CardTitle className="apple-subheader text-center">الملف الشخصي</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="h-24 w-24 border-2 border-border">
            {userData.avatarUrl ? (
              <AvatarImage src={userData.avatarUrl} alt={userData.username} />
            ) : null}
            <AvatarFallback className="text-2xl bg-muted">
              {uploadingAvatar ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                userData.username?.substring(0, 2) || <UserIcon className="h-8 w-8" />
              )}
            </AvatarFallback>
          </Avatar>
          <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 cursor-pointer bg-primary text-primary-foreground rounded-full p-1.5 shadow-md hover:bg-primary/90 transition-colors">
            <input 
              id="avatar-upload" 
              type="file"
              accept="image/*"
              className="hidden" 
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          </label>
        </div>
        
        <div className="space-y-1 text-center">
          <h3 className="font-medium text-lg">{userData.fullName || userData.username}</h3>
          <p className="text-muted-foreground text-sm">{userData.email}</p>
        </div>
        
        <div className="w-full grid grid-cols-3 gap-2 pt-4">
          <div className="text-center p-2">
            <p className="text-2xl font-semibold">{stats.totalImages}</p>
            <p className="text-xs text-muted-foreground">إجمالي الصور</p>
          </div>
          <div className="text-center p-2">
            <p className="text-2xl font-semibold">{stats.processedImages}</p>
            <p className="text-xs text-muted-foreground">معالجة</p>
          </div>
          <div className="text-center p-2">
            <p className="text-2xl font-semibold">{stats.pendingImages}</p>
            <p className="text-xs text-muted-foreground">قيد الانتظار</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center pt-2">
        <Button variant="destructive" onClick={handleSignOut}>
          تسجيل الخروج
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProfileCard;
