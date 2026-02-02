
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);


async function checkSystemState() {
    console.log('\n--- 🔐 Checking Auth Users ---');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Error fetching auth users:', authError);
    } else {
        console.table(users.map(u => ({
            id: u.id,
            email: u.email,
            confirmed: !!u.email_confirmed_at,
            last_login: u.last_sign_in_at,
            created: u.created_at
        })));
    }

    console.log('\n--- 🏢 Checking Tenants ---');
    const { data: tenants } = await supabase.from('tenants').select('id, name, owner_id, status');
    console.table(tenants);

    console.log('\n--- 👤 Checking User Profiles ---');
    const { data: profiles } = await supabase.from('user_profiles').select('id, user_id, email, tenant_id, role, status');
    console.table(profiles);

    // Diagnostic check for the specific user reported
    const targetEmail = 'kiambutv@gmail.com';
    console.log(`\n--- 🔍 Diagnostic for ${targetEmail} ---`);
    const authUser = users?.find(u => u.email === targetEmail);
    const profile = profiles?.find(p => p.email === targetEmail);

    console.log('Auth User exists:', !!authUser);
    if (authUser) {
        console.log('Auth User ID:', authUser.id);
        console.log('Email Confirmed:', !!authUser.email_confirmed_at);
    }

    console.log('User Profile exists:', !!profile);
    if (profile) {
        console.log('Profile User ID:', profile.user_id);
        console.log('Profile Tenant ID:', profile.tenant_id);
        console.log('IDs match:', authUser?.id === profile.user_id);
    }
}

checkSystemState();
