import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from environment OR localStorage fallback
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const localUrl = localStorage.getItem('shannolympics_supabase_url');
  const localKey = localStorage.getItem('shannolympics_supabase_key');
  
  return {
    url: envUrl || localUrl || '',
    key: envKey || localKey || '',
    isEnv: !!(envUrl && envKey),
    isLocal: !!(localUrl && localKey),
    isConfigured: !!((envUrl && envKey) || (localUrl && localKey))
  };
};

// Create the client instance dynamically
export const initSupabase = () => {
  const { url, key } = getSupabaseConfig();
  if (url && key) {
    try {
      return createClient(url, key, {
        auth: {
          persistSession: false // No sessions needed since we are doing simple public table reads/writes
        }
      });
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return null;
};
