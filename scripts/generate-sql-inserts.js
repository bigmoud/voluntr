const { EVENTS } = require('./temp-events');

// Function to parse date string to ISO date
function parseDate(dateStr) {
  const months = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
    'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
  };

  // Parse date like "May 06, 2025"
  const parts = dateStr.split(' ');
  const month = months[parts[0]];
  const day = parseInt(parts[1].replace(',', ''));
  const year = parseInt(parts[2]);

  return new Date(year, month, day).toISOString().split('T')[0];
}

// Function to parse time string to time format
function parseTime(timeStr) {
  // Parse time like "9:00 AM – 12:00 PM"
  const times = timeStr.split(' – ');
  const startTime = times[0];
  const endTime = times[1];

  // Convert 12-hour format to 24-hour format
  function convertTo24Hour(time) {
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  return {
    start: convertTo24Hour(startTime),
    end: convertTo24Hour(endTime)
  };
}

function generateSQLInserts() {
  console.log('📝 Generating SQL INSERT statements...\n');
  
  console.log('-- SQL INSERT statements for events table');
  console.log('-- Copy and paste this into your Supabase SQL Editor\n');
  
  EVENTS.forEach((event, index) => {
    const { start, end } = parseTime(event.time);
    const date = parseDate(event.date);
    
    const sql = `INSERT INTO public.events (
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
  is_virtual,
  is_featured,
  status
) VALUES (
  '${event.title.replace(/'/g, "''")}',
  '${event.description.replace(/'/g, "''")}',
  '${event.category}',
  '${date}',
  '${start}',
  '${end}',
  '${event.location.address.replace(/'/g, "''")}',
  ${event.location.coordinates.latitude},
  ${event.location.coordinates.longitude},
  '${event.url || ''}',
  'Voluntr Community',
  false,
  ${index < 10},
  'active'
);`;
    
    console.log(sql);
    console.log('');
  });
  
  console.log('-- Migration completed!');
  console.log(`-- Total events: ${EVENTS.length}`);
}

// Run if this script is executed directly
if (require.main === module) {
  generateSQLInserts();
}

module.exports = { generateSQLInserts }; 