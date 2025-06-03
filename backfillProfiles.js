const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gwakbbmlwobuokpaokcx.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3YWtiYm1sd29idW9rcGFva2N4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODYzNTg0MywiZXhwIjoyMDY0MjExODQzfQ.Ir6q018c3pb3laEhrSrwL_pKR4BjC-CHzdhfxEaRc5w';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function backfillProfiles() {
  // 1. Get all users from auth.users
  const { data: users, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;

  console.log(`Found ${users.users.length} users`);

  for (const user of users.users) {
    console.log(`Processing user: ${user.email} (${user.id})`);
    // 2. Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log(`Error checking profile for ${user.email}:`, profileError.message);
    }

    if (!profile) {
      // 3. Insert a minimal profile (customize as needed)
      const { error: upsertError } = await supabase.from('profiles').upsert([
        {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email || '',
          username: user.user_metadata?.username || user.email?.split('@')[0] || '',
        }
      ]);
      if (upsertError) {
        console.log(`Error upserting profile for ${user.email}:`, upsertError.message);
      } else {
        console.log(`Backfilled profile for user: ${user.email}`);
      }
    } else {
      console.log(`Profile already exists for user: ${user.email}`);
    }
  }
  console.log('Backfill complete!');
}

backfillProfiles().catch(console.error);