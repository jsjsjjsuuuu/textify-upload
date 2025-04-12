
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader } from 'lucide-react';

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
      <DialogContent className="bg-[#0e1529] border-0 text-white/90 rounded-xl shadow-2xl relative overflow-hidden">
        {/* تأثير توهج خلفية الطبق */}
        <div className="absolute inset-0 -bottom-10 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent blur-2xl opacity-50"></div>
        <div className="absolute inset-0 -top-10 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent blur-2xl opacity-50"></div>
        
        {/* ظل داخلي */}
        <div className="absolute inset-0 shadow-inner pointer-events-none"></div>
        
        {/* تأثير انعكاس أعلى الطبق */}
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-white/5 to-transparent opacity-50"></div>
        
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-xl font-medium flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            تأكيد إعادة تعيين كلمة المرور
          </DialogTitle>
          <DialogDescription className="text-white/70 text-base mt-2">
            هل أنت متأكد من رغبتك في تغيير كلمة المرور للمستخدم؟
            <br />
            <span className="text-amber-400 mt-2 block">لا يمكن التراجع عن هذا الإجراء.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-end gap-3 mt-4 relative z-10">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="bg-transparent hover:bg-white/10 text-white/90 border border-white/20 shadow-md hover:shadow-lg transition-all duration-300"
            disabled={isProcessing}
          >
            إلغاء
          </Button>
          <Button 
            type="button" 
            onClick={onConfirm}
            className="bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                جاري التنفيذ...
              </>
            ) : (
              'تأكيد إعادة التعيين'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
