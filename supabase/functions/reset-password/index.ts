
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetPasswordRequest {
  userId: string;
  newPassword: string;
}

serve(async (req) => {
  // التعامل مع طلبات CORS المبدئية
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // التحقق من الطلب
    if (req.method !== 'POST') {
      throw new Error('طريقة غير مدعومة');
    }

    // تهيئة عميل Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization')!,
          },
        },
        auth: {
          persistSession: false,
        },
      }
    );

    // التحقق من المستخدم الحالي وصلاحياته
    const authResponse = await supabaseClient.auth.getUser();
    if (authResponse.error) {
      throw new Error('غير مصرح: ' + authResponse.error.message);
    }

    const currentUserId = authResponse.data.user.id;

    // التحقق من أن المستخدم مسؤول
    const { data: adminCheck, error: adminCheckError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', currentUserId)
      .single();

    if (adminCheckError) {
      throw new Error('خطأ في التحقق من الصلاحيات: ' + adminCheckError.message);
    }

    if (!adminCheck?.is_admin) {
      throw new Error('غير مصرح: المستخدم ليس مسؤولاً');
    }

    // استخراج بيانات الطلب
    const { userId, newPassword }: ResetPasswordRequest = await req.json();

    if (!userId || !newPassword) {
      throw new Error('بيانات غير كاملة');
    }

    if (newPassword.length < 6) {
      throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }

    console.log(`محاولة إعادة تعيين كلمة المرور للمستخدم: ${userId}`);

    // استخدام واجهة برمجة التطبيقات الإدارية لإعادة تعيين كلمة المرور
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      throw new Error('مفتاح الخدمة غير متوفر');
    }

    // إنشاء عميل Supabase بمفتاح الخدمة
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // استخدام واجهة برمجة التطبيقات Admin لإعادة تعيين كلمة المرور
    const { error: resetError } = await adminClient.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (resetError) {
      console.error('خطأ في إعادة تعيين كلمة المرور:', resetError);
      throw new Error('فشل في إعادة تعيين كلمة المرور: ' + resetError.message);
    }

    console.log('تم إعادة تعيين كلمة المرور بنجاح للمستخدم:', userId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('خطأ في وظيفة إعادة تعيين كلمة المرور:', error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'حدث خطأ غير معروف',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
