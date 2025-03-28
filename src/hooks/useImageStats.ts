
import { useState } from "react";

export const useImageStats = () => {
  const [processingProgress, setProcessingProgress] = useState(0);
  const [bookmarkletStats, setBookmarkletStats] = useState({ total: 0, ready: 0, success: 0, error: 0 });
  
  return {
    processingProgress,
    setProcessingProgress,
    bookmarkletStats,
    setBookmarkletStats
  };
};
