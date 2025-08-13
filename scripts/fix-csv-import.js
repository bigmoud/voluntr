const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function fixCsvImport() {
  console.log('🔧 Fixing CSV import for events...\n');

  try {
    // First, let's check if we have any users in the profiles table
    console.log('📋 Checking existing users...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .limit(5);

    if (profilesError) {
      console.error('❌ Error checking profiles:', profilesError);
      return;
    }

    console.log(`✅ Found ${profiles?.length || 0} users in profiles table`);
    if (profiles && profiles.length > 0) {
      console.log('📋 Available users:');
      profiles.forEach(profile => {
        console.log(`  - ${profile.full_name} (${profile.id})`);
      });
    }

    console.log('\n📝 Reading CSV file...');
    
    // Read the CSV file
    const csvData = [];
    fs.createReadStream('assets/Untitled spreadsheet - Sheet1.csv')
      .pipe(csv())
      .on('data', (row) => {
        csvData.push(row);
      })
      .on('end', async () => {
        console.log(`📊 Found ${csvData.length} events in CSV`);
        
        // Get a valid user ID to use for created_by
        let defaultUserId = null;
        if (profiles && profiles.length > 0) {
          defaultUserId = profiles[0].id;
          console.log(`🔧 Using default user ID: ${defaultUserId}`);
        }

        // Process each event
        const processedEvents = csvData.map((row, index) => {
          // Fix the created_by field
          let createdBy = row.created_by;
          
          // If created_by is empty or doesn't exist in profiles, use default user
          if (!createdBy || createdBy.trim() === '') {
            createdBy = defaultUserId;
          } else {
            // Check if this user ID exists in profiles
            const userExists = profiles?.some(profile => profile.id === createdBy);
            if (!userExists) {
              console.log(`⚠️  User ID ${createdBy} not found in profiles, using default user`);
              createdBy = defaultUserId;
            }
          }

          return {
            id: row.id,
            title: row.title,
            description: row.description,
            category: row.category,
            date: row.date,
            time_start: row.time_start,
            time_end: row.time_end,
            location_address: row.location_address,
            location_latitude: row.location_latitude ? parseFloat(row.location_latitude) : null,
            location_longitude: row.location_longitude ? parseFloat(row.location_longitude) : null,
            external_url: row.external_url || null,
            organization_name: row.organization_name || null,
            status: row.status || 'active',
            created_by: createdBy
          };
        });

        console.log('\n📋 Processed events:');
        processedEvents.forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.title} (${event.status}) - created_by: ${event.created_by}`);
        });

        // Generate SQL INSERT statements
        console.log('\n📝 Generating SQL INSERT statements...\n');
        
        console.log('-- SQL INSERT statements for events table');
        console.log('-- Copy and paste this into your Supabase SQL Editor\n');

        processedEvents.forEach((event) => {
          const sql = `INSERT INTO public.events (
  id,
  title,
  description,
  category,
  date,
  time_start,
  time_end,
  location_address,
  location_latitude,
  location_longitude,
  external_url,
  organization_name,
  status,
  created_by
) VALUES (
  '${event.id}',
  '${event.title.replace(/'/g, "''")}',
  '${event.description.replace(/'/g, "''")}',
  '${event.category}',
  '${event.date}',
  '${event.time_start}',
  '${event.time_end}',
  '${event.location_address.replace(/'/g, "''")}',
  ${event.location_latitude || 'NULL'},
  ${event.location_longitude || 'NULL'},
  ${event.external_url ? `'${event.external_url}'` : 'NULL'},
  ${event.organization_name ? `'${event.organization_name.replace(/'/g, "''")}'` : 'NULL'},
  '${event.status}',
  ${event.created_by ? `'${event.created_by}'` : 'NULL'}
);`;
          
          console.log(sql);
          console.log('');
        });

        console.log('-- Migration completed!');
        console.log(`-- Total events: ${processedEvents.length}`);
        console.log('\n🔗 Go to: https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]/sql');
        console.log('📋 Copy and paste the SQL above, then click "Run"');
        
      });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Alternative approach: Create events without created_by (if no users exist)
async function createEventsWithoutCreatedBy() {
  console.log('🔧 Creating events without created_by field...\n');

  try {
    console.log('📝 Reading CSV file...');
    
    const csvData = [];
    fs.createReadStream('assets/Untitled spreadsheet - Sheet1.csv')
      .pipe(csv())
      .on('data', (row) => {
        csvData.push(row);
      })
      .on('end', async () => {
        console.log(`📊 Found ${csvData.length} events in CSV`);
        
        console.log('\n📝 Generating SQL INSERT statements (without created_by)...\n');
        
        console.log('-- SQL INSERT statements for events table (without created_by)');
        console.log('-- Copy and paste this into your Supabase SQL Editor\n');

        csvData.forEach((row) => {
          const sql = `INSERT INTO public.events (
  id,
  title,
  description,
  category,
  date,
  time_start,
  time_end,
  location_address,
  location_latitude,
  location_longitude,
  external_url,
  organization_name,
  status
) VALUES (
  '${row.id}',
  '${row.title.replace(/'/g, "''")}',
  '${row.description.replace(/'/g, "''")}',
  '${row.category}',
  '${row.date}',
  '${row.time_start}',
  '${row.time_end}',
  '${row.location_address.replace(/'/g, "''")}',
  ${row.location_latitude ? parseFloat(row.location_latitude) : 'NULL'},
  ${row.location_longitude ? parseFloat(row.location_longitude) : 'NULL'},
  ${row.external_url ? `'${row.external_url}'` : 'NULL'},
  ${row.organization_name ? `'${row.organization_name.replace(/'/g, "''")}'` : 'NULL'},
  '${row.status || 'active'}'
);`;
          
          console.log(sql);
          console.log('');
        });

        console.log('-- Migration completed!');
        console.log(`-- Total events: ${csvData.length}`);
        console.log('\n🔗 Go to: https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]/sql');
        console.log('📋 Copy and paste the SQL above, then click "Run"');
        
      });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run based on command line arguments
const command = process.argv[2];

if (require.main === module) {
  switch (command) {
    case 'without-created-by':
      createEventsWithoutCreatedBy();
      break;
    default:
      fixCsvImport();
      break;
  }
}

module.exports = { fixCsvImport, createEventsWithoutCreatedBy }; 