import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { ProfileCard, ProfileEditCard, ProfileSkeleton } from '@/components/Profile';
import { useProfileData } from '@/hooks/useProfileData';
import { useAuth } from '@/contexts/auth';

const Profile = () => {
  const { signOut, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  
  const {
    userData,
    stats,
    isLoading,
    isUpdating,
    uploadingAvatar,
    handleInputChange,
    handleAvatarUpload,
    handleUpdateProfile
  } = useProfileData();
  
  // تحديث معلومات المستخدم عند تحميل الصفحة
  useEffect(() => {
    // ننفذ تحديث بيانات المستخدم من Supabase
    refreshUserProfile();
  }, []);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto p-6 max-w-6xl">
        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProfileCard 
              userData={userData}
              stats={stats}
              uploadingAvatar={uploadingAvatar}
              handleAvatarUpload={handleAvatarUpload}
              handleSignOut={handleSignOut}
            />

            <ProfileEditCard 
              userData={userData}
              isUpdating={isUpdating}
              handleInputChange={handleInputChange}
              handleUpdateProfile={handleUpdateProfile}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
