
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
    console.log('تم استلام طلب OPTIONS - إرجاع استجابة CORS');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // التحقق من الطلب
    if (req.method !== 'POST') {
      throw new Error('طريقة غير مدعومة: ' + req.method);
    }

    console.log('تم استلام طلب إعادة تعيين كلمة المرور');

    // استخراج رمز المصادقة
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('لم يتم العثور على رمز المصادقة أو الرمز غير صالح');
      throw new Error('رمز المصادقة مفقود أو غير صالح');
    }
    
    const token = authHeader.split(' ')[1];
    console.log('تم استخراج رمز المصادقة بنجاح');

    // تهيئة عميل Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('متغيرات البيئة الضرورية غير متوفرة');
      throw new Error('إعدادات Supabase غير صحيحة');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
      },
    });

    // التحقق من المستخدم الحالي وصلاحياته
    console.log('التحقق من هوية المستخدم الحالي...');
    const authResponse = await supabaseClient.auth.getUser();
    
    if (authResponse.error) {
      console.error('فشل التحقق من المستخدم:', authResponse.error.message);
      throw new Error('غير مصرح: ' + authResponse.error.message);
    }

    const currentUserId = authResponse.data.user.id;
    console.log('تم التحقق من المستخدم الحالي:', currentUserId);

    // التحقق من أن المستخدم مسؤول
    console.log('التحقق من صلاحيات المستخدم...');
    const { data: adminCheck, error: adminCheckError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', currentUserId)
      .single();

    if (adminCheckError) {
      console.error('خطأ في التحقق من الصلاحيات:', adminCheckError.message);
      throw new Error('خطأ في التحقق من الصلاحيات: ' + adminCheckError.message);
    }

    if (!adminCheck?.is_admin) {
      console.error('المستخدم ليس لديه صلاحيات المسؤول');
      throw new Error('غير مصرح: المستخدم ليس مسؤولاً');
    }

    console.log('تم التحقق من صلاحيات المسؤول بنجاح');

    // استخراج بيانات الطلب
    let requestData: ResetPasswordRequest;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error('فشل في تحليل بيانات الطلب:', error);
      throw new Error('بيانات الطلب غير صالحة: ' + error.message);
    }

    const { userId, newPassword } = requestData;

    if (!userId || !newPassword) {
      console.error('بيانات إعادة تعيين كلمة المرور غير كاملة');
      throw new Error('بيانات غير كاملة');
    }

    if (newPassword.length < 6) {
      console.error('كلمة المرور قصيرة جدًا');
      throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }

    console.log(`محاولة إعادة تعيين كلمة المرور للمستخدم: ${userId} بواسطة المسؤول: ${currentUserId}`);

    // الحصول على مفتاح الخدمة لاستخدام واجهة برمجة التطبيقات الإدارية
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      console.error('مفتاح الخدمة (SERVICE_ROLE_KEY) غير متوفر');
      throw new Error('مفتاح الخدمة غير متوفر. يرجى التحقق من إعدادات البيئة.');
    }

    // إنشاء عميل Supabase بمفتاح الخدمة للوصول إلى وظائف المسؤول
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    console.log('تم إنشاء عميل المسؤول بنجاح، جاري تنفيذ إعادة تعيين كلمة المرور...');

    // استخدام واجهة برمجة التطبيقات Admin لإعادة تعيين كلمة المرور
    const { error: resetError } = await adminClient.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (resetError) {
      console.error('خطأ في إعادة تعيين كلمة المرور:', resetError);
      throw new Error(`فشل في إعادة تعيين كلمة المرور: ${resetError.message}`);
    }

    console.log('تم إعادة تعيين كلمة المرور بنجاح للمستخدم:', userId);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'تم إعادة تعيين كلمة المرور بنجاح'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('خطأ في وظيفة Edge Function لإعادة تعيين كلمة المرور:', error.message);
    
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
