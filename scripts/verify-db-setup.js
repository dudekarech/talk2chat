#!/usr/bin/env node

/**
 * Database Setup Verification Script
 * 
 * This script helps verify that your Supabase database is properly configured
 * for the Global Chat Real-Time system.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.log('\nPlease ensure you have:');
    console.log('  VITE_SUPABASE_URL=your_supabase_url');
    console.log('  VITE_SUPABASE_ANON_KEY=your_anon_key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verifying Supabase Database Setup...\n');

async function checkTableExists(tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (error && error.code === '42P01') {
            return { exists: false, error: 'Table not found' };
        }
        if (error) {
            return { exists: false, error: error.message };
        }
        return { exists: true };
    } catch (err) {
        return { exists: false, error: err.message };
    }
}

async function testRealtimeConnection() {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve({ connected: false, error: 'Connection timeout' });
        }, 5000);

        const channel = supabase
            .channel('test_channel')
            .subscribe((status) => {
                clearTimeout(timeout);
                if (status === 'SUBSCRIBED') {
                    supabase.removeChannel(channel);
                    resolve({ connected: true });
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    resolve({ connected: false, error: `Status: ${status}` });
                }
            });
    });
}

async function runChecks() {
    const results = {
        connection: null,
        tables: {},
        realtime: null,
        overall: true
    };

    // Check 1: Database Connection
    console.log('1️⃣  Checking database connection...');
    try {
        const { data, error } = await supabase.from('global_widget_config').select('*').limit(1);
        if (!error || error.code === '42P01') { // 42P01 means table missing but connected
            console.log('   ✅ Connected to Supabase successfully');
            results.connection = true;
        } else {
            console.log('   ❌ Connection failed:', error.message);
            results.connection = false;
            results.overall = false;
        }
    } catch (err) {
        console.log('   ❌ Connection error:', err.message);
        results.connection = false;
        results.overall = false;
    }

    console.log('');

    // Check 2: Required Tables
    console.log('2️⃣  Checking required tables...');
    const requiredTables = [
        'global_chat_sessions',
        'global_chat_messages',
        'global_widget_config',
        'global_chat_notes'
    ];

    for (const table of requiredTables) {
        const result = await checkTableExists(table);
        results.tables[table] = result.exists;

        if (result.exists) {
            console.log(`   ✅ ${table}`);
        } else {
            console.log(`   ❌ ${table} - ${result.error}`);
            results.overall = false;
        }
    }

    console.log('');

    // Check 3: Realtime Connection
    console.log('3️⃣  Testing realtime WebSocket connection...');
    const realtimeTest = await testRealtimeConnection();
    results.realtime = realtimeTest.connected;

    if (realtimeTest.connected) {
        console.log('   ✅ Realtime connection working');
    } else {
        console.log('   ❌ Realtime connection failed:', realtimeTest.error);
        results.overall = false;
    }

    console.log('');

    // Summary
    console.log('═'.repeat(60));
    console.log('SUMMARY');
    console.log('═'.repeat(60));
    console.log('');

    if (results.overall) {
        console.log('🎉 SUCCESS! Your database is ready for real-time chat!');
        console.log('');
        console.log('Next steps:');
        console.log('  1. Start your dev server: npm run dev');
        console.log('  2. Open http://localhost:5173');
        console.log('  3. Test the chat widget!');
    } else {
        console.log('❌ SETUP INCOMPLETE');
        console.log('');
        console.log('Action required:');
        console.log('');

        if (!results.connection) {
            console.log('  ⚠️  Database connection failed');
            console.log('      → Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
            console.log('      → Verify your Supabase project is not paused');
        }

        const missingTables = Object.entries(results.tables)
            .filter(([_, exists]) => !exists)
            .map(([name]) => name);

        if (missingTables.length > 0) {
            console.log('  ⚠️  Missing tables:', missingTables.join(', '));
            console.log('      → Run the SQL schema in Supabase Dashboard');
            console.log('      → File: backend/schema/global_chat_schema.sql');
            console.log('      → Dashboard: https://supabase.com/dashboard/project/rwcfkcgunbjzunwwrmki/sql');
        }

        if (!results.realtime) {
            console.log('  ⚠️  Realtime connection failed');
            console.log('      → Enable replication in Supabase Dashboard');
            console.log('      → Database → Replication → Enable for chat tables');
        }
    }

    console.log('');
    console.log('For detailed setup instructions, see:');
    console.log('  backend/REALTIME_TESTING_GUIDE.md');
    console.log('');

    process.exit(results.overall ? 0 : 1);
}

runChecks().catch(err => {
    console.error('❌ Error running checks:', err);
    process.exit(1);
});
