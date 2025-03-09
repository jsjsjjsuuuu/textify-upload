
import { Badge } from "@/components/ui/badge";

interface LearningNotificationsProps {
  correctionsMade: boolean;
  isLearningActive: boolean;
}

const LearningNotifications = ({ 
  correctionsMade, 
  isLearningActive 
}: LearningNotificationsProps) => {
  if (!correctionsMade && !isLearningActive) return null;
  
  return (
    <>
      {correctionsMade && (
        <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400">
            تم حفظ التصحيحات للتعلم
          </Badge>
          <p className="text-xs text-green-700 dark:text-green-400 mt-1">
            سيتم استخدام هذه التصحيحات لتحسين دقة الاستخراج في المرات القادمة
          </p>
        </div>
      )}

      {isLearningActive && (
        <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md flex items-center">
          <div className="animate-pulse mr-2 w-2 h-2 bg-blue-500 rounded-full"></div>
          <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            جاري التعلم من التصحيحات...
          </Badge>
        </div>
      )}
    </>
  );
};

export default LearningNotifications;
