
export interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  email: string;
  is_approved?: boolean;
  is_admin?: boolean;
  created_at?: string;
  subscription_plan?: string;
  account_status?: string;
  subscription_end_date?: string;
  username?: string;
  last_login_at?: string;
  phone_number?: string;
  address?: string;
  notes?: string;
  updated_at?: string;
  daily_image_limit?: number;
}
