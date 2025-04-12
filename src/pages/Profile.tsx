
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { ProfileCard, ProfileEditCard, ProfileSkeleton } from '@/components/Profile';
import { useProfileData } from '@/hooks/useProfileData';
import { useAuth } from '@/contexts/AuthContext';

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
    <div className="min-h-screen bg-[#0d1123]">
      <AppHeader />
      
      <div className="glass-bg-element opacity-10 blur-3xl rounded-full bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/20 w-[40rem] h-[40rem] fixed top-[-20rem] right-[-20rem] z-[-1]"></div>
      <div className="glass-bg-element opacity-10 blur-3xl rounded-full bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 w-[50rem] h-[50rem] fixed bottom-[-25rem] left-[-20rem] z-[-1]"></div>
      
      <main className="container mx-auto p-6 max-w-6xl content-spacing">
        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
