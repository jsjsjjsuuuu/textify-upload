
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.41.0";

// استخراج متغيرات البيئة
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// إنشاء عميل Supabase مع مفتاح service role للحصول على صلاحيات الإدارة
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const performDailyReset = async () => {
  console.log("بدء عملية إعادة تعيين الحدود اليومية للصور");
  
  try {
    // استدعاء الوظيفة المخزنة في قاعدة البيانات لإعادة تعيين عدادات التحميل
    const { data, error } = await supabaseAdmin.rpc("reset_all_daily_upload_counts");
    
    if (error) {
      console.error("خطأ في إعادة تعيين الحدود اليومية:", error);
      return { success: false, error: error.message };
    }
    
    console.log("تم إعادة تعيين الحدود اليومية بنجاح");
    return { success: true, message: "تم إعادة تعيين الحدود اليومية بنجاح" };
  } catch (error) {
    console.error("خطأ غير متوقع أثناء إعادة التعيين:", error);
    return { success: false, error: error.message };
  }
};

serve(async (req) => {
  // التعامل مع طلبات CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // التحقق من التصريح (يمكن استخدام نظام مصادقة أكثر تعقيدًا)
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader && req.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "غير مصرح" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // عند وجود مصادقة من خلال طلب معين (مثل admin)
    if (req.method === "POST" && authHeader) {
      // يمكن إضافة المزيد من التحقق هنا
      
      const result = await performDailyReset();
      
      return new Response(
        JSON.stringify(result),
        { status: result.success ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } 
    
    // للاختبار والاستدعاء المباشر (مثل جدول كرون)
    if (req.method === "GET") {
      const result = await performDailyReset();
      
      return new Response(
        JSON.stringify(result),
        { status: result.success ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // الطرق غير المدعومة
    return new Response(
      JSON.stringify({ error: "الطريقة غير مدعومة" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("خطأ غير متوقع:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
