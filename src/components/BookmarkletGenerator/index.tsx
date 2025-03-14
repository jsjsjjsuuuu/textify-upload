
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookmarkIcon, FileBox } from "lucide-react";
import { motion } from "framer-motion";
import { ImageData } from "@/types/ImageData";
import { useBookmarklet } from "@/hooks/useBookmarklet";
import ExportDataSection from "./ExportDataSection";
import BookmarkletSection from "./BookmarkletSection";

// تحديث واجهة الخصائص
interface BookmarkletGeneratorProps {
  images: ImageData[];
  storedCount?: number;
  readyCount?: number;
}

const BookmarkletGenerator = ({ images, storedCount: initialStoredCount = 0, readyCount: initialReadyCount = 0 }: BookmarkletGeneratorProps) => {
  const [activeTab, setActiveTab] = useState("export");

  // استخدام الهوك المخصص للتعامل مع البوكماركلت
  const {
    storedCount,
    bookmarkletUrl,
    isGeneratingUrl,
    showAdvanced,
    stats,
    handleExport,
    handleClear,
    handleCopyBookmarklet,
    handleRegenerateBookmarklet,
    toggleAdvancedOptions
  } = useBookmarklet(images);

  // حساب عدد الصور المكتملة (التي تحتوي على البيانات الأساسية)
  const validImagesCount = images.filter(img => img.code && img.senderName && img.phoneNumber).length || 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold text-brand-brown dark:text-brand-beige flex items-center">
                <BookmarkIcon className="mr-2 h-5 w-5 text-brand-coral" />
                أداة نقل البيانات (Bookmarklet)
              </CardTitle>
              <CardDescription className="mt-1">
                نقل البيانات المستخرجة تلقائيًا إلى مواقع شركات التوصيل
              </CardDescription>
            </div>
            {storedCount > 0 && (
              <Badge variant="outline" className="bg-brand-green/10 text-brand-green border-brand-green/20">
                <FileBox className="h-3.5 w-3.5 mr-1" />
                {storedCount} عنصر مخزن
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="export" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="export">تصدير البيانات</TabsTrigger>
              <TabsTrigger value="bookmarklet">إعداد الـ Bookmarklet</TabsTrigger>
            </TabsList>
            
            {/* قسم تصدير البيانات */}
            <TabsContent value="export">
              <ExportDataSection 
                stats={stats}
                imagesCount={images.length}
                validImagesCount={validImagesCount}
                storedCount={storedCount}
                onExport={handleExport}
                onClear={handleClear}
              />
            </TabsContent>
            
            {/* قسم إعداد Bookmarklet */}
            <TabsContent value="bookmarklet">
              <BookmarkletSection 
                bookmarkletUrl={bookmarkletUrl}
                isGeneratingUrl={isGeneratingUrl}
                showAdvanced={showAdvanced}
                onCopyBookmarklet={handleCopyBookmarklet}
                onRegenerateBookmarklet={handleRegenerateBookmarklet}
                onToggleAdvanced={toggleAdvancedOptions}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
          <p>
            ملاحظة: تعمل هذه الأداة في المتصفح فقط ولا يتم إرسال بياناتك إلى أي خادم خارجي
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default BookmarkletGenerator;
