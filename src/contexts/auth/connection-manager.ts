
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as supabaseInstance } from '@/integrations/supabase/client';

// ثوابت إعادة المحاولة
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 1500;

export interface ConnectionManagerResult {
  success: boolean;
  client: SupabaseClient | null;
  connectionError: string | null;
  isOffline: boolean;
}

/**
 * وظيفة لإدارة الاتصال بـ Supabase مع دعم إعادة المحاولة
 */
export const initializeSupabaseConnection = async (
  attempt = 0,
  setRetryCount?: (count: number) => void
): Promise<ConnectionManagerResult> => {
  try {
    console.log(`محاولة الاتصال بـ Supabase (${attempt + 1}/${MAX_RETRY_ATTEMPTS})...`);
    
    // التحقق من الاتصال بالإنترنت
    if (!navigator.onLine) {
      console.error("لا يوجد اتصال بالإنترنت");
      return {
        success: false,
        client: null,
        connectionError: "لا يوجد اتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.",
        isOffline: true
      };
    }
    
    // محاولة تهيئة العميل
    const client = supabaseInstance;
    
    // التحقق من الاتصال عبر استعلام بسيط
    const { error } = await client.from('profiles').select('count').limit(1).maybeSingle();
    
    if (error) {
      console.error("خطأ في الاتصال بـ Supabase:", error.message);
      
      // إذا وصلنا للحد الأقصى من المحاولات
      if (attempt >= MAX_RETRY_ATTEMPTS - 1) {
        return {
          success: false,
          client: null,
          connectionError: `تعذر الاتصال بالخادم. ${error.message}`,
          isOffline: false
        };
      }
      
      // إعادة المحاولة بعد تأخير
      console.log(`إعادة المحاولة بعد ${RETRY_DELAY_MS}ms...`);
      
      if (setRetryCount) {
        setRetryCount(attempt + 1);
      }
      
      // انتظار ثم إعادة المحاولة
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return initializeSupabaseConnection(attempt + 1, setRetryCount);
    }
    
    // نجاح الاتصال
    console.log("تم الاتصال بـ Supabase بنجاح");
    return {
      success: true,
      client,
      connectionError: null,
      isOffline: false
    };
    
  } catch (error: any) {
    console.error("خطأ غير متوقع في الاتصال:", error.message);
    
    // إذا وصلنا للحد الأقصى من المحاولات
    if (attempt >= MAX_RETRY_ATTEMPTS - 1) {
      return {
        success: false,
        client: null,
        connectionError: `خطأ غير متوقع: ${error.message}`,
        isOffline: false
      };
    }
    
    // إعادة المحاولة بعد تأخير
    console.log(`إعادة المحاولة بعد ${RETRY_DELAY_MS}ms...`);
    
    if (setRetryCount) {
      setRetryCount(attempt + 1);
    }
    
    // انتظار ثم إعادة المحاولة
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    return initializeSupabaseConnection(attempt + 1, setRetryCount);
  }
};
