
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileInfoTab from './ProfileInfoTab';
import SecurityTab from './SecurityTab';

interface ProfileEditCardProps {
  userData: {
    email: string;
    username: string;
    fullName: string;
  };
  isUpdating: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpdateProfile: () => Promise<void>;
  handleSignOut: () => Promise<void>;
}

const ProfileEditCard: React.FC<ProfileEditCardProps> = ({
  userData,
  isUpdating,
  handleInputChange,
  handleUpdateProfile,
  handleSignOut
}) => {
  return (
    <Card className="md:col-span-2 apple-card">
      <CardHeader>
        <CardTitle className="apple-subheader">تعديل المعلومات الشخصية</CardTitle>
        <CardDescription>قم بتعديل المعلومات الشخصية الخاصة بك</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">المعلومات الأساسية</TabsTrigger>
            <TabsTrigger value="security">الأمان</TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <ProfileInfoTab 
              userData={userData}
              isUpdating={isUpdating}
              onInputChange={handleInputChange}
              onUpdateProfile={handleUpdateProfile}
            />
          </TabsContent>
          <TabsContent value="security">
            <SecurityTab onSignOut={handleSignOut} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProfileEditCard;
