
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, X } from "lucide-react";

interface AutofillReportComponentProps {
  report: Record<string, any>;
  compact?: boolean;
}

const AutofillReportComponent = ({ report, compact = false }: AutofillReportComponentProps) => {
  if (!report) return null;
  
  const isSuccess = report.success === true;
  const hasWarnings = Array.isArray(report.warnings) && report.warnings.length > 0;
  const hasErrors = report.error || (Array.isArray(report.errors) && report.errors.length > 0);
  
  const getStatusBadge = () => {
    if (isSuccess) return <Badge className="bg-green-500">نجاح</Badge>;
    if (hasWarnings && !hasErrors) return <Badge className="bg-yellow-500">تحذير</Badge>;
    if (hasErrors) return <Badge className="bg-red-500">فشل</Badge>;
    return <Badge>معلومات</Badge>;
  };
  
  return (
    <Card className={`border border-slate-200 dark:border-slate-700 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
          تقرير الإدخال التلقائي
        </h3>
        {getStatusBadge()}
      </div>
      
      <div className={`space-y-2 ${compact ? 'text-xs' : 'text-sm'}`}>
        {/* عرض ملخص العملية */}
        <div className="flex items-center">
          {isSuccess ? (
            <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
          ) : hasErrors ? (
            <AlertCircle className="h-4 w-4 text-red-500 ml-2" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-500 ml-2" />
          )}
          <span className="font-medium">
            {isSuccess 
              ? "تم الإدخال التلقائي بنجاح" 
              : hasErrors 
                ? "فشلت عملية الإدخال التلقائي" 
                : "اكتملت العملية مع وجود تحذيرات"}
          </span>
        </div>
        
        {/* عرض تفاصيل الحقول */}
        {report.fieldsFound && (
          <div className="mt-2">
            <p className="text-slate-500 dark:text-slate-400 mb-1">الحقول التي تم العثور عليها:</p>
            <div className="flex flex-wrap gap-1">
              {report.fieldsFound.map((field: string, index: number) => (
                <Badge key={index} variant="outline" className="bg-slate-100 dark:bg-slate-800">
                  {field}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {report.fieldsFilled && (
          <div className="mt-2">
            <p className="text-slate-500 dark:text-slate-400 mb-1">الحقول التي تم ملؤها:</p>
            <div className="flex flex-wrap gap-1">
              {report.fieldsFilled.map((field: string, index: number) => (
                <Badge key={index} variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                  {field}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {report.fieldsMissing && report.fieldsMissing.length > 0 && (
          <div className="mt-2">
            <p className="text-slate-500 dark:text-slate-400 mb-1">الحقول المفقودة:</p>
            <div className="flex flex-wrap gap-1">
              {report.fieldsMissing.map((field: string, index: number) => (
                <Badge key={index} variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                  {field}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* عرض عمليات الأزرار */}
        {report.submitButtonFound !== undefined && (
          <div className="flex items-center mt-2">
            {report.submitButtonFound ? (
              <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
            ) : (
              <X className="h-4 w-4 text-red-500 ml-2" />
            )}
            <span>
              {report.submitButtonFound 
                ? "تم العثور على زر الحفظ/الإضافة" 
                : "لم يتم العثور على زر الحفظ/الإضافة"}
            </span>
          </div>
        )}
        
        {report.submitButtonClicked !== undefined && (
          <div className="flex items-center">
            {report.submitButtonClicked ? (
              <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
            ) : (
              <X className="h-4 w-4 text-red-500 ml-2" />
            )}
            <span>
              {report.submitButtonClicked 
                ? "تم النقر على زر الحفظ/الإضافة" 
                : "فشل النقر على زر الحفظ/الإضافة"}
            </span>
          </div>
        )}
        
        {/* عرض الأخطاء */}
        {report.error && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
            <p className="font-medium">تفاصيل الخطأ:</p>
            <p>{report.error}</p>
          </div>
        )}
        
        {Array.isArray(report.errors) && report.errors.length > 0 && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
            <p className="font-medium">الأخطاء:</p>
            <ul className="list-disc mr-5 space-y-1">
              {report.errors.map((error: string, index: number) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* عرض التحذيرات */}
        {Array.isArray(report.warnings) && report.warnings.length > 0 && (
          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-md">
            <p className="font-medium">تحذيرات:</p>
            <ul className="list-disc mr-5 space-y-1">
              {report.warnings.map((warning: string, index: number) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* عرض مدة العملية */}
        {report.duration && (
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            استغرقت العملية: {typeof report.duration === 'number' ? `${report.duration} مللي ثانية` : report.duration}
          </p>
        )}
      </div>
    </Card>
  );
};

export default AutofillReportComponent;
