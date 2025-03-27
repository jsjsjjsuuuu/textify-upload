
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';

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
  isProcessing
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تأكيد إعادة تعيين كلمة المرور</DialogTitle>
          <DialogDescription>
            هل أنت متأكد من أنك تريد إعادة تعيين كلمة مرور هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <div className="flex gap-2 w-full justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                  جاري التنفيذ...
                </>
              ) : (
                'تأكيد إعادة التعيين'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
