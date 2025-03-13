
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { AlertCircle, CheckCircle, Info } from "lucide-react"

// مكون لعرض تقرير الإدخال التلقائي
const AutofillReport = ({ report }: { report?: Record<string, any> }) => {
  if (!report) return null;
  
  return (
    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-xs">
      <h3 className="font-semibold mb-1">تقرير الإدخال التلقائي:</h3>
      <ul className="space-y-1">
        {Object.entries(report).map(([key, value]) => {
          // استبعاد الحقول التي تحتوي على كلمة "error" في الاسم
          if (key.toLowerCase().includes('error') && !value) return null;
          
          let displayKey = key;
          switch(key) {
            case 'fieldsFound': displayKey = 'الحقول الموجودة'; break;
            case 'fieldsFilled': displayKey = 'الحقول التي تم ملؤها'; break;
            case 'fieldsMissing': displayKey = 'الحقول المفقودة'; break;
            case 'submitButtonFound': displayKey = 'تم العثور على زر الحفظ'; break;
            case 'submitButtonClicked': displayKey = 'تم النقر على زر الحفظ'; break;
            case 'errorDetails': displayKey = 'تفاصيل الخطأ'; break;
            case 'targetPage': displayKey = 'الصفحة المستهدفة'; break;
          }
          
          // تحويل الروابط إلى رابط متفاعل
          if (typeof value === 'string' && value.startsWith('http')) {
            return (
              <li key={key} className="flex justify-between">
                <span>{displayKey}:</span>
                <a href={value} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline truncate max-w-[200px]">
                  {value.replace(/^https?:\/\//, '')}
                </a>
              </li>
            );
          }
          
          // تحويل المصفوفات إلى قائمة
          if (Array.isArray(value)) {
            return (
              <li key={key}>
                <div>{displayKey}: </div>
                <ul className="mr-4 mt-1">
                  {value.map((item, i) => (
                    <li key={i} className="text-gray-600 dark:text-gray-400">• {item}</li>
                  ))}
                </ul>
              </li>
            );
          }
          
          return (
            <li key={key} className="flex justify-between">
              <span>{displayKey}:</span>
              <span className={typeof value === 'boolean' ? (value ? 'text-green-500' : 'text-red-500') : ''}>
                {typeof value === 'boolean' ? (value ? 'نعم' : 'لا') : String(value)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, report, variant, ...props }) {
        // اختيار الأيقونة المناسبة حسب نوع الإشعار
        let icon = null;
        
        if (variant === 'destructive') {
          icon = <AlertCircle className="h-5 w-5 text-destructive ml-2" />;
        } else if (variant === 'default' && title?.toString().includes('نجاح')) {
          icon = <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 ml-2" />;
        } else if (variant === 'warning') {
          icon = <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 ml-2" />;
        } else {
          icon = <Info className="h-5 w-5 text-blue-500 dark:text-blue-400 ml-2" />;
        }
        
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && (
                <ToastTitle className="text-right flex items-center justify-end">
                  {icon}
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription className="text-right">{description}</ToastDescription>
              )}
              {report && <AutofillReport report={report} />}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
