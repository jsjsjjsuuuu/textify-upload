
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useImageState } from "@/hooks/useImageState";
import { useImageDatabase } from "@/hooks/useImageDatabase";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader, DatabaseIcon, ClipboardList, FileSearch } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const RecentRecords = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const { images } = useImageState();
  const { loadUserImages } = useImageDatabase();

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      // إضافة معالجة الاستجابة بعد تحميل الصور
      loadUserImages(user.id).then(() => {
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    }
  }, [user, loadUserImages]);

  // حساب إحصائيات السجلات
  const stats = {
    total: images.length,
    submitted: images.filter(img => img.submitted).length,
    completed: images.filter(img => img.status === "completed").length,
    pending: images.filter(img => img.status === "pending").length,
    error: images.filter(img => img.status === "error").length,
  };

  // الحصول على آخر 5 سجلات
  const recentImages = [...images]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // تنسيق الوقت لعرض "منذ..."
  const formatRelativeTime = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ar });
    } catch (error) {
      return 'وقت غير صالح';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">جاري تحميل السجلات...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.div 
          className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900 rounded-lg p-3"
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <div className="text-2xl font-semibold text-green-700 dark:text-green-400">{stats.completed}</div>
          <div className="text-sm text-green-600 dark:text-green-500">مكتملة</div>
        </motion.div>
        <motion.div 
          className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900 rounded-lg p-3"
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <div className="text-2xl font-semibold text-orange-700 dark:text-orange-400">{stats.pending}</div>
          <div className="text-sm text-orange-600 dark:text-orange-500">قيد الانتظار</div>
        </motion.div>
      </div>

      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="mb-4 grid grid-cols-2 w-full">
          <TabsTrigger value="recent">آخر السجلات</TabsTrigger>
          <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent" className="space-y-4">
          {recentImages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DatabaseIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground/60" />
              <p>لا توجد سجلات حتى الآن</p>
              <p className="text-sm mt-1">قم بتحميل بعض الصور للبدء</p>
            </div>
          ) : (
            <>
              {recentImages.map((image) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center p-3">
                    <div className="h-12 w-12 rounded-md bg-gray-100 dark:bg-gray-700 overflow-hidden ml-3 flex-shrink-0">
                      {image.previewUrl && (
                        <img 
                          src={image.previewUrl} 
                          alt="" 
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium truncate" title={image.code || image.senderName || "صورة بدون عنوان"}>
                          {image.code || image.senderName || "صورة بدون عنوان"}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs ml-2 ${
                            image.status === "completed" 
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900" 
                              : image.status === "pending"
                              ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900"
                              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900"
                          }`}
                        >
                          {image.status === "completed" ? "مكتملة" : 
                           image.status === "pending" ? "قيد الانتظار" : "خطأ"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1" title={formatRelativeTime(image.date)}>
                        {formatRelativeTime(image.date)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                <Link to="/records">
                  <FileSearch className="ml-1 h-4 w-4" />
                  عرض كل السجلات
                </Link>
              </Button>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="stats">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between border rounded-lg p-3 bg-white dark:bg-gray-800"
            >
              <div className="flex items-center">
                <DatabaseIcon className="h-5 w-5 ml-2 text-blue-600 dark:text-blue-400" />
                <span>إجمالي السجلات</span>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900">
                {stats.total}
              </Badge>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.1 } }}
              className="flex items-center justify-between border rounded-lg p-3 bg-white dark:bg-gray-800"
            >
              <div className="flex items-center">
                <ClipboardList className="h-5 w-5 ml-2 text-green-600 dark:text-green-400" />
                <span>تم إرسالها</span>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900">
                {stats.submitted}
              </Badge>
            </motion.div>
            
            <Button variant="outline" size="sm" className="w-full mt-2" asChild>
              <Link to="/records">
                <FileSearch className="ml-1 h-4 w-4" />
                عرض التقارير والإحصائيات
              </Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecentRecords;
