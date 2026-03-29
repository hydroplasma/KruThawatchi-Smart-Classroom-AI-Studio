
import { createClient } from '@supabase/supabase-js';

// Helper function to safely get environment variables
const getEnv = (key: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return (process.env as any)[key] || '';
    }
  } catch (e) {
    // process might not be defined in some environments
  }
  return '';
};

/**
 * Supabase Configuration
 * Updated with the credentials provided by the user.
 */
const supabaseUrl = getEnv('SUPABASE_URL') || 'https://mpbhucuxbnqafnxggtny.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || 'sb_publishable_ops59yKoPeAawK8txfEk9Q__ir2GNnr';

if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
  console.warn("Supabase credentials are missing. Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
