
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export const useFileUpload = (
  addToQueue: (files: File[]) => boolean,
  startProcessing: () => boolean,
  processBatch: () => void
) => {
  const { toast } = useToast();

  /**
   * Handle file selection and start processing queue
   */
  const handleFileChange = useCallback(async (files: FileList | null) => {
    console.log("handleFileChange called with files:", files);
    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }
    
    const fileArray = Array.from(files);
    console.log("Checking for duplicate files from", fileArray.length, "selected files");
    
    // Add files to queue and start processing if not already processing
    const filesAdded = addToQueue(fileArray);
    
    if (filesAdded && startProcessing()) {
      // Use setTimeout to allow the state update to complete first
      setTimeout(() => {
        processBatch();
      }, 100);
    }
  }, [addToQueue, startProcessing, processBatch]);

  return {
    handleFileChange
  };
};
