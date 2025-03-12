
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// استخدام قيم افتراضية إذا لم تكن متوفرة من متغيرات البيئة
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'your-anon-key';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// نوع المستخدم في Supabase
export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: {
    username?: string;
    [key: string]: any;
  };
  app_metadata?: {
    role?: string;
    [key: string]: any;
  };
}
