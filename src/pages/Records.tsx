
import React, { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { Search, ChevronDown, ArrowUp, ArrowDown, File, Receipt, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatDate } from "@/utils/dateFormatter";
import { ImageData } from "@/types/ImageData";
import { useImageProcessing } from "@/hooks/useImageProcessing";

// مكون الصفحة الرئيسي
const Records = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("number");
  const [sortDirection, setSortDirection] = useState("desc");
  
  // استخدام hook معالجة الصور للحصول على بيانات الصور
  const {
    images,
    isSubmitting,
    handleDelete,
    handleSubmitToApi,
    formatDate: formatImageDate
  } = useImageProcessing();

  // التعامل مع الفرز
  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // تطبيق الفرز والبحث على البيانات
  const filteredAndSortedImages = React.useMemo(() => {
    let recordImages = [...images];

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
  }, [images, searchTerm, sortField, sortDirection]);

  // رمز السهم للفرز
  const getSortIcon = (field) => {
    if (sortField !== field) return <ChevronDown className="h-4 w-4 opacity-50" />;
    if (sortDirection === "asc") return <ArrowUp className="h-4 w-4" />;
    return <ArrowDown className="h-4 w-4" />;
  };

  // أيقونة الحالة
  const getStatusBadge = (status, isSubmitted) => {
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
      <main className="container mx-auto p-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* عنوان الصفحة */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-medium tracking-tight">سجلات الوصولات</h1>
              <p className="text-muted-foreground mt-1">
                إدارة ومراجعة سجلات الوصولات المستخرجة
              </p>
            </div>
            <Button asChild>
              <Link to="/upload" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                إضافة وصولات جديدة
              </Link>
            </Button>
          </div>

          {/* فلتر البحث */}
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في السجلات... (الكود، الاسم، رقم الهاتف، المحافظة)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 text-right"
            />
          </div>

          {/* جدول السجلات */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead 
                      className="text-right font-medium cursor-pointer px-6 py-4 hover:bg-muted/60 transition-colors"
                      onClick={() => handleSort("number")}
                    >
                      <div className="flex justify-between items-center">
                        <span>الرقم</span>
                        {getSortIcon("number")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right font-medium cursor-pointer px-6 py-4 hover:bg-muted/60 transition-colors"
                      onClick={() => handleSort("date")}
                    >
                      <div className="flex justify-between items-center">
                        <span>التاريخ</span>
                        {getSortIcon("date")}
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-medium px-6 py-4">
                      صورة
                    </TableHead>
                    <TableHead 
                      className="text-right font-medium cursor-pointer px-6 py-4 hover:bg-muted/60 transition-colors"
                      onClick={() => handleSort("code")}
                    >
                      <div className="flex justify-between items-center">
                        <span>الكود</span>
                        {getSortIcon("code")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right font-medium cursor-pointer px-6 py-4 hover:bg-muted/60 transition-colors"
                      onClick={() => handleSort("senderName")}
                    >
                      <div className="flex justify-between items-center">
                        <span>اسم المرسل</span>
                        {getSortIcon("senderName")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right font-medium cursor-pointer px-6 py-4 hover:bg-muted/60 transition-colors"
                      onClick={() => handleSort("phoneNumber")}
                    >
                      <div className="flex justify-between items-center">
                        <span>رقم الهاتف</span>
                        {getSortIcon("phoneNumber")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right font-medium cursor-pointer px-6 py-4 hover:bg-muted/60 transition-colors"
                      onClick={() => handleSort("province")}
                    >
                      <div className="flex justify-between items-center">
                        <span>المحافظة</span>
                        {getSortIcon("province")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right font-medium cursor-pointer px-6 py-4 hover:bg-muted/60 transition-colors"
                      onClick={() => handleSort("price")}
                    >
                      <div className="flex justify-between items-center">
                        <span>السعر</span>
                        {getSortIcon("price")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right font-medium cursor-pointer px-6 py-4 hover:bg-muted/60 transition-colors"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex justify-between items-center">
                        <span>الحالة</span>
                        {getSortIcon("status")}
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-medium px-6 py-4">
                      الإجراءات
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedImages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        {images.length === 0 ? 
                          <div className="flex flex-col items-center gap-2">
                            <CalendarDays className="h-10 w-10 text-muted-foreground/60" />
                            <p>لا توجد سجلات بعد.</p>
                            <Button asChild size="sm" className="mt-2">
                              <Link to="/upload">إضافة وصولات جديدة</Link>
                            </Button>
                          </div>
                          : 
                          "لم يتم العثور على أي سجلات مطابقة لكلمة البحث."
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedImages.map((image) => (
                      <TableRow 
                        key={image.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-medium px-6 py-4">
                          {image.number || "-"}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-muted-foreground">{formatImageDate(image.date)}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div 
                            className="w-16 h-16 rounded-lg overflow-hidden bg-transparent cursor-pointer border border-border/40 dark:border-gray-700/40"
                          >
                            <img 
                              src={image.previewUrl} 
                              alt="صورة مصغرة" 
                              className="object-contain h-full w-full" 
                              style={{ mixBlendMode: 'multiply' }} 
                            />
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 font-medium">
                          {image.code || "-"}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {image.senderName || "-"}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className={!image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11 ? "" : "text-destructive"}>
                            {image.phoneNumber || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {image.province || "-"}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className={image.price && parseFloat(image.price.replace(/[^\d.]/g, '')) < 0 ? "text-destructive" : ""}>
                            {image.price || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {getStatusBadge(image.status, image.submitted)}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex gap-2 items-center">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 rounded-full bg-muted/30 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                              asChild
                            >
                              <Link to={`/automation/${image.id}`}>
                                <File className="h-4 w-4" />
                              </Link>
                            </Button>
                            {image.status === "completed" && !image.submitted && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 rounded-full bg-muted/30 text-brand-green hover:bg-brand-green/10"
                                disabled={isSubmitting || (image.phoneNumber && image.phoneNumber.replace(/[^\d]/g, '').length !== 11)}
                                onClick={() => handleSubmitToApi(image.id, image)}
                              >
                                <Receipt className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* معلومات إضافية */}
          <p className="text-center text-sm text-muted-foreground">
            تم عرض {filteredAndSortedImages.length} من إجمالي {images.length} سجل
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Records;
