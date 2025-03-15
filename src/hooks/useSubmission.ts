import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageWithId } from "@/types/ImageData";

interface BookmarkletStats {
  total: number;
  ready: number;
  success: number;
  error: number;
}

export const useImageProcessing = () => {
  const [images, setImages] = useState<ImageWithId[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useGemini, setUseGemini] = useState(false);
  const [bookmarkletStats, setBookmarkletStats] = useState<BookmarkletStats>({
    total: 0,
    ready: 0,
    success: 0,
    error: 0,
  });
  const { toast } = useToast();

  const updateBookmarkletStats = useCallback(async () => {
    try {
      const response = await fetch("/api/bookmarklet/stats");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBookmarkletStats(data);
    } catch (error: any) {
      console.error("Failed to update bookmarklet stats:", error);
      toast({
        title: "Error",
        description: `Failed to update bookmarklet stats: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Fetch stats on component mount
  // useEffect(() => {
  //   updateBookmarkletStats();
  // }, [updateBookmarkletStats]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsProcessing(true);
    setProcessingProgress(0);

    if (!e.target.files) {
      setIsProcessing(false);
      toast({
        title: "Error",
        description: "No files selected",
        variant: "destructive",
      });
      return;
    }

    const files = Array.from(e.target.files);
    const newImages: ImageWithId[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await convertToBase64(file);
        const response = await fetch("/api/process-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: base64, useGemini: useGemini }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        newImages.push({
          id: data.id,
          src: base64 as string,
          alt: file.name,
          extractedText: data.extractedText,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
          originalFilename: file.name,
          fileSize: file.size,
          fileType: file.type,
          processingTime: data.processingTime,
          extractedData: data.extractedData,
        });

        setProcessingProgress(((i + 1) / files.length) * 100);
      } catch (error: any) {
        console.error("Error processing image:", error);
        toast({
          title: "Error",
          description: `Failed to process ${file.name}: ${error.message}`,
          variant: "destructive",
        });
      }
    }

    setImages((prevImages) => [...prevImages, ...newImages]);
    setIsProcessing(false);
    toast({
      title: "Success",
      description: "Images processed successfully!",
    });
  };

  const handleTextChange = (id: string, newText: string) => {
    setImages((prevImages) =>
      prevImages.map((img) =>
        img.id === id ? { ...img, extractedText: newText } : img
      )
    );
  };

  const handleDelete = (id: string) => {
    setImages((prevImages) => prevImages.filter((img) => img.id !== id));
  };

  const handleSubmitToApi = async (id: string, image: ImageWithId) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/submit-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          extractedText: image.extractedText,
          extractedData: image.extractedData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Response:", result);

      setImages((prevImages) =>
        prevImages.map((img) =>
          img.id === id ? { ...img, status: "success" } : img
        )
      );
      toast({
        title: "Success",
        description: `Data submitted successfully for ${image.originalFilename}!`,
      });
      await updateBookmarkletStats();
    } catch (error: any) {
      console.error("Error submitting data:", error);
      setImages((prevImages) =>
        prevImages.map((img) =>
          img.id === id ? { ...img, status: "error" } : img
        )
      );
      toast({
        title: "Error",
        description: `Failed to submit data for ${image.originalFilename}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const convertToBase64 = (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  };

  return {
    images,
    isProcessing,
    processingProgress,
    isSubmitting,
    useGemini,
    bookmarkletStats,
    setUseGemini,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    updateBookmarkletStats,
  };
};
