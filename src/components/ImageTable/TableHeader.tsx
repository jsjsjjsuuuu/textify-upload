
import React from "react";

const TableHeader: React.FC = () => {
  return (
    <thead className="bg-muted/60 dark:bg-gray-700/90 sticky top-0 z-10">
      <tr className="border-b-2 border-border dark:border-gray-600">
        <th className="font-bold text-sm py-4 px-4 text-center">الرقم</th>
        <th className="font-bold text-sm py-4 px-4">التاريخ</th>
        <th className="font-bold text-sm py-4 px-4">صورة معاينة</th>
        <th className="font-bold text-sm py-4 px-4">الكود</th>
        <th className="font-bold text-sm py-4 px-4">اسم المرسل</th>
        <th className="font-bold text-sm py-4 px-4">رقم الهاتف</th>
        <th className="font-bold text-sm py-4 px-4">المحافظة</th>
        <th className="font-bold text-sm py-4 px-4">السعر</th>
        <th className="font-bold text-sm py-4 px-4">دقة الاستخراج</th>
        <th className="font-bold text-sm py-4 px-4">الحالة</th>
        <th className="font-bold text-sm py-4 px-4">الإجراءات</th>
      </tr>
    </thead>
  );
};

export default TableHeader;
