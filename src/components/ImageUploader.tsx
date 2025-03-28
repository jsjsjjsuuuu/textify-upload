
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Upload, Sparkles, Image as ImageIcon, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ImageUploaderProps {
  isProcessing: boolean;
  processingProgress: number;
  useGemini: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onToggleGemini?: () => void;
}

const ImageUploader = ({ 
  isProcessing, 
  processingProgress, 
  useGemini, 
  onFileChange, 
  onToggleGemini 
}: ImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <Card className="bg-card border-0 shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <motion.div 
            className="w-full mb-4 relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <label 
              htmlFor="file-upload" 
              className={`
                flex flex-col items-center justify-center w-full h-32 
                bg-muted/40 dark:bg-muted/20 rounded-xl border-2 border-dashed
                border-muted-foreground/25 cursor-pointer
                hover:bg-muted/60 dark:hover:bg-muted/30 transition-colors
                ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
              `}
              onClick={handleUploadClick}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isProcessing ? (
                  <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
                ) : (
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                )}
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">اضغط للتحميل</span> أو اسحب وأفلت
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG أو PDF</p>
              </div>
              <input 
                ref={fileInputRef}
                id="file-upload" 
                type="file" 
                className="hidden" 
                onChange={onFileChange}
                accept="image/*,.pdf"
                multiple
                disabled={isProcessing}
              />
            </label>
          </motion.div>

          {isProcessing && (
            <div className="w-full mb-4">
              <Progress value={processingProgress} className="h-2 mb-2" />
              <p className="text-xs text-center text-muted-foreground">
                جاري معالجة الصور... {processingProgress}%
              </p>
            </div>
          )}

          <div className="flex items-center justify-between w-full mt-4">
            <div className="flex items-center space-x-2 space-x-reverse rtl:space-x-reverse">
              <div className="flex items-center">
                <ImageIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">معالجة الصور</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse rtl:space-x-reverse">
              <Label 
                htmlFor="ai-mode"
                className={`text-sm ${useGemini ? 'text-brand' : 'text-muted-foreground'}`}
              >
                <Sparkles className="h-4 w-4 inline mr-1" />
                وضع Gemini AI
              </Label>
              <Switch
                id="ai-mode"
                checked={useGemini}
                onCheckedChange={onToggleGemini}
                className={useGemini ? 'bg-brand' : ''}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageUploader;
