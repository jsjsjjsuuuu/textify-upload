
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";

export const useDbSave = (updateImage: (id: string, fields: Partial<ImageData>) => void) => {
  const { toast } = useToast();
  
  // وظيفة لحفظ بيانات الصورة في Supabase
  const saveImageToDatabase = async (image: ImageData, userId: string | undefined) => {
    if (!userId) {
      console.log("لا يوجد مستخدم مسجل، لا يمكن حفظ البيانات");
      return null;
    }

    console.log("جاري حفظ البيانات في قاعدة البيانات...", image);

    try {
      // التحقق مما إذا كانت الصورة موجودة بالفعل
      const { data: existingImage } = await supabase
        .from('images')
        .select('id')
        .eq('id', image.id)
        .maybeSingle();

      if (existingImage) {
        console.log("الصورة موجودة بالفعل، جاري التحديث:", existingImage.id);
        
        const { data: updatedData, error: updateError } = await supabase
          .from('images')
          .update({
            preview_url: image.previewUrl,
            extracted_text: image.extractedText,
            company_name: image.companyName || "",
            sender_name: image.senderName || "",
            phone_number: image.phoneNumber || "",
            code: image.code || "",
            price: image.price || "",
            province: image.province || "",
            status: image.status,
            submitted: true,
            batch_id: image.batch_id || "default",
            storage_path: image.storage_path || null // تحديث مسار التخزين
          })
          .eq('id', existingImage.id)
          .select();

        if (updateError) {
          console.error("خطأ في تحديث البيانات:", updateError);
          throw updateError;
        }

        console.log("تم تحديث البيانات بنجاح:", updatedData?.[0]);
        
        // هنا نقوم بتحديث الصورة في الواجهة بالبيانات المحدثة
        if (updatedData && updatedData[0]) {
          updateImage(image.id, {
            extractedText: updatedData[0].extracted_text,
            companyName: updatedData[0].company_name,
            senderName: updatedData[0].sender_name,
            phoneNumber: updatedData[0].phone_number,
            code: updatedData[0].code,
            price: updatedData[0].price,
            province: updatedData[0].province,
            status: updatedData[0].status as "processing" | "pending" | "completed" | "error",
            submitted: true
          });
        }
        
        return updatedData?.[0];
      }

      // إذا لم تكن الصورة موجودة، قم بإدراجها
      const { data, error } = await supabase
        .from('images')
        .insert({
          id: image.id,
          user_id: userId,
          file_name: image.file.name,
          preview_url: image.previewUrl,
          extracted_text: image.extractedText,
          company_name: image.companyName || "",
          sender_name: image.senderName || "",
          phone_number: image.phoneNumber || "",
          code: image.code || "",
          price: image.price || "",
          province: image.province || "",
          status: image.status,
          submitted: true,
          batch_id: image.batch_id || "default",
          storage_path: image.storage_path || null
        })
        .select();

      if (error) {
        // إذا كان الخطأ بسبب تكرار المفتاح، نحاول تحديث السجل الموجود
        if (error.code === '23505') { // رمز خطأ تكرار المفتاح في PostgreSQL
          console.warn("خطأ تكرار المفتاح، جاري محاولة التحديث بدلاً من الإدراج");
          
          // محاولة البحث عن السجل الموجود
          const { data: existingRecord } = await supabase
            .from('images')
            .select('id')
            .eq('file_name', image.file.name)
            .eq('user_id', userId)
            .maybeSingle();
            
          if (existingRecord) {
            // إذا وجدنا السجل، نقوم بتحديثه
            const { data: updatedRecord, error: updateError } = await supabase
              .from('images')
              .update({
                preview_url: image.previewUrl,
                extracted_text: image.extractedText,
                company_name: image.companyName || "",
                sender_name: image.senderName || "",
                phone_number: image.phoneNumber || "",
                code: image.code || "",
                price: image.price || "",
                province: image.province || "",
                status: image.status,
                submitted: true,
                batch_id: image.batch_id || "default",
                storage_path: image.storage_path || null
              })
              .eq('id', existingRecord.id)
              .select();
              
            if (!updateError && updatedRecord) {
              console.log("تم تحديث السجل الموجود بنجاح:", updatedRecord[0]);
              
              // تحديث الصورة في الواجهة
              updateImage(image.id, { 
                id: existingRecord.id,
                extractedText: updatedRecord[0].extracted_text,
                companyName: updatedRecord[0].company_name,
                senderName: updatedRecord[0].sender_name,
                phoneNumber: updatedRecord[0].phone_number,
                code: updatedRecord[0].code,
                price: updatedRecord[0].price,
                province: updatedRecord[0].province,
                status: updatedRecord[0].status as "processing" | "pending" | "completed" | "error",
                submitted: true
              });
              
              return updatedRecord[0];
            }
          }
        }
        
        console.error("خطأ في حفظ البيانات:", error);
        toast({
          title: "خطأ",
          description: `فشل حفظ البيانات: ${error.message}`,
          variant: "destructive",
        });
        return null;
      }

      // تحديث حالة الصورة ليشير إلى أنها تم حفظها
      if (data && data[0]) {
        updateImage(image.id, { 
          submitted: true,
          extractedText: data[0].extracted_text,
          companyName: data[0].company_name,
          senderName: data[0].sender_name,
          phoneNumber: data[0].phone_number,
          code: data[0].code,
          price: data[0].price,
          province: data[0].province,
          status: data[0].status as "processing" | "pending" | "completed" | "error"
        });
      }

      console.log("تم حفظ البيانات بنجاح:", data?.[0]);
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ البيانات بنجاح",
      });
      
      return data?.[0];
    } catch (error: any) {
      console.error("خطأ في حفظ البيانات:", error);
      return null;
    }
  };

  return {
    saveImageToDatabase
  };
};
