
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ImageData } from "@/types/ImageData";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import ReceiptViewer from "@/components/Receipt/ReceiptViewer";

const ReceiptImageView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [image, setImage] = useState<ImageData | null>(null);
  
  const {
    loadUserImages,
    images,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    isSubmitting
  } = useImageProcessing();
  
  // تحميل البيانات عند فتح الصفحة
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      if (user && id) {
        // جلب صور المستخدم من قاعدة البيانات
        await loadUserImages((loadedImages: ImageData[]) => {
          // البحث عن الصورة المطلوبة بواسطة المعرف
          const foundImage = loadedImages.find(img => img.id === id);
          setImage(foundImage || null);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, user, loadUserImages]);
  
  // عرض رسالة التحميل
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <AppHeader />
        
        <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
          <Loader className="w-8 h-8 animate-spin mb-4" />
          <p>جاري تحميل بيانات الوصل...</p>
        </div>
      </div>
    );
  }
  
  // عرض رسالة إذا لم يتم العثور على الصورة
  if (!image) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <AppHeader />
        
        <div className="container mx-auto py-8">
          <div className="max-w-2xl mx-auto p-8 bg-gray-900 rounded-lg shadow-lg text-center">
            <h1 className="text-2xl font-bold mb-4">لم يتم العثور على الوصل</h1>
            <p className="mb-6">لا يمكن العثور على الوصل المطلوب. قد يكون قد تم حذفه أو أن المعرف غير صحيح.</p>
            <Button asChild>
              <Link to="/dashboard">
                <ChevronRight className="h-4 w-4 ml-1" />
                العودة إلى لوحة التحكم
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // معالجة حذف الصورة
  const handleImageDelete = (id: string) => {
    handleDelete(id);
    // العودة إلى صفحة لوحة التحكم بعد الحذف
    window.location.href = "/dashboard";
  };
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AppHeader />
      
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center">
          <Button variant="outline" asChild className="bg-gray-900 border-gray-800 hover:bg-gray-800 text-gray-300">
            <Link to="/dashboard">
              <ChevronRight className="h-4 w-4 ml-1" />
              العودة إلى لوحة التحكم
            </Link>
          </Button>
          <h1 className="text-2xl font-bold mr-4">
            عرض الوصل {image.code || `#${image.number || ''}`}
          </h1>
        </div>
        
        <div className="mb-8">
          <ReceiptViewer
            image={image}
            onTextChange={handleTextChange}
            onDelete={handleImageDelete}
            onSubmit={handleSubmitToApi}
            isSubmitting={!!isSubmitting[image.id]}
          />
        </div>
      </div>
    </div>
  );
};

export default ReceiptImageView;
