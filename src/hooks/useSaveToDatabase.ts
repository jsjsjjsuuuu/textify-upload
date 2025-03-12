import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ImageData } from '@/types/ImageData';
import { saveExtractedRecord } from '@/lib/supabase';

export const useSaveToDatabase = () => {
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [savedItems, setSavedItems] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const saveToDatabase = async (id: string, imageData: ImageData) => {
    try {
      setIsSaving(prev => ({ ...prev, [id]: true }));
      const result = await saveExtractedRecord(imageData);
      
      if (result.success) {
        setSavedItems(prev => ({ ...prev, [id]: true }));
        toast({
          title: "تم الحفظ بنجاح",
          description: "تم حفظ البيانات المستخرجة في قاعدة البيانات",
        });
      } else {
        throw new Error(result.error as any);
      }
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
      toast({
        title: "فشل في الحفظ",
        description: "حدث خطأ أثناء حفظ البيانات في قاعدة البيانات",
        variant: "destructive"
      });
    } finally {
      setIsSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  const isSavingItem = (id: string) => isSaving[id] || false;
  const isItemSaved = (id: string) => savedItems[id] || false;

  return {
    saveToDatabase,
    isSavingItem,
    isItemSaved
  };
};
