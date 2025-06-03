export type Badge = {
  id: string;
  name: string;
  icon: string;
  description: string;
  category?: string;
};

export const BADGES: Badge[] = [
  // Category-based
  { id: 'environment-hero', name: 'Environment Hero', icon: '🌿', description: 'Complete 5 Environment events', category: 'Environment' },
  { id: 'community-builder', name: 'Community Builder', icon: '🏘️', description: 'Complete 5 Community events', category: 'Community' },
  { id: 'relief-responder', name: 'Relief Responder', icon: '🤝', description: 'Complete 5 Care & Relief events', category: 'Care & Relief' },
  { id: 'youth-mentor', name: 'Youth Mentor', icon: '📚', description: 'Complete 5 Youth & Education events', category: 'Youth & Education' },
  { id: 'animal-advocate', name: 'Animal Advocate', icon: '❤️', description: 'Complete 5 Health & Animals events', category: 'Health & Animals' },
  { id: 'faithful-volunteer', name: 'Faithful Volunteer', icon: '🕊️', description: 'Complete 5 Faith-Based events', category: 'Faith-Based' },
  // Milestone/overall
  { id: 'first-timer', name: 'First Timer', icon: '🎯', description: 'Complete your first event' },
  { id: 'community-star', name: 'Community Star', icon: '🌟', description: 'Volunteer at 10 different events' },
  { id: '25-hours', name: '25 Hours Club', icon: '⏰', description: 'Volunteer for 25 total hours' },
  { id: '100-hours', name: '100 Hours Club', icon: '💯', description: 'Volunteer for 100 total hours' },
  { id: 'storyteller', name: 'Storyteller', icon: '📝', description: 'Share 5 community posts' },
  { id: 'super-saver', name: 'Super Saver', icon: '🤩', description: 'Save 10 events' },
]; 