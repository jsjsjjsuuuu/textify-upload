
import React, { useState } from "react";
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
import { Search, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// بيانات وهمية للجدول
const RECORDS_DATA = [
  {
    id: 1,
    name: "أحمد محمد",
    email: "ahmed.m@example.com",
    location: "الرياض، المملكة العربية السعودية",
    status: "نشط",
    balance: 1250.00,
  },
  {
    id: 2,
    name: "سارة عبدالله",
    email: "sarah.a@example.com",
    location: "دبي، الإمارات العربية المتحدة",
    status: "نشط",
    balance: 600.00,
  },
  {
    id: 3,
    name: "محمد خالد",
    email: "mohammad.k@example.com",
    location: "القاهرة، مصر",
    status: "غير نشط",
    balance: 650.00,
  },
  {
    id: 4,
    name: "مريم العلي",
    email: "mariam.a@example.com",
    location: "عمان، الأردن",
    status: "نشط",
    balance: 0.00,
  },
  {
    id: 5,
    name: "فيصل سعود",
    email: "faisal.s@example.com",
    location: "الكويت، الكويت",
    status: "نشط",
    balance: -1000.00,
  },
];

// أنواع الفرز
type SortDirection = "asc" | "desc" | null;
type SortField = "name" | "email" | "location" | "status" | "balance" | null;

// مكون الصفحة الرئيسي
const Records = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // التعامل مع الفرز
  const handleSort = (field: SortField) => {
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
  const filteredAndSortedRecords = React.useMemo(() => {
    let records = [...RECORDS_DATA];

    // تطبيق البحث
    if (searchTerm) {
      records = records.filter(
        (record) =>
          record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // تطبيق الفرز
    if (sortField && sortDirection) {
      records.sort((a, b) => {
        let valueA = a[sortField];
        let valueB = b[sortField];

        if (typeof valueA === "string" && typeof valueB === "string") {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }

        if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
        if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return records;
  }, [searchTerm, sortField, sortDirection]);

  // رمز السهم للفرز
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronDown className="h-4 w-4 opacity-50" />;
    if (sortDirection === "asc") return <ArrowUp className="h-4 w-4" />;
    return <ArrowDown className="h-4 w-4" />;
  };

  // أيقونة الحالة
  const getStatusBadge = (status: string) => {
    if (status === "نشط") {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30">
          {status}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60">
        {status}
      </Badge>
    );
  };

  // تنسيق المبلغ
  const formatBalance = (balance: number) => {
    const formatter = new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SAR",
    });
    return formatter.format(balance);
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
              <h1 className="text-3xl font-medium tracking-tight">السجلات</h1>
              <p className="text-muted-foreground mt-1">
                إدارة ومراجعة سجلات العملاء
              </p>
            </div>
          </div>

          {/* فلتر البحث */}
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في السجلات..."
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
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex justify-between items-center">
                        <span>الاسم</span>
                        {getSortIcon("name")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right font-medium cursor-pointer px-6 py-4 hover:bg-muted/60 transition-colors"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex justify-between items-center">
                        <span>البريد الإلكتروني</span>
                        {getSortIcon("email")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right font-medium cursor-pointer px-6 py-4 hover:bg-muted/60 transition-colors"
                      onClick={() => handleSort("location")}
                    >
                      <div className="flex justify-between items-center">
                        <span>الموقع</span>
                        {getSortIcon("location")}
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
                    <TableHead 
                      className="text-right font-medium cursor-pointer px-6 py-4 hover:bg-muted/60 transition-colors"
                      onClick={() => handleSort("balance")}
                    >
                      <div className="flex justify-between items-center">
                        <span>الرصيد</span>
                        {getSortIcon("balance")}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        لم يتم العثور على أي سجلات.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedRecords.map((record) => (
                      <TableRow 
                        key={record.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-medium px-6 py-4">
                          {record.name}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-muted-foreground">{record.email}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {record.location}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {getStatusBadge(record.status)}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className={record.balance < 0 ? "text-destructive" : record.balance > 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                            {formatBalance(record.balance)}
                          </span>
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
            تم عرض {filteredAndSortedRecords.length} من إجمالي {RECORDS_DATA.length} سجل
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Records;
