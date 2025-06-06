export type User = {
  id: string;
  email: string;
  full_name: string;
  username: string;
  profile_picture?: string;
  bio?: string;
  location?: string;
  total_hours?: number;
  total_events?: number;
  categories?: Record<string, number>;
  followers?: string[];
  following?: string[];
  created_at?: string;
  updated_at?: string;
}; 