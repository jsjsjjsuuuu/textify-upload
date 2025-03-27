
export interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  email: string;
  is_approved?: boolean;
  created_at?: string;
  subscription_plan?: string;
  account_status?: string;
  subscription_end_date?: string;
}
