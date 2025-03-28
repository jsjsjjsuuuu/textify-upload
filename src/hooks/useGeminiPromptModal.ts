
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

export const useGeminiPromptModal = (selectedImage: ImageData) => {
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isPredefinedModalOpen, setIsPredefinedModalOpen] = useState(false);
  const { toast } = useToast();

  const openCustomPromptModal = () => {
    setIsPromptModalOpen(true);
    toast({
      title: "فتح محرر المطالبات المخصصة",
      description: "يمكنك الآن كتابة مطالبة مخصصة لمعالجة الصورة",
    });
  };

  const closeCustomPromptModal = () => {
    setIsPromptModalOpen(false);
  };

  const openPredefinedPromptModal = () => {
    setIsPredefinedModalOpen(true);
    toast({
      title: "فتح قائمة المطالبات الجاهزة",
      description: "يمكنك اختيار مطالبة جاهزة لمعالجة الصورة",
    });
  };

  const closePredefinedPromptModal = () => {
    setIsPredefinedModalOpen(false);
  };

  return {
    isPromptModalOpen,
    isPredefinedModalOpen,
    openCustomPromptModal,
    closeCustomPromptModal,
    openPredefinedPromptModal,
    closePredefinedPromptModal
  };
};
