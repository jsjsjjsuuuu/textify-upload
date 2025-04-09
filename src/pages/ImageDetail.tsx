
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import AppHeader from '@/components/AppHeader';
import { getImageRecordById } from '@/integrations/supabase/image-records';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, ArrowLeft, ExternalLink } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const ImageDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImageData = async () => {
      if (!user || !id) return;
      
      try {
        setLoading(true);
        const data = await getImageRecordById(id);
        setImageData(data);
      } catch (err) {
        console.error('خطأ في جلب بيانات الصورة:', err);
        setError('حدث خطأ أثناء محاولة جلب بيانات الصورة');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchImageData();
    }
  }, [id, user]);

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">جاري تحميل المعلومات...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto max-w-md p-8 border rounded-2xl bg-card shadow-lg">
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <AlertCircle className="h-5 w-5 text-primary" />
            <AlertTitle className="font-semibold mb-2">تنبيه</AlertTitle>
            <AlertDescription>
              يجب عليك تسجيل الدخول لرؤية هذه الصفحة
            </AlertDescription>
          </Alert>
          
          <Button className="w-full rounded-xl" asChild>
            <Link to="/login">تسجيل الدخول</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto py-6 px-4">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)} 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          العودة
        </Button>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !imageData ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>غير موجود</AlertTitle>
            <AlertDescription>لم يتم العثور على الصورة المطلوبة</AlertDescription>
          </Alert>
        ) : (
          <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>تفاصيل الإعلان #{imageData.code || "بدون رمز"}</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">بيانات الإعلان</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">رمز الإعلان</p>
                        <p className="font-medium">{imageData.code || "غير متوفر"}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">اسم المعلن</p>
                        <p className="font-medium">{imageData.sender_name || "غير متوفر"}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">المنطقة</p>
                        <p className="font-medium">{imageData.province || "غير متوفر"}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">السعر</p>
                        <p className="font-medium">{imageData.price || "غير متوفر"}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                        <p className="font-medium" dir="ltr">{imageData.phone_number || "غير متوفر"}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">اسم الشركة</p>
                        <p className="font-medium">{imageData.company_name || "غير متوفر"}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">تاريخ الإضافة</p>
                      <p className="font-medium">
                        {imageData.created_at
                          ? format(new Date(imageData.created_at), "dd MMMM yyyy", { locale: ar })
                          : "غير متوفر"
                        }
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">الحالة</p>
                      <Badge variant={imageData.submitted ? "success" : "outline"}>
                        {imageData.submitted ? "تم الإرسال" : "لم يتم الإرسال بعد"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">معاينة</h3>
                  {imageData.preview_url ? (
                    <div className="relative rounded-md overflow-hidden border">
                      <img 
                        src={imageData.preview_url} 
                        alt="معاينة الإعلان" 
                        className="w-full object-contain max-h-80"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 bg-muted rounded-md">
                      <p className="text-muted-foreground">لا توجد صورة للمعاينة</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between border-t bg-muted/10 p-4">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة إلى القائمة
              </Button>
              
              {!imageData.submitted && (
                <Button>إرسال البيانات</Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ImageDetail;
