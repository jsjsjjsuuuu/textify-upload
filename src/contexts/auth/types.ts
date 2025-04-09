
import { SupabaseClient, Session } from '@supabase/supabase-js';

// واجهة UserProfile موحدة
export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_approved: boolean | null;
  is_admin: boolean | null;
  subscription_plan?: string | null;
  subscription_end_date?: string | null;
  account_status?: string | null;
  created_at?: string;
  updated_at?: string;
  daily_image_limit?: number | null;
}

export interface AuthContextType {
  supabaseClient: SupabaseClient | null;
  auth: any | null;
  user: any | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isOffline: boolean;
  connectionError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any; user: any | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, plan: string) => Promise<{ error: any; user: any | null }>;
  forgotPassword: (email: string) => Promise<{ error: any; sent: boolean }>;
  resetPassword: (newPassword: string) => Promise<{ error: any; success: boolean }>;
  updateUser: (updates: any) => Promise<{ data: any; error: any }>;
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>;
  refreshUserProfile: () => Promise<void>;
  retryConnection: () => Promise<boolean>;
}
