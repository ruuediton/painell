import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fycskldchqqqohgvioal.supabase.co';
const supabaseAnonKey = 'sb_publishable_QEdLa9RoyQ6OciEpX6XE9g_xg2vqb-E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
