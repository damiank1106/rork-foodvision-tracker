import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, Text, Pressable, ViewStyle, TextStyle, ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface GlassButtonProps {
  onPress: () => void;
  title: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GlassButton: React.FC<GlassButtonProps> = ({ 
  onPress, 
  title, 
  style, 
  textStyle, 
  isLoading = false,
  variant = 'primary',
  disabled = false
}) => {
  const { colors, theme } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    if (isLoading || disabled) return;
    Haptics.selectionAsync();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedPressable 
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container, 
        { 
          borderColor: colors.glassBorder,
          backgroundColor: colors.glassBackground,
        },
        style,
        animatedStyle
      ]}
    >
      <BlurView intensity={30} tint={theme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[
        styles.content, 
        variant === 'primary' && { backgroundColor: theme === 'dark' ? 'rgba(77, 184, 255, 0.3)' : 'rgba(77, 184, 255, 0.2)' },
        (isLoading || disabled) && styles.loadingContent
      ]}>
        {isLoading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={[styles.text, { color: colors.text }, textStyle]}>{title}</Text>
        )}
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 56,
    borderWidth: 1.5,
    marginVertical: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    opacity: 0.8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
