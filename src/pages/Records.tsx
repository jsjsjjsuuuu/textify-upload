
import { useState, useEffect } from "react";
import BackgroundPattern from "@/components/BackgroundPattern";
import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { getExtractedRecords, ExtractedRecord } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import AuthGuard from "@/components/AuthGuard";

const Records = () => {
  const [records, setRecords] = useState<ExtractedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // تنسيق التاريخ باللغة العربية
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: ar });
    } catch (error) {
      return dateString;
    }
  };

  // جلب السجلات من قاعدة البيانات
  useEffect(() => {
    const fetchRecords = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const data = await getExtractedRecords(user.id);
        setRecords(data);
      } catch (error) {
        console.error("خطأ في جلب السجلات:", error);
        toast({
          title: "خطأ في جلب البيانات",
          description: "حدث خطأ أثناء محاولة استرجاع السجلات من قاعدة البيانات",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [user, toast]);

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="container px-4 sm:px-6 py-4 sm:py-6 mx-auto max-w-6xl">
        <AppHeader />

        <div className="flex flex-col items-center pt-4">
          <div className="w-full">
            <h2 className="text-2xl font-bold text-brand-brown dark:text-brand-beige mb-6 flex items-center">
              <span className="bg-brand-coral/20 w-1.5 h-6 rounded mr-2 block"></span>
              سجلات البيانات المستخرجة
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <svg className="animate-spin h-8 w-8 mx-auto text-brand-brown" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-gray-500">جاري تحميل السجلات...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">لا توجد سجلات محفوظة حتى الآن</p>
                <p className="mt-2 text-gray-400 dark:text-gray-500 text-sm">قم بحفظ النصوص المستخرجة من الصور لرؤيتها هنا</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {records.map((record) => (
                  <Card key={record.id} className="overflow-hidden">
                    <div className="p-4 border-b border-border/10">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">
                          {record.company_name || record.sender_name || "سجل بدون اسم"}
                        </h3>
                        <span className="text-xs bg-brand-brown/10 dark:bg-brand-beige/10 text-brand-brown dark:text-brand-beige px-2 py-1 rounded-full">
                          {record.price ? `${record.price} د.ع` : "بدون سعر"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <span>{record.province || "المحافظة غير محددة"}</span>
                        {record.phone_number && (
                          <span className="before:content-['•'] before:mx-1">
                            {record.phone_number}
                          </span>
                        )}
                      </div>
                    </div>

                    {record.image_url && (
                      <div className="w-full h-40 relative overflow-hidden">
                        <img 
                          src={record.image_url}
                          alt="صورة السجل" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="p-4">
                      <div className="text-xs text-gray-500 mb-2 flex justify-between">
                        <span>كود: {record.code || "غير محدد"}</span>
                        <span>الثقة: {record.confidence || 0}%</span>
                      </div>
                      
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                          عرض النص المستخرج
                        </summary>
                        <div className="bg-muted/30 p-2 mt-1 rounded-md rtl-textarea text-muted-foreground max-h-24 overflow-y-auto text-xs">
                          {record.extracted_text}
                        </div>
                      </details>

                      <div className="mt-3 pt-3 border-t border-border/10 text-xs text-gray-400">
                        {record.created_at && (
                          <div>
                            تم الحفظ: {formatDate(record.created_at)}
                          </div>
                        )}
                        {record.extraction_method && (
                          <div className="mt-1">
                            طريقة الاستخراج: {record.extraction_method === "ocr" ? "OCR" : "Gemini AI"}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Records;
