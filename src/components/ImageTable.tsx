
import React from 'react';
import { ImageData } from "@/types/ImageData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash } from "lucide-react";

interface ImageTableProps {
  images: ImageData[];
  onDelete: (id: string) => void;
  onView: (image: ImageData) => void;
  formatDate: (date: Date) => string;
}

const ImageTable: React.FC<ImageTableProps> = ({
  images,
  onDelete,
  onView,
  formatDate
}) => {
  if (!images.length) return null;

  // تجميع الصور حسب batch_id
  const groupedImages: { [key: string]: ImageData[] } = {};
  
  images.forEach(image => {
    const batchId = image.batch_id || 'default';
    if (!groupedImages[batchId]) {
      groupedImages[batchId] = [];
    }
    groupedImages[batchId].push(image);
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'processed':
      case 'completed':
        return <Badge className="bg-green-500">تمت المعالجة</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">جاري المعالجة</Badge>;
      case 'error':
        return <Badge className="bg-red-500">خطأ</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">قيد الانتظار</Badge>;
      default:
        return <Badge className="bg-gray-500">غير معروف</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-[180px]">اسم الملف</TableHead>
            <TableHead>التاريخ</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="text-right">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {images.map((image, index) => (
            <TableRow key={image.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{image.fileName || 'غير معروف'}</TableCell>
              <TableCell>{image.date ? formatDate(image.date) : 'غير معروف'}</TableCell>
              <TableCell>{getStatusBadge(image.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="icon" variant="ghost" onClick={() => onView(image)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(image.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ImageTable;
