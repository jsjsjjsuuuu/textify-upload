
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
  }, [refreshUserProfile]);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen app-background">
      <AppHeader />
      
      {/* تأثيرات الخلفية الموحدة */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute -top-40 -right-40 w-[50rem] h-[50rem] rounded-full opacity-10 blur-3xl bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/5"></div>
        <div className="absolute -bottom-40 -left-40 w-[50rem] h-[50rem] rounded-full opacity-10 blur-3xl bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-purple-500/5"></div>
      </div>
      
      <main className="container mx-auto p-6 max-w-6xl content-spacing">
        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="dish-container">
              <div className="dish-glow-top"></div>
              <div className="dish-glow-bottom"></div>
              <div className="dish-reflection"></div>
              <div className="dish-inner-shadow"></div>
              <div className="relative z-10 p-6">
                <ProfileCard 
                  userData={userData}
                  stats={stats}
                  uploadingAvatar={uploadingAvatar}
                  handleAvatarUpload={handleAvatarUpload}
                  handleSignOut={handleSignOut}
                />
              </div>
            </div>

            <div className="md:col-span-2 dish-container">
              <div className="dish-glow-top"></div>
              <div className="dish-glow-bottom"></div>
              <div className="dish-reflection"></div>
              <div className="dish-inner-shadow"></div>
              <div className="relative z-10 p-6">
                <ProfileEditCard 
                  userData={userData}
                  isUpdating={isUpdating}
                  handleInputChange={handleInputChange}
                  handleUpdateProfile={handleUpdateProfile}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
