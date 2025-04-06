
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, RefreshCw, AlertTriangle } from "lucide-react";

interface ResetPasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
  isProcessing
}) => {
  // إغلاق مربع الحوار تلقائيًا بعد المعالجة
  const handleConfirm = () => {
    // تسجيل بيانات التصحيح
    console.log('تأكيد إعادة تعيين كلمة المرور من مربع الحوار');
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>تأكيد إعادة تعيين كلمة المرور</DialogTitle>
          </div>
          <DialogDescription className="mt-2">
            <div className="flex flex-col gap-2">
              <p>هل أنت متأكد من رغبتك في إعادة تعيين كلمة مرور هذا المستخدم؟</p>
              <div className="bg-amber-50 p-3 rounded-md border border-amber-200 mt-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    <strong>تنبيه هام:</strong> هذا الإجراء لا يمكن التراجع عنه. سيتم استبدال كلمة المرور الحالية للمستخدم بالكلمة الجديدة التي أدخلتها.
                  </p>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            إلغاء
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isProcessing}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                جاري المعالجة...
              </>
            ) : 'تأكيد إعادة التعيين'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
