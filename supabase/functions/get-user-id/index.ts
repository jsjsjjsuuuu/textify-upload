
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

// تكوين CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // التعامل مع طلبات CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // استخراج المعلومات من إما query params أو body
    const url = new URL(req.url);
    let email: string | null = null;
    
    // محاولة الحصول على البريد الإلكتروني من query params
    if (url.searchParams.has('email')) {
      email = url.searchParams.get('email');
    } else {
      // محاولة الحصول على البريد الإلكتروني من body
      try {
        const body = await req.json();
        email = body.email;
      } catch (error) {
        console.error("خطأ في قراءة body:", error);
      }
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'يجب توفير البريد الإلكتروني' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      )
    }

    // إنشاء اتصال بـ Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('متغيرات البيئة غير مكتملة')
    }

    // إنشاء عميل Supabase باستخدام مفتاح الخدمة للوصول الكامل
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // البحث عن المستخدم باستخدام البريد الإلكتروني
    console.log(`البحث عن مستخدم بالبريد الإلكتروني: ${email}`)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .limit(1);

    if (error) {
      console.error('خطأ في البحث عن المستخدم:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      )
    }

    return new Response(
      JSON.stringify({ users }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    )
  } catch (error) {
    console.error('خطأ غير متوقع:', error)
    return new Response(
      JSON.stringify({ error: `حدث خطأ: ${error.message}` }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    )
  }
})
