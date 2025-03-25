
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ImageData } from '@/types/ImageData';

export const useGoogleSheets = () => {
  const { toast } = useToast();
  
  // إشعار المستخدم أن وظائف Google Sheets معطلة
  const notifyDisabled = () => {
    toast({
      title: "وظيفة معطلة",
      description: "تم تعطيل وظائف Google Sheets في هذا الإصدار",
      variant: "destructive"
    });
  };

  // إرجاع واجهة فارغة مع وظائف لا تفعل شيئًا
  return {
    isInitialized: false,
    isSignedIn: false,
    isLoading: false,
    spreadsheets: [],
    lastError: null,
    handleSignIn: notifyDisabled,
    handleSignOut: notifyDisabled,
    loadSpreadsheets: async () => {
      notifyDisabled();
      return [];
    },
    createSheet: async () => {
      notifyDisabled();
      return null;
    },
    exportToSheet: async () => {
      notifyDisabled();
      return false;
    },
    exportToDefaultSpreadsheet: async () => {
      notifyDisabled();
      return false;
    },
    setDefaultSheet: () => {
      notifyDisabled();
    },
    retryInitialization: notifyDisabled
  };
};
