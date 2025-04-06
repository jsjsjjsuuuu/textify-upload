
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Check,
  Code,
  Download,
  Copy,
  ExternalLink
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface BookmarkletDashboardProps {
  bookmarkletStats: {
    total: number;
    ready: number;
    success: number;
    error: number;
  };
}

const BookmarkletDashboard: React.FC<BookmarkletDashboardProps> = ({ bookmarkletStats }) => {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const handleCopyBookmarklet = () => {
    // هذه وظيفة مؤقتة - في التطبيق الفعلي ستكون هناك وظيفة لنسخ رمز البوكماركلت
    toast({
      title: "تم النسخ",
      description: "تم نسخ رمز البوكماركلت إلى الحافظة",
    });
  };

  const handleDownloadBookmarklet = () => {
    // هذه وظيفة مؤقتة - في التطبيق الفعلي ستكون هناك وظيفة لتنزيل البوكماركلت
    toast({
      title: "جاري التنزيل",
      description: "جاري تنزيل ملف البوكماركلت",
    });
  };

  if (!expanded) {
    return (
      <div className="mb-4 p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm cursor-pointer" onClick={() => setExpanded(true)}>
        <div className="flex justify-between items-center">
          <span className="font-medium">إحصائيات البوكماركلت</span>
          <div className="flex items-center gap-4">
            <div className="flex gap-2 items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm">{bookmarkletStats.total} إجمالي</span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">{bookmarkletStats.success} نجاح</span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">{bookmarkletStats.error} خطأ</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <div className="mb-4 flex justify-between items-center">
        <span className="font-medium">لوحة تحكم البوكماركلت</span>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
          إغلاق
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-medium mb-2 flex items-center">
            <Code className="h-4 w-4 ml-1" />
            البوكماركلت
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            استخدم البوكماركلت لإدخال البيانات تلقائيًا في المواقع الأخرى
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyBookmarklet}>
              <Copy className="h-4 w-4 ml-1" />
              نسخ الرمز
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadBookmarklet}>
              <Download className="h-4 w-4 ml-1" />
              تنزيل
            </Button>
          </div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-medium mb-2">إحصائيات البوكماركلت</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 ml-2"></div>
              <span className="text-sm">إجمالي: {bookmarkletStats.total}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 ml-2"></div>
              <span className="text-sm">جاهزة: {bookmarkletStats.ready}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 ml-2"></div>
              <span className="text-sm">نجاح: {bookmarkletStats.success}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 ml-2"></div>
              <span className="text-sm">خطأ: {bookmarkletStats.error}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
        <h3 className="font-medium mb-2 flex items-center">
          <AlertCircle className="h-4 w-4 ml-1" />
          كيفية الاستخدام
        </h3>
        <ol className="list-decimal list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
          <li>اسحب الرابط إلى شريط المفضلة في متصفحك</li>
          <li>انتقل إلى الصفحة التي تريد إدخال البيانات فيها</li>
          <li>انقر على البوكماركلت في شريط المفضلة</li>
          <li>حدد السجل الذي تريد إدخال بياناته</li>
          <li>ستتم تعبئة النموذج تلقائيًا بالبيانات</li>
        </ol>

        <Button variant="link" size="sm" className="mt-2 p-0">
          <ExternalLink className="h-4 w-4 ml-1" />
          عرض الدليل التفصيلي
        </Button>
      </div>
    </div>
  );
};

export default BookmarkletDashboard;
