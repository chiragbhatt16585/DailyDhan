// src/config/supabase.js
import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your actual Supabase project credentials
// Get these from: https://supabase.com/dashboard → Your Project → Settings → API
const SUPABASE_URL = 'https://cbcoyqexkaeatptxakds.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AaNfcZ1i7Ye8kqBtE24_3w_7g3fPOnC';

// Validate configuration
if (SUPABASE_URL.includes('YOUR_PROJECT_ID') || SUPABASE_ANON_KEY.includes('YOUR_ANON')) {
  console.error('❌ SUPABASE CONFIGURATION ERROR:');
  console.error('Please update src/config/supabase.js with your actual Supabase credentials!');
  console.error('Get them from: Supabase Dashboard → Settings → API');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

