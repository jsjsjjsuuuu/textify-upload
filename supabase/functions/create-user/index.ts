
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  isAdmin: boolean;
  isApproved: boolean;
  subscriptionPlan: string;
  accountStatus?: string;
}

serve(async (req) => {
  console.log('تم استلام طلب إلى وظيفة إنشاء مستخدم');
  
  // التعامل مع طلبات CORS المبدئية
  if (req.method === 'OPTIONS') {
    console.log('تم استلام طلب OPTIONS - إرجاع استجابة CORS');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // التحقق من الطلب
    if (req.method !== 'POST') {
      console.error('طريقة غير مدعومة:', req.method);
      throw new Error('طريقة غير مدعومة: ' + req.method);
    }

    // الحصول على المتغيرات البيئية المطلوبة
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('متغيرات البيئة المطلوبة غير متوفرة');
      throw new Error('إعدادات Supabase غير صحيحة أو مفقودة');
    }

    // استخراج بيانات الطلب
    let requestData: CreateUserRequest;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error('فشل في تحليل بيانات الطلب:', error);
      throw new Error('بيانات الطلب غير صالحة: ' + error.message);
    }

    const { 
      email, 
      password, 
      fullName, 
      isAdmin, 
      isApproved, 
      subscriptionPlan,
      accountStatus = 'active'  // القيمة الافتراضية إذا لم يتم تحديدها
    } = requestData;

    if (!email || !password || !fullName) {
      console.error('بيانات إنشاء المستخدم غير كاملة');
      throw new Error('بيانات غير كاملة - البريد الإلكتروني أو كلمة المرور أو الاسم الكامل مفقود');
    }

    // إنشاء عميل Supabase بمفتاح دور الخدمة
    console.log('إنشاء عميل Supabase بمفتاح دور الخدمة');
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // إنشاء المستخدم باستخدام صلاحيات المسؤول
    console.log('إنشاء مستخدم جديد:', { email, fullName, isAdmin, isApproved });
    const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (userError) {
      console.error('خطأ في إنشاء المستخدم:', userError.message);
      throw new Error(`فشل في إنشاء المستخدم: ${userError.message}`);
    }

    // التأكد من إنشاء المستخدم وتحديث ملفه الشخصي
    if (!userData.user || !userData.user.id) {
      console.error('لم يتم إنشاء المستخدم بشكل صحيح');
      throw new Error('فشل في إنشاء المستخدم: لم يتم إنشاء المستخدم بشكل صحيح');
    }

    const userId = userData.user.id;

    // تحديث الملف الشخصي للمستخدم
    console.log('تحديث الملف الشخصي للمستخدم:', userId);
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        full_name: fullName,
        is_admin: isAdmin,
        is_approved: isApproved,
        subscription_plan: subscriptionPlan,
        account_status: accountStatus
      })
      .eq('id', userId);

    if (profileError) {
      console.error('خطأ في تحديث الملف الشخصي للمستخدم:', profileError.message);
      // لا نرمي خطأ هنا لأن المستخدم تم إنشاؤه بالفعل
      console.warn('المستخدم تم إنشاؤه ولكن الملف الشخصي لم يتم تحديثه بالكامل');
    }

    console.log('تم إنشاء المستخدم بنجاح:', email);

    return new Response(
      JSON.stringify({ 
        success: true,
        userId,
        message: 'تم إنشاء المستخدم بنجاح'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('خطأ في وظيفة Edge Function لإنشاء مستخدم:', error.message);
    
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
