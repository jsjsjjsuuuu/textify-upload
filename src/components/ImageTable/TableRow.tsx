
import React from "react";
import { ImageData } from "@/types/ImageData";
import StatusBadge from "./StatusBadge";
import RowActions from "./RowActions";
import ImagePreviewCell from "./ImagePreviewCell";
import ConfidenceIndicator from "./ConfidenceIndicator";
import PhoneNumberCell from "./PhoneNumberCell";

interface TableRowProps {
  image: ImageData;
  isSubmitting: boolean;
  onImageClick: (image: ImageData) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

const TableRow: React.FC<TableRowProps> = ({
  image,
  isSubmitting,
  onImageClick,
  onDelete,
  onSubmit,
  formatDate
}) => {
  // التحقق من صحة رقم الهاتف
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
  
  return (
    <tr 
      className="hover:bg-muted/30 dark:hover:bg-gray-700/40 transition-colors border-b border-border/50 dark:border-gray-700/50 last:border-none"
    >
      <td className="py-3.5 px-4 text-sm text-center font-semibold">{image.number}</td>
      <td className="py-3.5 px-4 text-sm">{formatDate(image.date)}</td>
      <td className="py-3.5 px-4">
        <ImagePreviewCell 
          imageId={image.id} 
          previewUrl={image.previewUrl} 
          onClick={() => onImageClick(image)} 
        />
      </td>
      <td className="py-3.5 px-4 text-sm font-medium">{image.code || "—"}</td>
      <td className="py-3.5 px-4 text-sm">{image.senderName || "—"}</td>
      <td className="py-3.5 px-4 text-sm relative">
        <PhoneNumberCell phoneNumber={image.phoneNumber} />
      </td>
      <td className="py-3.5 px-4 text-sm">{image.province || "—"}</td>
      <td className="py-3.5 px-4 text-sm font-medium">{image.price ? `${image.price} د.ع` : "—"}</td>
      <td className="py-3.5 px-4 text-sm">
        <ConfidenceIndicator confidence={image.confidence} />
      </td>
      <td className="py-3.5 px-4 text-sm">
        <StatusBadge status={image.status} submitted={image.submitted} />
      </td>
      <td className="py-3.5 px-4">
        <RowActions 
          imageId={image.id}
          status={image.status}
          submitted={image.submitted}
          isSubmitting={isSubmitting}
          isPhoneNumberValid={isPhoneNumberValid}
          onDelete={onDelete}
          onSubmit={onSubmit}
          onDetails={() => onImageClick(image)}
        />
      </td>
    </tr>
  );
};

export default TableRow;
