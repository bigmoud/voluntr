import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';

export const SLEEK_ACCENT = '#22543D';
export const SLEEK_GRADIENT = [
  '#e6f9ec',
  '#fff',
  '#d0ede3',
] as const;
export const SLEEK_CARD_BG = 'rgba(255,255,255,0.85)';
export const SLEEK_SHADOW = {
  shadowColor: '#22543D',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 24,
  elevation: 12,
};

export const sleekStyles = StyleSheet.create({
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 60,
    alignItems: 'stretch',
    minHeight: 420,
    maxHeight: 420,
    justifyContent: 'flex-start',
    ...SLEEK_SHADOW,
    borderWidth: 2,
    borderColor: '#388E6C',
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#22543D',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  categoryPill: {
    backgroundColor: SLEEK_ACCENT,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
    shadowColor: SLEEK_ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryPillText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    zIndex: 2,
    marginLeft: 8,
  },
  iconCircle: {
    backgroundColor: '#fff',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    ...SLEEK_SHADOW,
    marginLeft: 8,
    padding: 4,
  },
  learnMoreButton: {
    backgroundColor: SLEEK_ACCENT,
    borderRadius: 24,
    paddingHorizontal: 36,
    paddingVertical: 14,
    alignSelf: 'center',
    marginBottom: 24,
    marginTop: 8,
    shadowColor: SLEEK_ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
  },
  learnMoreText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  swipeButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...SLEEK_SHADOW,
    borderWidth: 2,
    marginHorizontal: 12,
  },
  swipeButtonLeft: {
    borderColor: '#FF3B30',
  },
  swipeButtonRight: {
    borderColor: SLEEK_ACCENT,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 4,
    shadowColor: '#22543D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#22543D',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  searchIcon: {
    marginRight: 8,
    color: '#22543D',
  },
  clearIcon: {
    marginLeft: 6,
    color: '#bbb',
  },
  filterIconButton: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 8,
    marginLeft: 8,
    shadowColor: '#22543D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#388E6C',
  },
  viewModeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    marginBottom: 10,
    marginTop: 2,
    backgroundColor: '#f7fafc',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#22543D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 1,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  viewModeButtonActive: {
    backgroundColor: '#22543D',
    shadowColor: '#22543D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  viewModeIcon: {
    marginRight: 6,
  },
  viewModeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#22543D',
  },
  viewModeTextActive: {
    color: '#fff',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22543D',
    marginBottom: 10,
  },
});

// Helper: SleekGradientBg
export const SleekGradientBg = ({ children }: { children: ReactNode }) => (
  <LinearGradient colors={SLEEK_GRADIENT} style={sleekStyles.gradientBg}>
    {children}
  </LinearGradient>
); 