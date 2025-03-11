
import { useState, useEffect } from "react";
import BackgroundPattern from "@/components/BackgroundPattern";
import ImageUploader from "@/components/ImageUploader";
import AppHeader from "@/components/AppHeader";
import ImagePreviewContainer from "@/components/ImageViewer/ImagePreviewContainer";
import LearningStats from "@/components/LearningStats";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { formatDate } from "@/utils/dateFormatter";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const Index = () => {
  const { user } = useAuth();
  const {
    images,
    isProcessing,
    processingProgress,
    isSubmitting,
    useGemini,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi
  } = useImageProcessing();

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="container px-4 sm:px-6 py-4 sm:py-6 mx-auto max-w-5xl">
        <AppHeader />

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center pt-4"
        >
          {user && (
            <div className="w-full text-right mb-6">
              <h2 className="text-2xl font-semibold text-brand-brown dark:text-brand-beige">
                مرحباً {user.username}!
              </h2>
              <p className="text-muted-foreground">
                {user.role === "admin" ? "مدير النظام" : user.role === "agent" ? "وكيل" : "مستخدم"}
              </p>
            </div>
          )}

          <div className="w-full flex justify-center mx-auto">
            <ImageUploader 
              isProcessing={isProcessing}
              processingProgress={processingProgress}
              useGemini={useGemini}
              onFileChange={handleFileChange}
            />
          </div>

          <div className="w-full mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-3">
                <LearningStats />
              </div>
            </div>

            <ImagePreviewContainer 
              images={images}
              isSubmitting={isSubmitting}
              onTextChange={handleTextChange}
              onDelete={handleDelete}
              onSubmit={handleSubmitToApi}
              formatDate={formatDate}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
