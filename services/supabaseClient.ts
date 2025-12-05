import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase URL or Anon Key. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check connection
export const checkSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase.from('test_connection').select('*').limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 is "Relation not found" which is fine if table doesn't exist, it means we connected
            console.log('Supabase connection check result:', { data, error });
            return true;
        }
        return true;
    } catch (e) {
        console.error('Supabase connection failed:', e);
        return false;
    }
};
