
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Loader2, ArrowRight, FileImage, Info, AlertTriangle } from 'lucide-react';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { useToast } from '@/hooks/use-toast';
import ImageUploader from './ImageUploader';
import { ImageData } from '@/types/ImageData';
import { AlertDialogContent, AlertDialogCancel, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialog } from './ui/alert-dialog';

interface FileUploaderProps {
  onFilesSelected: (files: FileList | File[]) => void;
  isProcessing: boolean;
}

const FileUploader = ({ onFilesSelected, isProcessing }: FileUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const { toast } = useToast();
  const { checkDuplicateImage, images, processingProgress, activeUploads, queueLength } = useImageProcessing();
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [duplicateImage, setDuplicateImage] = useState<ImageData | null>(null);

  // إعادة تعيين الملفات المحددة بعد الانتهاء من المعالجة
  useEffect(() => {
    if (!isProcessing && selectedFiles.length > 0) {
      setSelectedFiles([]);
    }
  }, [isProcessing]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      
      // التحقق من كل ملف قبل إضافته للمعالجة
      for (const file of files) {
        const tempImageData: ImageData = {
          id: 'temp-id',
          file: file,
          previewUrl: URL.createObjectURL(file),
          date: new Date(),
          status: "pending",
        };
        
        // التحقق من وجود الصورة في قاعدة البيانات أو السجلات
        const isDuplicate = await checkDuplicateImage(tempImageData, images);
        
        if (isDuplicate) {
          // البحث عن الصورة المطابقة في القائمة
          const matchingImage = images.find(img => 
            img.file && 
            img.file.name === file.name && 
            img.file.size === file.size
          );
          
          if (matchingImage) {
            // عرض تنبيه بوجود صورة مكررة مع تفاصيلها
            setDuplicateImage(matchingImage);
            setShowDuplicateAlert(true);
            
            // تنظيف URL المؤقت
            URL.revokeObjectURL(tempImageData.previewUrl);
            return;
          } else {
            // إظهار رسالة تنبيه فقط
            toast({
              title: "صورة مكررة",
              description: `الملف "${file.name}" موجود بالفعل في النظام وتم معالجته سابقًا.`,
              variant: "destructive",
            });
            
            // تنظيف URL المؤقت
            URL.revokeObjectURL(tempImageData.previewUrl);
            return;
          }
        }
      }
      
      setSelectedFiles(files);
      onFilesSelected(files);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter - 1 === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (files.length === 0) {
        toast({
          title: "نوع ملف غير مدعوم",
          description: "يرجى إرفاق ملفات صور فقط (JPG, PNG, GIF, ...)",
          variant: "destructive",
        });
        return;
      }
      
      // التحقق من كل ملف قبل إضافته للمعالجة
      for (const file of files) {
        const tempImageData: ImageData = {
          id: 'temp-id',
          file: file,
          previewUrl: URL.createObjectURL(file),
          date: new Date(),
          status: "pending",
        };
        
        // التحقق من وجود الصورة في قاعدة البيانات أو السجلات
        const isDuplicate = await checkDuplicateImage(tempImageData, images);
        
        if (isDuplicate) {
          // البحث عن الصورة المطابقة في القائمة
          const matchingImage = images.find(img => 
            img.file && 
            img.file.name === file.name && 
            img.file.size === file.size
          );
          
          if (matchingImage) {
            // عرض تنبيه بوجود صورة مكررة مع تفاصيلها
            setDuplicateImage(matchingImage);
            setShowDuplicateAlert(true);
            
            // تنظيف URL المؤقت
            URL.revokeObjectURL(tempImageData.previewUrl);
            return;
          } else {
            // إظهار رسالة تنبيه فقط
            toast({
              title: "صورة مكررة",
              description: `الملف "${file.name}" موجود بالفعل في النظام وتم معالجته سابقًا.`,
              variant: "destructive",
            });
            
            // تنظيف URL المؤقت
            URL.revokeObjectURL(tempImageData.previewUrl);
            return;
          }
        }
      }
      
      setSelectedFiles(files);
      onFilesSelected(files);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          isDragging ? "border-primary bg-primary/10" : "border-gray-300"
        } ${isProcessing ? "pointer-events-none opacity-50" : "hover:bg-gray-50/50 cursor-pointer"}`}
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={isProcessing ? undefined : handleButtonClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
  
        {isProcessing ? (
          <div>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-lg font-medium mb-2">جاري معالجة الصور...</p>
            <Progress value={processingProgress} className="h-2 mb-2" />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{processingProgress.toFixed(0)}%</span>
              <span>
                {activeUploads > 0 && `جاري معالجة ${activeUploads} صورة`}
                {queueLength > 0 && ` • ${queueLength} في الانتظار`}
              </span>
            </div>
          </div>
        ) : (
          <div>
            {isDragging ? (
              <FileImage className="h-12 w-12 mx-auto text-primary mb-4" />
            ) : (
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            )}
            <p className="text-lg font-medium mb-2">
              {isDragging ? "أفلت الصور هنا" : "اسحب وأفلت الصور هنا"}
            </p>
            <p className="text-sm text-gray-500 mb-4">أو</p>
            <Button type="button" disabled={isProcessing}>
              اختيار الصور
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              يمكنك تحميل صور بتنسيق JPG أو PNG
            </p>
          </div>
        )}
      </div>
      
      {/* مربع حوار لعرض الصور المكررة */}
      <AlertDialog open={showDuplicateAlert} onOpenChange={setShowDuplicateAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 ml-2" />
              صورة مكررة
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                تم العثور على صورة مشابهة في النظام. هذه الصورة تم معالجتها سابقًا.
              </p>
              
              {duplicateImage && (
                <div className="border rounded-md p-3 bg-muted/30 space-y-2">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-muted rounded-md overflow-hidden mr-3">
                      <img 
                        src={duplicateImage.previewUrl || '/placeholder.png'} 
                        alt="صورة مكررة"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{duplicateImage.code || 'بدون كود'}</p>
                      <p className="text-sm text-muted-foreground">
                        {duplicateImage.file?.name || 'غير معروف'} • {duplicateImage.status === 'completed' ? 'مكتملة' : 'قيد المعالجة'}
                      </p>
                    </div>
                  </div>
                  
                  {duplicateImage.code && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">الكود:</span> {duplicateImage.code}</div>
                      <div><span className="text-muted-foreground">المرسل:</span> {duplicateImage.senderName || '-'}</div>
                      <div><span className="text-muted-foreground">الهاتف:</span> {duplicateImage.phoneNumber || '-'}</div>
                      <div><span className="text-muted-foreground">المحافظة:</span> {duplicateImage.province || '-'}</div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md">
                <Info className="h-5 w-5 text-blue-500 ml-2 flex-shrink-0" />
                <p className="text-sm">
                  لتجنب التكرار، يقوم النظام بمنع إعادة رفع الصور التي تمت معالجتها سابقًا.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateAlert(false)}>
              حسناً، فهمت
            </Button>
            {duplicateImage && (
              <Button variant="default" asChild>
                <a href={`/records?id=${duplicateImage.id}`} className="flex items-center">
                  عرض في السجلات
                  <ArrowRight className="h-4 w-4 mr-2" />
                </a>
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FileUploader;
