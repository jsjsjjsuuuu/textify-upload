
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
      return data.filter(item => item.status === 'pending' || item.status === 'processing');
    } else if (activeTab === 'completed') {
      return data.filter(item => item.status === 'completed');
    }
    return data;
  }, [data, activeTab]);

  // حساب عدد السجلات لكل تبويب
  const counts = useMemo(() => ({
    all: data.length,
    processing: data.filter(item => item.status === 'pending' || item.status === 'processing').length,
    completed: data.filter(item => item.status === 'completed').length,
  }), [data]);

  const fetchRecords = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    try {
      // محاكاة الاتصال بالخادم واستجابته
      // في التطبيق الفعلي، سيتم استبدال هذا بطلب API حقيقي
      const mockResponse = await new Promise<ImageData[]>((resolve) => {
        setTimeout(() => {
          // إنشاء ملف وهمي للاستخدام في البيانات الوهمية
          const createDummyFile = () => new File(["dummy content"], "image.jpg", { type: "image/jpeg" });
          
          // بيانات وهمية للعرض مع إضافة الخصائص المفقودة
          resolve([
            {
              id: '1',
              code: 'A123',
              senderName: 'محمد أحمد',
              phoneNumber: '07701234567',
              province: 'بغداد',
              date: new Date(),
              status: 'completed',
              price: '50000',
              file: createDummyFile(),
              previewUrl: 'https://via.placeholder.com/150',
            },
            {
              id: '2',
              code: 'B456',
              senderName: 'علي حسين',
              phoneNumber: '07712345678',
              province: 'البصرة',
              date: new Date(),
              status: 'processing',
              price: '35000',
              file: createDummyFile(),
              previewUrl: 'https://via.placeholder.com/150',
            },
            {
              id: '3',
              code: 'C789',
              senderName: 'زينب خالد',
              phoneNumber: '07723456789',
              province: 'أربيل',
              date: new Date(),
              status: 'completed',
              price: '75000',
              file: createDummyFile(),
              previewUrl: 'https://via.placeholder.com/150',
            },
          ]);
        }, 1000);
      });

      setData(mockResponse);
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
