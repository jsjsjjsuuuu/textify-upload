
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { 
  generateBookmarkletCode, 
  generateEnhancedBookmarkletCode,
  clearStoredItems,
  getStorageStats 
} from "@/utils/bookmarkletService";
import ExportDataSection from "./ExportDataSection";
import BookmarkletSection from "./BookmarkletSection";
import ImprovedFormFillerSection from "./ImprovedFormFillerSection";
import DirectExportTools from "../DataExport/DirectExportTools";
import { Download, Upload, Database } from 'lucide-react';

interface BookmarkletGeneratorProps {
  images: ImageData[];
  storedCount: number;
  readyCount: number;
}

const BookmarkletGenerator: React.FC<BookmarkletGeneratorProps> = ({
  images, 
  storedCount,
  readyCount
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("export");
  const [bookmarkletUrl, setBookmarkletUrl] = useState("");
  const [enhancedBookmarkletUrl, setEnhancedBookmarkletUrl] = useState("");
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [stats, setStats] = useState({
    total: storedCount || 0,
    ready: readyCount || 0,
    success: 0,
    error: 0,
    lastUpdate: null as Date | null
  });

  // تحديث الإحصائيات عند تغيير الخصائص
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      total: storedCount || 0,
      ready: readyCount || 0
    }));
  }, [storedCount, readyCount]);

  // استرجاع الإحصائيات الكاملة
  useEffect(() => {
    const fetchStats = async () => {
      const statsData = getStorageStats();
      setStats({
        total: statsData.total || 0,
        ready: statsData.ready || 0,
        success: statsData.success || 0,
        error: statsData.error || 0,
        lastUpdate: statsData.lastUpdate
      });
    };
    
    fetchStats();
  }, []);

  // إنشاء عنوان URL للبوكماركلت عند تحميل المكون
  useEffect(() => {
    generateUrls();
  }, []);

  // إنشاء عناوين URL للبوكماركلت
  const generateUrls = async () => {
    setIsGeneratingUrl(true);
    try {
      const bookmarkletCode = generateBookmarkletCode();
      const enhancedCode = generateEnhancedBookmarkletCode();
      
      setBookmarkletUrl(bookmarkletCode);
      setEnhancedBookmarkletUrl(enhancedCode);
    } catch (error) {
      console.error("Error generating bookmarklet URLs:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء روابط البوكماركلت",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingUrl(false);
    }
  };

  // نسخ رابط البوكماركلت
  const copyBookmarkletToClipboard = () => {
    navigator.clipboard.writeText(bookmarkletUrl)
      .then(() => {
        toast({
          title: "تم النسخ",
          description: "تم نسخ رابط البوكماركلت إلى الحافظة"
        });
      })
      .catch(() => {
        toast({
          title: "فشل النسخ",
          description: "حدث خطأ أثناء محاولة نسخ الرابط",
          variant: "destructive"
        });
      });
  };

  // نسخ رابط البوكماركلت المحسّن
  const copyEnhancedBookmarkletToClipboard = () => {
    navigator.clipboard.writeText(enhancedBookmarkletUrl)
      .then(() => {
        toast({
          title: "تم النسخ",
          description: "تم نسخ رابط أداة الإدخال المحسّنة إلى الحافظة"
        });
      })
      .catch(() => {
        toast({
          title: "فشل النسخ",
          description: "حدث خطأ أثناء محاولة نسخ الرابط",
          variant: "destructive"
        });
      });
  };

  // تصدير البيانات إلى localStorage
  const handleExportData = () => {
    const validImages = images.filter(img => 
      img.status === "completed" && img.code && img.senderName && img.phoneNumber
    );
    
    if (validImages.length === 0) {
      toast({
        title: "لا توجد بيانات صالحة للتصدير",
        description: "يرجى التأكد من إكمال معالجة الصور واستخراج البيانات الأساسية أولاً.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // استدعاء خدمة التصدير
      const savedCount = saveToLocalStorage(validImages);
      
      // تحديث الإحصائيات
      const updatedStats = getStorageStats();
      setStats({
        total: updatedStats.total || 0,
        ready: updatedStats.ready || 0,
        success: updatedStats.success || 0,
        error: updatedStats.error || 0,
        lastUpdate: updatedStats.lastUpdate
      });
      
      // عرض رسالة نجاح
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${savedCount} سجل من البيانات إلى ذاكرة المتصفح`,
      });
    } catch (error) {
      console.error("خطأ في تصدير البيانات:", error);
      toast({
        title: "فشل التصدير",
        description: "حدث خطأ أثناء محاولة تصدير البيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  // مسح البيانات المخزنة
  const handleClearData = () => {
    try {
      clearStoredItems();
      
      // تحديث الإحصائيات
      setStats({
        total: 0,
        ready: 0,
        success: 0,
        error: 0,
        lastUpdate: null
      });
      
      toast({
        title: "تم المسح",
        description: "تم مسح جميع البيانات المخزنة"
      });
    } catch (error) {
      console.error("خطأ في مسح البيانات:", error);
      toast({
        title: "فشل المسح",
        description: "حدث خطأ أثناء محاولة مسح البيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardContent className="p-0">
        <Tabs defaultValue="export" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full rounded-none grid grid-cols-4">
            <TabsTrigger value="export" data-value="export" className="rounded-none data-[state=active]:bg-background">
              <Database className="h-4 w-4 ml-2" />
              تصدير البيانات
            </TabsTrigger>
            <TabsTrigger value="direct-export" className="rounded-none data-[state=active]:bg-background">
              <Download className="h-4 w-4 ml-2" />
              التصدير المباشر
            </TabsTrigger>
            <TabsTrigger value="bookmarklet" className="rounded-none data-[state=active]:bg-background">
              <Upload className="h-4 w-4 ml-2" />
              البوكماركلت التقليدي
            </TabsTrigger>
            <TabsTrigger value="enhanced" className="rounded-none data-[state=active]:bg-background">
              <EnhancedIcon className="h-4 w-4 ml-2" />
              الإدخال المحسّن
            </TabsTrigger>
          </TabsList>
          
          <div className="p-4">
            <TabsContent value="export" className="mt-0">
              <ExportDataSection 
                stats={stats}
                imagesCount={images.length}
                validImagesCount={images.filter(img => img.status === "completed").length}
                storedCount={stats.total}
                onExport={handleExportData}
                onClear={handleClearData}
              />
            </TabsContent>
            
            <TabsContent value="direct-export" className="mt-0">
              <DirectExportTools images={images} />
            </TabsContent>
            
            <TabsContent value="bookmarklet" className="mt-0">
              <BookmarkletSection 
                bookmarkletUrl={bookmarkletUrl}
                isGeneratingUrl={isGeneratingUrl}
                showAdvanced={showAdvanced}
                onCopyBookmarklet={copyBookmarkletToClipboard}
                onRegenerateBookmarklet={generateUrls}
                onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
              />
            </TabsContent>
            
            <TabsContent value="enhanced" className="mt-0">
              <ImprovedFormFillerSection 
                enhancedBookmarkletUrl={enhancedBookmarkletUrl}
                isGeneratingUrl={isGeneratingUrl}
                onCopyEnhancedBookmarklet={copyEnhancedBookmarkletToClipboard}
                storedCount={stats.total}
              />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// أيقونة محسّنة
const EnhancedIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M12 2v4c0 1.1.9 2 2 2h4" />
    <path d="M20 8v14H4V4h12l4 4Z" />
    <path d="m17 15-2 2-2-2" />
    <path d="M13 15v-3h4" />
  </svg>
);

export default BookmarkletGenerator;

