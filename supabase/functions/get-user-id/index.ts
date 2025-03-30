
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('تم استلام طلب إلى وظيفة البحث عن معرف المستخدم');
  
  // التعامل مع طلبات CORS المبدئية
  if (req.method === 'OPTIONS') {
    console.log('تم استلام طلب OPTIONS - إرجاع استجابة CORS');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // الحصول على المتغيرات البيئية المطلوبة
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('متغيرات البيئة المطلوبة غير متوفرة');
      throw new Error('إعدادات Supabase غير صحيحة أو مفقودة');
    }

    // الحصول على البريد الإلكتروني من معلمات الاستعلام
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      console.error('البريد الإلكتروني مفقود في معلمات الاستعلام');
      throw new Error('البريد الإلكتروني مطلوب');
    }

    // إنشاء عميل Supabase بمفتاح دور الخدمة
    console.log('إنشاء عميل Supabase بمفتاح دور الخدمة');
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // البحث عن المستخدم باستخدام البريد الإلكتروني
    console.log('البحث عن المستخدم بالبريد الإلكتروني:', email);
    const { data: users, error: searchError } = await adminClient.auth.admin.listUsers({
      filter: { email: email }
    });

    if (searchError) {
      console.error('خطأ في البحث عن المستخدم:', searchError.message);
      throw new Error(`فشل في البحث عن المستخدم: ${searchError.message}`);
    }

    if (!users || !users.users || users.users.length === 0) {
      console.error('لم يتم العثور على مستخدم بهذا البريد الإلكتروني:', email);
      throw new Error('لم يتم العثور على مستخدم بهذا البريد الإلكتروني');
    }

    // إرجاع معرف المستخدم
    const userData = users.users.map(user => ({
      id: user.id,
      email: user.email
    }));

    console.log('تم العثور على المستخدم:', userData);

    return new Response(
      JSON.stringify({ 
        success: true,
        data: userData
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('خطأ في وظيفة Edge Function للبحث عن معرف المستخدم:', error.message);
    
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
