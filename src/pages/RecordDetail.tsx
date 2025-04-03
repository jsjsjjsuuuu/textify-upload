
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/utils/dateFormatter";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { ImageData } from "@/types/ImageData";

const RecordDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [imageRecord, setImageRecord] = useState<ImageData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // استخدام hook معالجة الصور للحصول على وظائف مفيدة
  const { loadUserImages } = useImageProcessing();

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id || !user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // محاولة استرداد السجل من قاعدة البيانات
        const { data, error } = await supabase
          .from('images')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          setError('لم يتم العثور على السجل');
          setLoading(false);
          return;
        }
        
        setImageRecord(data as ImageData);
        
        // إذا كان هناك مسار تخزين، قم بإنشاء عنوان URL للصورة
        if (data.storage_path) {
          const { data: urlData } = supabase.storage
            .from('receipt_images')
            .getPublicUrl(data.storage_path);
          
          if (urlData?.publicUrl) {
            setImageUrl(urlData.publicUrl);
          }
        } else if (data.previewUrl) {
          // استخدام URL المعاينة كبديل
          setImageUrl(data.previewUrl);
        }
      } catch (err: any) {
        console.error('خطأ في استرداد السجل:', err);
        setError(err.message || 'حدث خطأ أثناء استرداد السجل');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecord();
  }, [id, user]);

  // العودة إلى صفحة السجلات
  const handleBack = () => {
    navigate('/records');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto p-6 max-w-5xl">
          <div className="flex justify-center items-center h-[70vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mr-2">جاري تحميل البيانات...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !imageRecord) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto p-6 max-w-5xl">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-6 w-6" />
                خطأ في تحميل السجل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive mb-4">{error || 'لم يتم العثور على السجل'}</p>
              <Button onClick={handleBack} variant="outline" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                العودة إلى السجلات
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="mb-4">
          <Button onClick={handleBack} variant="outline" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            العودة إلى السجلات
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* عرض صورة الوصل */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>صورة الوصل</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex justify-center">
              {imageUrl ? (
                <div className="relative w-full h-[400px] bg-muted/30 flex items-center justify-center">
                  <img 
                    src={imageUrl} 
                    alt="صورة الوصل" 
                    className="max-w-full max-h-[400px] object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-image.jpg';
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-[400px] bg-muted/30">
                  <FileText className="h-16 w-16 text-muted-foreground opacity-40" />
                  <p className="mt-2 text-muted-foreground">الصورة غير متوفرة</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* عرض تفاصيل السجل */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل السجل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">الرقم</h3>
                  <p className="font-medium">{imageRecord.number || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">التاريخ</h3>
                  <p>{formatDate(imageRecord.date) || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">الكود</h3>
                  <p>{imageRecord.code || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">السعر</h3>
                  <p>{imageRecord.price || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">اسم المرسل</h3>
                  <p>{imageRecord.senderName || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">رقم الهاتف</h3>
                  <p className={!imageRecord.phoneNumber || imageRecord.phoneNumber.replace(/[^\d]/g, '').length === 11 ? "" : "text-destructive"}>
                    {imageRecord.phoneNumber || '-'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">المحافظة</h3>
                  <p>{imageRecord.province || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">الحالة</h3>
                  <p>{imageRecord.submitted ? 'تم الإرسال' : (imageRecord.status === 'completed' ? 'تم المعالجة' : (imageRecord.status === 'processing' ? 'قيد المعالجة' : 'غير معالج'))}</p>
                </div>
              </div>
              
              {imageRecord.rawText && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">النص المستخرج من الصورة</h3>
                  <div className="bg-muted/30 p-3 rounded-md text-sm font-mono whitespace-pre-wrap max-h-[200px] overflow-auto border">
                    {imageRecord.rawText}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecordDetail;
