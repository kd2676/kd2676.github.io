import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://xhintwxwdvqmrkcqwkcu.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_oEfW92HAf80NgIIaIleXSQ__oixjFEQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

