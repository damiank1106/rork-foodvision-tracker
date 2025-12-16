import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  intensity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, contentStyle, intensity = 25 }) => {
  const { colors, theme } = useTheme();
  
  return (
    <View style={[
      styles.wrapper, 
      { 
        backgroundColor: colors.glassBackground,
        borderColor: colors.glassBorder,
        shadowColor: colors.primary,
      }, 
      style
    ]}>
      <BlurView intensity={intensity} tint={theme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: Platform.OS === 'android' ? 1 : 1.5,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  content: {
    padding: 16,
    zIndex: 1,
  },
});
