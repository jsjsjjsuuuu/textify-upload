
import React from "react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, AlertTriangle } from "lucide-react";

interface ResetPasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  isOpen,
  onOpenChange,
  onCancel,
  onConfirm,
  isProcessing,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="admin-card bg-[#111936]/90 border-[#2a325a]/60">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 text-red-400">
            <Shield className="h-6 w-6" />
            <AlertDialogTitle>تأكيد إعادة تعيين كلمة المرور</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-blue-200/70 mt-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                هل أنت متأكد من أنك تريد إعادة تعيين كلمة المرور لهذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه وسيتم استخدام كلمة المرور الجديدة التي قمت بإدخالها.
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className="flex justify-end gap-3 w-full">
            <button 
              className="admin-button admin-button-secondary"
              onClick={onCancel}
              disabled={isProcessing}
            >
              إلغاء
            </button>
            <button 
              className="admin-button admin-button-danger"
              onClick={onConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  جاري إعادة التعيين...
                </>
              ) : (
                "تأكيد إعادة التعيين"
              )}
            </button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ResetPasswordDialog;
