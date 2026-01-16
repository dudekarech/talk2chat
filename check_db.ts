
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkCredits() {
    console.log('--- Checking Tenants ---');
    const { data: tenants } = await supabase.from('tenants').select('id, name, ai_credits_balance, owner_id');
    console.table(tenants);

    console.log('\n--- Checking User Profiles ---');
    const { data: profiles } = await supabase.from('user_profiles').select('id, user_id, email, tenant_id, role');
    console.table(profiles);
}

checkCredits();
