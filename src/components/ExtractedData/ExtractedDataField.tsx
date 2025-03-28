
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface ExtractedDataFieldProps {
  label: string;
  field: string;
  value: string;
  onChange: (field: string, value: string) => void;
  editMode: boolean;
  className?: string;
  hideConfidence?: boolean; // إضافة خاصية لإخفاء قيم الثقة
}

const ExtractedDataField = ({
  label,
  field,
  value,
  onChange,
  editMode,
  className = "",
  hideConfidence = false
}: ExtractedDataFieldProps) => {
  const isTextArea = field === "address" || field === "notes";

  // تنسيق العرض
  const isRequiredField = 
    field === "code" || 
    field === "senderName" || 
    field === "phoneNumber" || 
    field === "province" || 
    field === "price";

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">
            {label}
            {isRequiredField && (
              <span className="text-red-500 mr-1">*</span>
            )}
          </label>
          
          {editMode ? (
            isTextArea ? (
              <Textarea
                value={value}
                onChange={(e) => onChange(field, e.target.value)}
                className="w-full text-sm resize-none h-20"
                placeholder={`أدخل ${label.replace(':', '')}`}
              />
            ) : (
              <Input
                type="text"
                value={value}
                onChange={(e) => onChange(field, e.target.value)}
                className="w-full text-sm"
                placeholder={`أدخل ${label.replace(':', '')}`}
              />
            )
          ) : (
            isTextArea ? (
              <div className="px-3 py-2 rounded-md border bg-muted/50 text-sm min-h-[5rem] whitespace-pre-wrap">
                {value || <span className="text-muted-foreground italic">لا توجد بيانات</span>}
              </div>
            ) : (
              <div className="px-3 py-2 rounded-md border bg-muted/50 text-sm">
                {value || <span className="text-muted-foreground italic">لا توجد بيانات</span>}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtractedDataField;
