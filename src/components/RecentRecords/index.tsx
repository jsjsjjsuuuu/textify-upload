import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useImageState } from "@/hooks/useImageState";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { useAuth } from "@/contexts/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Loader, 
  DatabaseIcon, 
  ClipboardList, 
  FileSearch, 
  ChevronLeft, 
  LayoutDashboard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Image
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const RecentRecords = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const { images } = useImageState();
  const { loadUserImages } = useImageProcessing();

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      // استدعاء دالة loadUserImages مع تمرير دالة رجعية لتحديث حالة التحميل
      loadUserImages((loadedImages) => {
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
      <Card className="bg-slate-900/90 border border-slate-800 overflow-hidden backdrop-blur-xl">
        <CardHeader className="border-b border-slate-800/60 bg-slate-900/90 py-3">
          <div className="flex items-center">
            <Clock className="h-5 w-5 ml-2 text-blue-400" />
            <CardTitle className="text-lg font-medium text-white">آخر السجلات</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Loader className="h-8 w-8 animate-spin text-blue-500 mb-2" />
          <p className="text-sm text-slate-400">جاري تحميل السجلات...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/90 border border-slate-800 overflow-hidden backdrop-blur-xl shadow-lg">
      <CardHeader className="border-b border-slate-800/60 bg-slate-900/90 py-3 flex flex-row items-center justify-between">
        <div className="flex items-center">
          <Clock className="h-5 w-5 ml-2 text-blue-400" />
          <CardTitle className="text-lg font-medium text-white">آخر السجلات</CardTitle>
        </div>
        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" asChild>
          <Link to="/records" className="flex items-center gap-1">
            <span>عرض الكل</span>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="recent" className="w-full">
          <div className="bg-slate-900/70 border-b border-slate-800/50">
            <TabsList className="w-full bg-transparent justify-start px-4 h-12">
              <TabsTrigger 
                value="recent" 
                className="data-[state=active]:bg-slate-800/50 data-[state=active]:text-white text-slate-400 rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-500 transition-all"
              >
                آخر السجلات
              </TabsTrigger>
              <TabsTrigger 
                value="stats" 
                className="data-[state=active]:bg-slate-800/50 data-[state=active]:text-white text-slate-400 rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-500 transition-all"
              >
                الإحصائيات
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="recent" className="pt-4 px-4 pb-6 space-y-4 mt-0">
            {recentImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="p-6 rounded-full bg-slate-800/50 mb-4">
                  <DatabaseIcon className="h-12 w-12 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">لا توجد سجلات حتى الآن</h3>
                <p className="text-slate-400 mb-6">قم بتحميل بعض الصور للبدء في استخدام النظام</p>
                <Button asChild variant="outline" className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-white">
                  <Link to="/upload">
                    <Image className="ml-2 h-4 w-4" />
                    تحميل الصور
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                {recentImages.map((image) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link to={`/records?id=${image.id}`} className="block">
                      <div className="bg-slate-800/50 hover:bg-slate-800/90 border border-slate-700/30 rounded-lg p-3 transition-all cursor-pointer">
                        <div className="flex items-center">
                          <div className="h-14 w-14 rounded-lg bg-slate-700/70 overflow-hidden ml-4 flex-shrink-0 border border-slate-600/30">
                            {image.previewUrl ? (
                              <img 
                                src={image.previewUrl} 
                                alt="" 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <FileSearch className="h-6 w-6 text-slate-500" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-semibold text-white truncate" title={image.code || image.senderName || "صورة بدون عنوان"}>
                                {image.code || image.senderName || "صورة بدون عنوان"}
                              </p>
                              <StatusBadge status={image.status} />
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <div className="flex items-center text-xs text-slate-400">
                                <Clock className="h-3 w-3 inline-block ml-1" />
                                <span>{formatRelativeTime(image.date)}</span>
                              </div>
                              
                              {image.price && (
                                <div className="text-sm">
                                  <Badge variant="outline" className="bg-emerald-950/30 text-emerald-400 border-emerald-800/30">
                                    {image.price} ر.س
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
                
                <div className="flex justify-center mt-6">
                  <Button variant="outline" size="sm" className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-white" asChild>
                    <Link to="/records">
                      <FileSearch className="ml-2 h-4 w-4" />
                      عرض كل السجلات
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="stats" className="pt-4 px-4 pb-6 mt-0">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard 
                title="إجمالي السجلات" 
                value={stats.total} 
                icon={<DatabaseIcon />}
                className="from-slate-800 to-slate-800/50 border-slate-700/50" 
              />
              <StatCard 
                title="مكتملة" 
                value={stats.completed} 
                icon={<CheckCircle2 />}
                className="from-emerald-900/20 to-emerald-900/5 border-emerald-800/30" 
                textColor="text-emerald-400"
              />
              <StatCard 
                title="قيد الانتظار" 
                value={stats.pending} 
                icon={<Clock />}
                className="from-amber-900/20 to-amber-900/5 border-amber-800/30" 
                textColor="text-amber-400"
              />
              <StatCard 
                title="تم إرسالها" 
                value={stats.submitted} 
                icon={<ClipboardList />}
                className="from-blue-900/20 to-blue-900/5 border-blue-800/30" 
                textColor="text-blue-400"
              />
            </div>
            
            <div className="flex justify-center">
              <Button variant="outline" size="sm" className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-white w-full" asChild>
                <Link to="/records">
                  <LayoutDashboard className="ml-2 h-4 w-4" />
                  عرض التقارير والإحصائيات
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// مكون لعرض حالة المعالجة بتصميم جذاب
const StatusBadge = ({ status }: { status: string }) => {
  if (status === "completed") {
    return (
      <Badge variant="outline" className="bg-emerald-950/30 text-emerald-400 border-emerald-800/30 mr-1">
        مكتملة
      </Badge>
    );
  } else if (status === "pending") {
    return (
      <Badge variant="outline" className="bg-amber-950/30 text-amber-400 border-amber-800/30 mr-1">
        قيد الانتظار
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="bg-red-950/30 text-red-400 border-red-800/30 mr-1">
        خطأ
      </Badge>
    );
  }
};

// مكون لعرض البطاقات الإحصائية
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
  textColor?: string;
}

const StatCard = ({ title, value, icon, className = "", textColor = "text-white" }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${className} rounded-xl border p-4 flex flex-col items-center justify-center`}
    >
      <div className={`${textColor} mb-2`}>
        {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6" })}
      </div>
      <div className={`text-2xl font-bold ${textColor}`}>
        {value}
      </div>
      <div className="text-slate-400 text-sm">
        {title}
      </div>
    </motion.div>
  );
};

export default RecentRecords;
