const fs = require('fs');
const path = require('path');

// Read the events.ts file
const eventsPath = path.join(__dirname, '../src/data/events.ts');
const eventsContent = fs.readFileSync(eventsPath, 'utf8');

// Extract the events array using regex
const eventsMatch = eventsContent.match(/export const EVENTS: Event\[\] = (\[[\s\S]*?\]);/);
if (!eventsMatch) {
  console.error('Could not find EVENTS array in events.ts');
  process.exit(1);
}

// Convert TypeScript to JavaScript
let eventsJs = eventsMatch[1]
  // Remove TypeScript type annotations
  .replace(/: Event/g, '')
  .replace(/: string/g, '')
  .replace(/: number/g, '')
  .replace(/: \{/g, ': {')
  // Remove import statements and export
  .replace(/import.*?;/g, '')
  .replace(/export const EVENTS/g, 'const EVENTS');

// Write the extracted events to a temporary file
const tempPath = path.join(__dirname, 'temp-events.js');
fs.writeFileSync(tempPath, `module.exports = { EVENTS: ${eventsJs} };`);

console.log('✅ Events extracted successfully!');
console.log(`📁 Temporary file created: ${tempPath}`);

// Now let's test if we can require it
try {
  const { EVENTS } = require('./temp-events');
  console.log(`📊 Found ${EVENTS.length} events`);
  
  // Show first few events
  console.log('\n📋 First 3 events:');
  EVENTS.slice(0, 3).forEach(event => {
    console.log(`  - ${event.title} (${event.category})`);
  });
  
} catch (error) {
  console.error('❌ Error loading events:', error.message);
} 