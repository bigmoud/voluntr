export type Category = {
  id: string;
  label: string;
  emoji: string;
  color: string;
};

export const TOP_CATEGORIES: Category[] = [
  { id: 'environment', label: 'Environment', emoji: '🌿', color: '#A3E635' },
  { id: 'community', label: 'Community', emoji: '👥', color: '#60A5FA' },
  { id: 'relief', label: 'Care & Relief', emoji: '🆘', color: '#F87171' },
  { id: 'youth', label: 'Youth & Education', emoji: '👶', color: '#FBBF24' },
  { id: 'health', label: 'Health & Animals', emoji: '🐾', color: '#34D399' },
  { id: 'faith', label: 'Faith-Based', emoji: '🙏', color: '#A78BFA' },
]; 