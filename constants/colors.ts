export const LightColors = {
  background: '#F5FAFF',
  backgroundSecondary: '#FFFFFF',
  
  backgroundGradientStart: '#F5FAFF',
  backgroundGradientEnd: '#FFFFFF', 
  
  text: '#000000',
  textPrimary: '#000000',
  textSecondary: '#4A4A4A',
  textMuted: '#8A9AA9',
  
  tint: '#4DB8FF',
  primary: '#4DB8FF',
  secondaryAccent: '#A7E1FF',
  accent: '#4DB8FF',
  
  tabIconDefault: '#000000',
  tabIconSelected: '#4DB8FF',
  
  glassBorder: 'rgba(0, 0, 0, 0.1)', // Increased visibility (was 0.06)
  glassBackground: 'rgba(255, 255, 255, 0.9)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.95)',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
  
  success: '#34D399',
  error: '#EF4444',
  danger: '#EF4444',
  
  gradientPrimary: ['#A7E1FF', '#4DB8FF'] as const,
};

export const DarkColors = {
  background: '#0A0A0A',
  backgroundSecondary: '#1A1A1A',
  
  backgroundGradientStart: '#0A0A0A',
  backgroundGradientEnd: '#001E3C',
  
  text: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#FFFFFF',
  textMuted: '#FFFFFF',
  
  tint: '#4DB8FF',
  primary: '#4DB8FF',
  secondaryAccent: '#009DFF',
  accent: '#4DB8FF',
  
  tabIconDefault: '#FFFFFF',
  tabIconSelected: '#4DB8FF',
  
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBackground: 'rgba(255, 255, 255, 0.12)',
  glassBackgroundStrong: 'rgba(30, 30, 30, 0.85)',
  modalOverlay: 'rgba(0, 0, 0, 0.75)',
  
  success: '#34D399',
  error: '#EF4444',
  danger: '#EF4444',
  
  gradientPrimary: ['#009DFF', '#4DB8FF'] as const,
};

// Default export to support existing imports temporarily, 
// though we should migrate to useTheme
export default LightColors;
