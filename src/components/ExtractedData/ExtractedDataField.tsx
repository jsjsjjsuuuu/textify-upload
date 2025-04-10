import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
interface ExtractedDataFieldProps {
  label: string;
  field: string;
  value: string;
  onChange: (field: string, value: string) => void;
  editMode: boolean;
  className?: string;
  hideConfidence?: boolean;
  confidence?: number;
  isLoading?: boolean;
}
const ExtractedDataField = ({
  label,
  field,
  value,
  onChange,
  editMode,
  className = "",
  hideConfidence = false,
  confidence,
  isLoading = false
}: ExtractedDataFieldProps) => {
  const isTextArea = field === "address" || field === "notes";

  // تنسيق العرض
  const isRequiredField = field === "code" || field === "senderName" || field === "phoneNumber" || field === "province" || field === "price";

  // تحديد لون البطاقة بناءً على نسبة الثقة
  const getBadgeVariant = (confidenceValue: number) => {
    if (confidenceValue >= 90) return "green";
    if (confidenceValue >= 70) return "blue";
    if (confidenceValue >= 50) return "yellow";
    return "red";
  };
  return <div className="">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium flex items-center">
            {label}
            {isRequiredField && <span className="text-red-500 mr-1">*</span>}
          </label>
          
          {!hideConfidence && confidence !== undefined && <Badge variant={getBadgeVariant(confidence) as any} className={`text-[10px] h-5 px-1.5 ${confidence >= 90 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : confidence >= 70 ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" : confidence >= 50 ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"}`}>
              الثقة: {confidence}%
            </Badge>}
        </div>
        
        {editMode ? isTextArea ? <Textarea value={value} onChange={e => onChange(field, e.target.value)} className="w-full text-sm resize-none h-16 bg-white dark:bg-gray-800" placeholder={`أدخل ${label.replace(':', '')}`} disabled={isLoading} /> : <div className="relative">
              <Input type="text" value={value} onChange={e => onChange(field, e.target.value)} className={`w-full text-sm bg-white dark:bg-gray-800 ${isLoading ? 'pr-8' : ''}`} placeholder={`أدخل ${label.replace(':', '')}`} disabled={isLoading} />
              {isLoading && <div className="absolute inset-y-0 right-2 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>}
            </div> : isTextArea ? <div className={`px-3 py-2 rounded-md border bg-white dark:bg-gray-800 text-sm min-h-[4rem] whitespace-pre-wrap ${isLoading ? 'animate-pulse' : ''}`}>
              {isLoading ? <div className="flex items-center h-full justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground mr-2">جاري الاستخراج...</span>
                </div> : value || <span className="text-muted-foreground italic">لا توجد بيانات</span>}
            </div> : <div className={`px-3 py-2 rounded-md border bg-white dark:bg-gray-800 text-sm ${isLoading ? 'animate-pulse' : ''}`}>
              {isLoading ? <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground mr-2">جاري الاستخراج...</span>
                </div> : value || <span className="text-muted-foreground italic">لا توجد بيانات</span>}
            </div>}
      </div>
    </div>;
};
export default ExtractedDataField;