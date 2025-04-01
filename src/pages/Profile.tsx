
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import ProfileInfoTab from '@/components/Profile/ProfileInfoTab';
import SecurityTab from '@/components/Profile/SecurityTab';
import AppHeader from '@/components/AppHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagementTab } from '@/components/Profile/UserManagementTab';
import { Pricing } from '@/components/ui/pricing';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProfileData } from '@/hooks/useProfileData';

// حزمة الباقات المتاحة
const subscriptionPlans = [
  {
    id: 'standard',
    name: 'الباقة العادية',
    price: '0',
    yearlyPrice: '0',
    period: 'شهر',
    description: 'مناسبة للاستخدام البسيط والاختبار',
    buttonText: 'الباقة الحالية',
    href: '#',
    isPopular: false,
    features: [
      '3 صور يومياً',
      'الوصول إلى الميزات الأساسية',
      'دعم البريد الإلكتروني'
    ]
  },
  {
    id: 'vip',
    name: 'باقة VIP',
    price: '10',
    yearlyPrice: '100',
    period: 'شهر',
    description: 'مناسبة للاستخدام المتوسط',
    buttonText: 'ترقية الآن',
    href: '#',
    isPopular: true,
    features: [
      '1600 صورة يومياً',
      'جميع ميزات الباقة العادية',
      'دعم متميز',
      'تصدير البيانات'
    ]
  },
  {
    id: 'pro',
    name: 'باقة PRO',
    price: '20',
    yearlyPrice: '200',
    period: 'شهر',
    description: 'مناسبة للاستخدام المكثف',
    buttonText: 'ترقية الآن',
    href: '#',
    isPopular: false,
    features: [
      '3500 صورة يومياً',
      'جميع ميزات باقة VIP',
      'دعم مخصص',
      'ميزات متقدمة',
      'واجهة برمجة التطبيقات API'
    ]
  }
];

const Profile = () => {
  const { 
    user, 
    userProfile, 
    signOut,
  } = useAuth();
  
  const {
    userData,
    stats,
    isLoading,
    isUpdating,
    uploadingAvatar,
    handleInputChange,
    handleAvatarUpload,
    handleUpdateProfile,
    fetchUserProfile,
    subscriptionInfo,
    updateSubscriptionPlan
  } = useProfileData();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  
  // التحقق مما إذا كان المستخدم مسؤولاً
  const isAdmin = userProfile?.is_admin === true;
  
  // عندما يتم تسجيل الخروج
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  // التعامل مع اختيار باقة
  const handleSelectPlan = async (planId: string) => {
    // لا داعي للترقية إذا كانت الباقة هي نفسها الباقة الحالية
    if (planId === subscriptionInfo.plan) {
      return;
    }
    
    // تأكيد الترقية
    const confirmUpgrade = window.confirm(`هل أنت متأكد من ترقية باقتك إلى ${planId === 'pro' ? 'PRO' : planId === 'vip' ? 'VIP' : 'العادية'}؟`);
    
    if (confirmUpgrade) {
      const success = await updateSubscriptionPlan(planId);
      if (success) {
        // تحديث واجهة المستخدم
        setActiveTab('profile');
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex justify-center my-20">
            <div className="w-16 h-16 border-4 border-primary/50 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <h1 className="text-3xl font-bold mb-2">الملف الشخصي</h1>
              <p className="text-muted-foreground">إدارة حسابك وإعداداتك</p>
            </div>
            
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full md:w-auto">
                <TabsTrigger value="profile">معلومات الملف</TabsTrigger>
                <TabsTrigger value="security">الأمان</TabsTrigger>
                <TabsTrigger value="subscription">الباقة</TabsTrigger>
                {isAdmin && <TabsTrigger value="user-management">إدارة المستخدمين</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="profile" className="pt-6">
                <ProfileInfoTab 
                  userData={userData}
                  stats={stats}
                  uploadingAvatar={uploadingAvatar}
                  isUpdating={isUpdating}
                  onInputChange={handleInputChange}
                  onAvatarUpload={handleAvatarUpload}
                  onUpdateProfile={handleUpdateProfile}
                />
                
                {/* عرض معلومات الباقة في علامة تبويب الملف الشخصي */}
                <div className="mt-8 p-6 bg-card rounded-lg border shadow-sm">
                  <h3 className="text-xl font-semibold mb-4">معلومات الباقة</h3>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">الباقة الحالية:</span>
                      <span className="font-medium">
                        {subscriptionInfo.plan === 'pro' ? 'PRO' : 
                         subscriptionInfo.plan === 'vip' ? 'VIP' : 
                         'العادية'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">الحد اليومي:</span>
                      <span className="font-medium">{subscriptionInfo.dailyLimit} صورة</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">الاستخدام اليومي:</span>
                      <span className="font-medium">{subscriptionInfo.currentUsage} صورة</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">الاستخدام اليومي</span>
                      <span className="text-sm font-medium">
                        {subscriptionInfo.currentUsage} / {subscriptionInfo.dailyLimit}
                      </span>
                    </div>
                    <Progress 
                      value={(subscriptionInfo.currentUsage / subscriptionInfo.dailyLimit) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  {subscriptionInfo.plan !== 'pro' && (
                    <Alert className="mt-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                      <AlertDescription className="text-blue-800 dark:text-blue-300">
                        ترقية باقتك للحصول على عدد أكبر من الصور اليومية والمزيد من الميزات!
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="mt-4">
                    <Button 
                      onClick={() => setActiveTab('subscription')} 
                      variant="outline" 
                      className="w-full"
                    >
                      عرض الباقات وترقية الحساب
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="security" className="pt-6">
                <SecurityTab onSignOut={handleSignOut} />
              </TabsContent>
              
              <TabsContent value="subscription" className="pt-6">
                <div className="bg-card rounded-lg border shadow-sm p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-4">باقتك الحالية</h3>
                  
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">الباقة:</span>
                      <span className="font-medium">
                        {subscriptionInfo.plan === 'pro' ? 'PRO' : 
                         subscriptionInfo.plan === 'vip' ? 'VIP' : 
                         'العادية'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">الحد اليومي:</span>
                      <span className="font-medium">{subscriptionInfo.dailyLimit} صورة</span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-muted-foreground">المتبقي اليوم:</span>
                      <span className="font-medium">{subscriptionInfo.remainingUploads} صورة</span>
                    </div>
                    
                    <div className="mb-2">
                      <Progress 
                        value={(subscriptionInfo.currentUsage / subscriptionInfo.dailyLimit) * 100} 
                        className="h-2"
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">0</span>
                        <span className="text-xs text-muted-foreground">{subscriptionInfo.dailyLimit}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">ترقية الباقة</h3>
                  <Pricing 
                    plans={subscriptionPlans} 
                    title="اختر الباقة المناسبة لك"
                    description="قم بترقية باقتك للحصول على المزيد من المميزات وعدد أكبر من الصور اليومية"
                    onSelectPlan={handleSelectPlan}
                  />
                </div>
              </TabsContent>
              
              {isAdmin && (
                <TabsContent value="user-management" className="pt-6">
                  <UserManagementTab />
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

export default Profile;
