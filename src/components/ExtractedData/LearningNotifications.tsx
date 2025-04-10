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
  return <>
      {correctionsMade}

      {isLearningActive && <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md flex items-center">
          <div className="animate-pulse mr-2 w-2 h-2 bg-blue-500 rounded-full"></div>
          <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            جاري التعلم من التصحيحات...
          </Badge>
        </div>}
    </>;
};
export default LearningNotifications;