
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ImageData } from '@/types/ImageData';
import { useToast } from '@/hooks/use-toast';

const useFetchRecords = (activeTab: string) => {
  const [data, setData] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // فلترة السجلات حسب علامة التبويب النشطة
  const filteredData = useMemo(() => {
    if (activeTab === 'all') {
      return data;
    } else if (activeTab === 'processing') {
      return data.filter(item => item.status === 'processing');
    } else if (activeTab === 'pending') {
      return data.filter(item => item.status === 'pending');
    } else if (activeTab === 'completed') {
      return data.filter(item => item.status === 'completed');
    } else if (activeTab === 'incomplete') {
      // افتراض أن الحالة قد تكون مختلفة عن الحالات المعروفة
      return data.filter(item => 
        item.status !== 'completed' && 
        item.status !== 'pending' && 
        item.status !== 'processing' && 
        item.status !== 'error'
      );
    } else if (activeTab === 'error') {
      return data.filter(item => item.status === 'error');
    }
    return data;
  }, [data, activeTab]);

  // حساب عدد السجلات لكل تبويب
  const counts = useMemo(() => {
    const incompleteCount = data.filter(item => 
      item.status !== 'completed' && 
      item.status !== 'pending' && 
      item.status !== 'processing' && 
      item.status !== 'error'
    ).length;
    
    return {
      all: data.length,
      processing: data.filter(item => item.status === 'processing').length,
      pending: data.filter(item => item.status === 'pending').length,
      completed: data.filter(item => item.status === 'completed').length,
      error: data.filter(item => item.status === 'error').length,
      incomplete: incompleteCount,
    };
  }, [data]);

  const fetchRecords = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    try {
      // تأخير وهمي لإظهار حالة التحميل
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // إنشاء ملف وهمي للاستخدام في البيانات الوهمية
      const createDummyFile = () => new File(["dummy content"], "image.jpg", { type: "image/jpeg" });
      
      // توليد بيانات مختلفة الحالات
      const mockData: ImageData[] = [
        {
          id: '1203',
          code: 'A1203',
          senderName: 'محمد أحمد',
          phoneNumber: '07701234567',
          province: 'بغداد',
          date: new Date(),
          status: 'completed',
          price: '50000',
          file: createDummyFile(),
          previewUrl: 'https://via.placeholder.com/150',
          extractedText: '',
          submitted: true,
        },
        {
          id: '1193',
          code: 'B1193',
          senderName: 'علي حسين',
          phoneNumber: '07712345678',
          province: 'البصرة',
          date: new Date(),
          status: 'processing',
          price: '35000',
          file: createDummyFile(),
          previewUrl: 'https://via.placeholder.com/150',
          extractedText: '',
          submitted: false,
        },
        {
          id: '1183',
          code: 'C1183',
          senderName: 'زينب خالد',
          phoneNumber: '07723456789',
          province: 'أربيل',
          date: new Date(Date.now() - 86400000 * 3), // قبل 3 أيام
          status: 'pending',
          price: '75000',
          file: createDummyFile(),
          previewUrl: 'https://via.placeholder.com/150',
          extractedText: '',
          submitted: false,
        },
        {
          id: '1173',
          code: 'D1173',
          senderName: 'أحمد محمد',
          phoneNumber: '07734567890',
          province: 'نينوى',
          date: new Date(Date.now() - 86400000 * 5), // قبل 5 أيام
          status: 'error',
          price: '60000',
          file: createDummyFile(),
          previewUrl: 'https://via.placeholder.com/150',
          extractedText: '',
          submitted: false,
        },
        {
          id: '1163',
          code: 'E1163',
          senderName: 'فاطمة علي',
          phoneNumber: '07745678901',
          province: 'كركوك',
          date: new Date(Date.now() - 86400000 * 7), // قبل 7 أيام
          status: 'unknown', // حالة غير معروفة
          price: '45000',
          file: createDummyFile(),
          previewUrl: 'https://via.placeholder.com/150',
          extractedText: '',
          submitted: false,
        },
      ];

      setData(mockData);
    } catch (error) {
      console.error('Error fetching records:', error);
      setIsError(true);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء محاولة جلب السجلات الأخيرة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // جلب السجلات عند تحميل المكون أو تغيير المستخدم
  useEffect(() => {
    fetchRecords();
  }, [user]);

  return {
    data,
    isLoading,
    isError,
    refetch: fetchRecords,
    filteredData,
    counts
  };
};

export default useFetchRecords;
