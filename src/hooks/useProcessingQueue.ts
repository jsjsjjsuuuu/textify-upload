
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

// Constants for batch processing
export const BATCH_SIZE = 5; // Process 5 images at a time
export const BATCH_DELAY = 1000; // 1 second delay between batches

export const useProcessingQueue = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingQueue, setProcessingQueue] = useState<File[]>([]);
  const [queueTotal, setQueueTotal] = useState(0);
  const [processedFileHashes, setProcessedFileHashes] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  /**
   * Create a simple hash for a file to prevent duplicate processing
   */
  const createFileHash = useCallback((file: File): string => {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }, []);

  /**
   * Add files to the processing queue
   */
  const addToQueue = useCallback((files: File[]) => {
    // Filter out any duplicate files using our hash function
    const uniqueFiles = files.filter(file => {
      const fileHash = createFileHash(file);
      if (processedFileHashes.has(fileHash)) {
        console.log(`Skipping duplicate file: ${file.name}`);
        return false;
      }
      
      // Add to processed set to prevent future duplicates
      setProcessedFileHashes(prev => {
        const newSet = new Set(prev);
        newSet.add(fileHash);
        return newSet;
      });
      
      return true;
    });
    
    if (uniqueFiles.length === 0) {
      console.log("All selected files are duplicates, nothing to process");
      toast({
        title: "ملفات مكررة",
        description: "تم تجاهل الملفات المكررة",
        variant: "default"
      });
      return false;
    }
    
    console.log("Adding", uniqueFiles.length, "unique files to processing queue");
    
    // Add files to queue
    setProcessingQueue(prevQueue => [...prevQueue, ...uniqueFiles]);
    setQueueTotal(prevTotal => prevTotal + uniqueFiles.length);
    setProcessingProgress(0);
    
    return true;
  }, [createFileHash, processedFileHashes, toast]);

  /**
   * Get the next batch of files to process
   */
  const getNextBatch = useCallback(() => {
    if (processingQueue.length === 0) {
      return { batch: [], remaining: [] };
    }
    
    const currentBatch = processingQueue.slice(0, BATCH_SIZE);
    const remainingQueue = processingQueue.slice(BATCH_SIZE);
    
    return { batch: currentBatch, remaining: remainingQueue };
  }, [processingQueue]);

  /**
   * Update the queue after processing a batch
   */
  const updateQueueAfterBatch = useCallback((remainingQueue: File[]) => {
    setProcessingQueue(remainingQueue);
    
    // Update progress
    const processedCount = queueTotal - remainingQueue.length;
    const progress = Math.round(processedCount / queueTotal * 100);
    console.log("Processing progress:", progress + "%");
    setProcessingProgress(progress);
    
    if (remainingQueue.length === 0) {
      setQueueTotal(0);
    }
  }, [queueTotal]);

  /**
   * Start processing the queue
   */
  const startProcessing = useCallback(() => {
    if (!isProcessing && processingQueue.length > 0) {
      setIsProcessing(true);
      return true;
    }
    return false;
  }, [isProcessing, processingQueue.length]);

  /**
   * Finish processing
   */
  const finishProcessing = useCallback((success: boolean = true) => {
    setIsProcessing(false);
    if (success) {
      setProcessingProgress(100);
    }
  }, []);

  return {
    isProcessing,
    processingProgress,
    processingQueue,
    queueTotal,
    processedFileHashes,
    addToQueue,
    getNextBatch,
    updateQueueAfterBatch,
    startProcessing,
    finishProcessing,
    createFileHash
  };
};
