import React, { useEffect, useState } from "react";
import BackgroundPattern from "@/components/BackgroundPattern";
import AppHeader from "@/components/AppHeader";
import { getExtractedData, deleteExtractedData } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Database, Trash, Eye, Calendar } from "lucide-react";
import { formatDate } from "@/utils/dateFormatter";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ExtractedRecord {
  id: string;
  code: string;
  senderName: string;
  phoneNumber: string;
  province: string;
  price: string;
  companyName: string;
  extractedText: string;
  confidence: number;
  created_at: string;
}

const Records = () => {
  const [records, setRecords] = useState<ExtractedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<ExtractedRecord | null>(null);
  const { toast } = useToast();

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const result = await getExtractedData();
      if (result.success) {
        setRecords(result.data as ExtractedRecord[]);
      } else {
        throw new Error("فشل في جلب البيانات");
      }
    } catch (error) {
      console.error("خطأ في جلب السجلات:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب السجلات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteExtractedData(id);
      if (result.success) {
        setRecords(prev => prev.filter(record => record.id !== id));
        toast({
          title: "تم الحذف",
          description: "تم حذف السجل بنجاح"
        });
      } else {
        throw new Error("فشل في حذف السجل");
      }
    } catch (error) {
      console.error("خطأ في حذف السجل:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف السجل",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (record: ExtractedRecord) => {
    setSelectedRecord(record);
  };

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="container px-4 sm:px-6 py-4 sm:py-6 mx-auto max-w-6xl">
        <AppHeader />

        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-brand-brown dark:text-brand-beige flex items-center">
              <Database className="mr-2 h-6 w-6" />
              السجلات المحفوظة
            </h1>
            <div className="flex items-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchRecords}
                className="flex items-center"
              >
                <Calendar className="mr-2 h-4 w-4" />
                تحديث
              </Button>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm border border-border rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="h-6 w-6 mr-2 rounded-full border-2 border-brand-coral/40 border-t-brand-coral animate-spin mx-auto"></div>
                <p className="mt-2 text-muted-foreground">جاري تحميل السجلات...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">لا توجد سجلات محفوظة حتى الآن.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>قائمة بالسجلات المحفوظة في قاعدة البيانات</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">الكود</TableHead>
                      <TableHead>اسم المرسل</TableHead>
                      <TableHead>رقم الهاتف</TableHead>
                      <TableHead>المحافظة</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>اسم الشركة</TableHead>
                      <TableHead>دقة الاستخراج</TableHead>
                      <TableHead>تاريخ الإنشاء</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.code || "-"}</TableCell>
                        <TableCell>{record.senderName || "-"}</TableCell>
                        <TableCell>{record.phoneNumber || "-"}</TableCell>
                        <TableCell>{record.province || "-"}</TableCell>
                        <TableCell>{record.price || "-"}</TableCell>
                        <TableCell>{record.companyName || "-"}</TableCell>
                        <TableCell>{record.confidence ? `${record.confidence}%` : "-"}</TableCell>
                        <TableCell>{formatDate(new Date(record.created_at))}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewDetails(record)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(record.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {selectedRecord && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">تفاصيل السجل</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">الكود</p>
                    <p>{selectedRecord.code || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">اسم المرسل</p>
                    <p>{selectedRecord.senderName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                    <p>{selectedRecord.phoneNumber || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">المحافظة</p>
                    <p>{selectedRecord.province || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">السعر</p>
                    <p>{selectedRecord.price || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">اسم الشركة</p>
                    <p>{selectedRecord.companyName || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">النص المستخرج</p>
                    <div className="bg-muted/30 p-2 mt-1 rounded-md rtl-textarea text-muted-foreground max-h-40 overflow-y-auto text-xs">
                      {selectedRecord.extractedText || "-"}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRecord(null)}
                  >
                    إغلاق
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Records;
