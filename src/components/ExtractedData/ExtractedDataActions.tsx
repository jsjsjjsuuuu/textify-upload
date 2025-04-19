
import { Button } from "@/components/ui/button";
import {
  Edit,
  Save,
  XCircle,
  ClipboardCopy,
  Bot,
  Wand2,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ExtractedDataActionsProps {
  editMode: boolean;
  onEditToggle: () => void;
  onCancel: () => void;
  onCopyText: () => void;
  onAutoExtract: () => void;
  hasExtractedText: boolean;
  onDelete?: () => void;
}

const ExtractedDataActions = ({
  editMode,
  onEditToggle,
  onCancel,
  onCopyText,
  onAutoExtract,
  hasExtractedText,
  onDelete
}: ExtractedDataActionsProps) => {
  return (
    <div className="flex flex-wrap gap-2 justify-end" dir="rtl">
      <TooltipProvider>
        <div className="space-x-2 rtl:space-x-reverse">
          {editMode ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCancel}
                    className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>إلغاء التعديلات</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    onClick={onEditToggle}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    حفظ
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>حفظ التغييرات</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEditToggle}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border-blue-200"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    تعديل
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>تعديل البيانات</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onCopyText}
                className="bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-700 border-amber-200"
              >
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>نسخ النص المستخرج</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onAutoExtract}
                disabled={!hasExtractedText}
                className="bg-purple-50 hover:bg-purple-100 text-purple-600 hover:text-purple-700 border-purple-200 disabled:opacity-50"
              >
                <Wand2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>استخراج البيانات تلقائيًا</p>
            </TooltipContent>
          </Tooltip>

          {onDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onDelete}
                  className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>حذف الصورة</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
};

export default ExtractedDataActions;
