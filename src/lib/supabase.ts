
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

export const supabase = createClient<Database>(
  "https://fepwckdjnmizplgqebgq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHdja2Rqbm1penBsZ3FlYmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5OTQ1MDgsImV4cCI6MjA1ODU3MDUwOH0.t-qUEPPSwOUJezoFaX0rasqDzuEd5yM1w1uVZWnSX7U"
);
