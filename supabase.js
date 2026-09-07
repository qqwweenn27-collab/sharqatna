import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

export const SUPABASE_URL = 'https://zglumrzbwaazgnsllsxx.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_iq67K6MgmknocAOI_6eQyw_ME40wlMd';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
