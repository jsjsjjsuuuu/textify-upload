
import { useImageProcessingCore } from "@/hooks/useImageProcessingCore";
import { formatDate } from "@/utils/dateFormatter";

export const useImageProcessing = () => {
  return {
    ...useImageProcessingCore(),
    formatDate
  };
};

