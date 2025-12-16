import createContextHook from '@nkzw/create-context-hook';
import { useSettings } from '@/hooks/useSettings';
import { LightColors, DarkColors } from '@/constants/colors';
import { useMemo } from 'react';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const { 
    theme, 
    saveTheme, 
    animatedBgEnabled,
    animatedBgColor,
    animatedBgIntensity,
    animatedFoodIconsEnabled,
    animatedFoodIconsColor,
    animatedFoodIconsIntensity,
    glassOpacity,
    saveAnimatedBgEnabled,
    saveAnimatedBgColor,
    saveAnimatedBgIntensity,
    saveAnimatedFoodIconsEnabled,
    saveAnimatedFoodIconsColor,
    saveAnimatedFoodIconsIntensity,
    saveGlassOpacity,
    isLoading 
  } = useSettings();

  const colors = useMemo(() => {
    return theme === 'dark' ? DarkColors : LightColors;
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    await saveTheme(newTheme);
  };

  return {
    theme,
    setTheme: saveTheme,
    toggleTheme,
    colors,
    isLoading,
    animatedBgEnabled,
    animatedBgColor,
    animatedBgIntensity,
    animatedFoodIconsEnabled,
    animatedFoodIconsColor,
    animatedFoodIconsIntensity,
    glassOpacity,
    setAnimatedBgEnabled: saveAnimatedBgEnabled,
    setAnimatedBgColor: saveAnimatedBgColor,
    setAnimatedBgIntensity: saveAnimatedBgIntensity,
    setAnimatedFoodIconsEnabled: saveAnimatedFoodIconsEnabled,
    setAnimatedFoodIconsColor: saveAnimatedFoodIconsColor,
    setAnimatedFoodIconsIntensity: saveAnimatedFoodIconsIntensity,
    setGlassOpacity: saveGlassOpacity,
  };
});
