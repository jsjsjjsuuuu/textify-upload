
import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import ImageUploader from '@/components/ImageUploader';
import ImageList from '@/components/ImageList';
import { useDataFormatting } from '@/hooks/useDataFormatting';
import { motion } from 'framer-motion';
import { ImageData } from '@/types/ImageData';
import DirectExportTools from '@/components/DataExport/DirectExportTools';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ChevronDown, ArrowUp, ArrowDown, File, Receipt, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/dateFormatter";
import { useEffect as useReactEffect } from 'react';

const Index = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("number");
  const [sortDirection, setSortDirection] = useState("desc");
  
  // استدعاء hook بشكل ثابت في كل تحميل للمكون
  const {
    images,
    sessionImages,
    isProcessing,
    processingProgress,
    isSubmitting,
    useGemini,
    bookmarkletStats,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    saveImageToDatabase,
    formatDate: formatImageDate,
    clearSessionImages
  } = useImageProcessing();
  
  const {
    formatPhoneNumber,
    formatPrice,
    formatProvinceName
  } = useDataFormatting();
  
  // مسح الصور المؤقتة عند تحميل الصفحة
  useReactEffect(() => {
    // مسح صور الجلسة عند تحميل الصفحة لأول مرة
    clearSessionImages();
  }, []);
  
  // عند اكتمال معالجة الصور، حفظها في قاعدة البيانات
  useEffect(() => {
    const completedImages = sessionImages.filter(img => 
      img.status === "completed" && img.code && img.senderName && img.phoneNumber && !img.submitted
    );
    
    if (completedImages.length > 0) {
      completedImages.forEach(async (image) => {
        // حفظ الصور المكتملة في قاعدة البيانات
        await saveImageToDatabase(image);
        console.log("تم حفظ الصورة في قاعدة البيانات:", image.id);
      });
    }
  }, [sessionImages]);
  
  const handleImageClick = (image: ImageData) => {
    console.log('صورة تم النقر عليها:', image.id);
  };
  
  // التعامل مع الفرز
  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField("");
        setSortDirection("");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // تطبيق الفرز والبحث على البيانات - على صور الجلسة فقط
  const filteredAndSortedSessionImages = React.useMemo(() => {
    let recordImages = [...sessionImages];

    // تطبيق البحث
    if (searchTerm) {
      recordImages = recordImages.filter(
        (image) =>
          (image.code && image.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (image.senderName && image.senderName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (image.phoneNumber && image.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (image.province && image.province.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // تطبيق الفرز
    if (sortField && sortDirection) {
      recordImages.sort((a, b) => {
        let valueA = a[sortField];
        let valueB = b[sortField];

        // تعامل خاص مع قيم التاريخ
        if (sortField === "date") {
          valueA = new Date(a.date).getTime();
          valueB = new Date(b.date).getTime();
        }

        if (typeof valueA === "string" && typeof valueB === "string") {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }

        if (!valueA) return sortDirection === "asc" ? -1 : 1;
        if (!valueB) return sortDirection === "asc" ? 1 : -1;

        if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
        if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return recordImages;
  }, [sessionImages, searchTerm, sortField, sortDirection]);

  // رمز السهم للفرز
  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ChevronDown className="h-4 w-4 opacity-50" />;
    if (sortDirection === "asc") return <ArrowUp className="h-4 w-4" />;
    return <ArrowDown className="h-4 w-4" />;
  };

  // أيقونة الحالة
  const getStatusBadge = (status: string, isSubmitted: boolean) => {
    if (isSubmitted) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30">
          <span className="w-1 h-1 bg-green-500 rounded-full mr-1.5"></span>
          تم الإرسال
        </Badge>
      );
    }
    
    if (status === "processing") {
      return (
        <Badge variant="outline" className="text-[11px] px-2 py-0.5 h-5 font-medium bg-yellow-100/50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800/40 dark:text-yellow-300">
          <span className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse mr-1.5"></span>
          قيد المعالجة
        </Badge>
      );
    }
    
    if (status === "completed") {
      return (
        <Badge variant="outline" className="text-[11px] px-2 py-0.5 h-5 font-medium bg-blue-100/50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/40 dark:text-blue-300">
          <span className="w-1 h-1 bg-blue-500 rounded-full mr-1.5"></span>
          تم المعالجة
        </Badge>
      );
    }
    
    if (status === "error") {
      return (
        <Badge variant="outline" className="text-[11px] px-2 py-0.5 h-5 font-medium bg-red-100/50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800/40 dark:text-red-300">
          <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
          فشل
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60">
        انتظار
      </Badge>
    );
  };
  
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="pt-10 pb-20">
        <section className="py-16 px-6">
          <div className="container mx-auto">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6
          }} className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="apple-header mb-4">معالج الصور والبيانات</h1>
              <p className="text-xl text-muted-foreground mb-8">
                استخرج البيانات من الصور بسهولة وفعالية باستخدام تقنية الذكاء الاصطناعي المتطورة
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="apple-button bg-primary text-primary-foreground" size="lg">
                  ابدأ الآن
                </Button>
                <Button variant="outline" className="apple-button" size="lg" asChild>
                  <Link to="/records">
                    استعراض السجلات
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
        
        <section className="py-16 px-6 bg-transparent">
          <div className="container mx-auto bg-transparent">
            <div className="max-w-3xl mx-auto">
              <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
                <div className="p-8">
                  <h2 className="apple-subheader mb-4 text-center">تحميل الصور</h2>
                  <p className="text-muted-foreground text-center mb-6">قم بتحميل صور الإيصالات أو الفواتير وسنقوم باستخراج البيانات منها تلقائياً</p>
                  <ImageUploader isProcessing={isProcessing} processingProgress={processingProgress} useGemini={useGemini} onFileChange={handleFileChange} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {sessionImages.length > 0 && (
          <section className="py-16 px-6">
            <div className="container mx-auto">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl font-bold text-center mb-6">معاينة الصور والنصوص المستخرجة</h2>
                <ImageList 
                  images={sessionImages} 
                  isSubmitting={isSubmitting} 
                  onImageClick={handleImageClick} 
                  onTextChange={handleTextChange} 
                  onDelete={handleDelete} 
                  onSubmit={id => handleSubmitToApi(id, sessionImages.find(img => img.id === id)!)} 
                  formatDate={formatImageDate} 
                />
              </div>
            </div>
          </section>
        )}
          
        {/* عرض رابط للسجلات بدلاً من عرض جميع الصور مباشرة */}
        <section className="py-16 px-6 bg-gray-50 dark:bg-gray-800/20">
          <div className="container mx-auto">
            <div className="max-w-7xl mx-auto text-center">
              <h2 className="text-3xl font-medium tracking-tight mb-6">سجلات الوصولات</h2>
              <p className="text-muted-foreground mb-8">
                يمكنك الاطلاع على جميع سجلات الوصولات والبيانات المستخرجة في صفحة السجلات
              </p>
              <Button size="lg" className="apple-button" asChild>
                <Link to="/records">
                  عرض جميع السجلات
                  <ArrowRight className="mr-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t py-8 bg-transparent">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              نظام استخراج البيانات - &copy; {new Date().getFullYear()}
            </p>
            <div className="flex gap-4">
              <Link to="/records" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                السجلات
              </Link>
              <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                الملف الشخصي
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
