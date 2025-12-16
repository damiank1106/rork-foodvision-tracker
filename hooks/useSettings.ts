import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

export const STORAGE_KEY_API_KEY = 'foodvision_openai_api_key';
export const STORAGE_KEY_DEEPSEEK_API_KEY = 'foodvision_deepseek_api_key';
export const STORAGE_KEY_THEME = 'foodvision_theme';
export const STORAGE_KEY_OPENAI_MODEL = 'foodvision_openai_model';
export const STORAGE_KEY_DEEPSEEK_MODEL = 'foodvision_deepseek_model';
export const STORAGE_KEY_ANIMATED_BG_ENABLED = 'foodvision_animated_bg_enabled';
export const STORAGE_KEY_ANIMATED_BG_COLOR = 'foodvision_animated_bg_color';
export const STORAGE_KEY_ANIMATED_BG_INTENSITY = 'foodvision_animated_bg_intensity';

export type ThemeType = 'light' | 'dark';
export type AnimatedBgIntensity = 'low' | 'medium' | 'high' | 'super-high';

export async function getStoredOpenAiKey(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY_API_KEY);
  } catch (e) {
    console.error('Failed to get stored API key', e);
    return null;
  }
}

export async function getStoredOpenAiModel(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY_OPENAI_MODEL)) || 'gpt-4o-mini';
  } catch (e) {
    console.error('Failed to get stored OpenAI model', e);
    return 'gpt-4o-mini';
  }
}

export async function getStoredDeepSeekKey(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY_DEEPSEEK_API_KEY);
  } catch (e) {
    console.error('Failed to get stored DeepSeek API key', e);
    return null;
  }
}

export async function getStoredDeepSeekModel(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY_DEEPSEEK_MODEL)) || 'deepseek-chat';
  } catch (e) {
    console.error('Failed to get stored DeepSeek model', e);
    return 'deepseek-chat';
  }
}

export function useSettings() {
  const [apiKey, setApiKey] = useState<string>('');
  const [deepSeekApiKey, setDeepSeekApiKey] = useState<string>('');
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [openAiModel, setOpenAiModel] = useState<string>('gpt-4o-mini');
  const [deepSeekModel, setDeepSeekModel] = useState<string>('deepseek-chat');
  const [animatedBgEnabled, setAnimatedBgEnabled] = useState<boolean>(false);
  const [animatedBgColor, setAnimatedBgColor] = useState<string>('#4A90E2');
  const [animatedBgIntensity, setAnimatedBgIntensity] = useState<AnimatedBgIntensity>('medium');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        storedKey, 
        storedDeepSeekKey, 
        storedTheme, 
        storedOpenAiModel, 
        storedDeepSeekModel,
        storedAnimatedBgEnabled,
        storedAnimatedBgColor,
        storedAnimatedBgIntensity
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_API_KEY),
        AsyncStorage.getItem(STORAGE_KEY_DEEPSEEK_API_KEY),
        AsyncStorage.getItem(STORAGE_KEY_THEME),
        AsyncStorage.getItem(STORAGE_KEY_OPENAI_MODEL),
        AsyncStorage.getItem(STORAGE_KEY_DEEPSEEK_MODEL),
        AsyncStorage.getItem(STORAGE_KEY_ANIMATED_BG_ENABLED),
        AsyncStorage.getItem(STORAGE_KEY_ANIMATED_BG_COLOR),
        AsyncStorage.getItem(STORAGE_KEY_ANIMATED_BG_INTENSITY)
      ]);

      if (storedKey) setApiKey(storedKey);
      if (storedDeepSeekKey) setDeepSeekApiKey(storedDeepSeekKey);
      if (storedTheme === 'dark' || storedTheme === 'light') {
        setTheme(storedTheme as ThemeType);
      }
      if (storedOpenAiModel) setOpenAiModel(storedOpenAiModel);
      if (storedDeepSeekModel) setDeepSeekModel(storedDeepSeekModel);
      if (storedAnimatedBgEnabled !== null) setAnimatedBgEnabled(storedAnimatedBgEnabled === 'true');
      if (storedAnimatedBgColor) setAnimatedBgColor(storedAnimatedBgColor);
      if (storedAnimatedBgIntensity) setAnimatedBgIntensity(storedAnimatedBgIntensity as AnimatedBgIntensity);
      
      setError(null);
    } catch (e) {
      setError('Failed to load settings');
      console.error('Failed to load settings', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveApiKey = useCallback(async (key: string) => {
    try {
      setIsLoading(true);
      await AsyncStorage.setItem(STORAGE_KEY_API_KEY, key);
      setApiKey(key);
      setError(null);
      return true;
    } catch {
      setError('Failed to save API key');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveDeepSeekApiKey = useCallback(async (key: string) => {
    try {
      setIsLoading(true);
      await AsyncStorage.setItem(STORAGE_KEY_DEEPSEEK_API_KEY, key);
      setDeepSeekApiKey(key);
      setError(null);
      return true;
    } catch {
      setError('Failed to save DeepSeek API key');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveOpenAiModel = useCallback(async (model: string) => {
    try {
      setIsLoading(true);
      await AsyncStorage.setItem(STORAGE_KEY_OPENAI_MODEL, model);
      setOpenAiModel(model);
      setError(null);
      return true;
    } catch {
      setError('Failed to save OpenAI model');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveDeepSeekModel = useCallback(async (model: string) => {
    try {
      setIsLoading(true);
      await AsyncStorage.setItem(STORAGE_KEY_DEEPSEEK_MODEL, model);
      setDeepSeekModel(model);
      setError(null);
      return true;
    } catch {
      setError('Failed to save DeepSeek model');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveTheme = useCallback(async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_THEME, newTheme);
      setTheme(newTheme);
      return true;
    } catch (e) {
      console.error('Failed to save theme', e);
      return false;
    }
  }, []);

  const saveAnimatedBgEnabled = useCallback(async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ANIMATED_BG_ENABLED, enabled.toString());
      setAnimatedBgEnabled(enabled);
      return true;
    } catch (e) {
      console.error('Failed to save animated bg enabled', e);
      return false;
    }
  }, []);

  const saveAnimatedBgColor = useCallback(async (color: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ANIMATED_BG_COLOR, color);
      setAnimatedBgColor(color);
      return true;
    } catch (e) {
      console.error('Failed to save animated bg color', e);
      return false;
    }
  }, []);

  const saveAnimatedBgIntensity = useCallback(async (intensity: AnimatedBgIntensity) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ANIMATED_BG_INTENSITY, intensity);
      setAnimatedBgIntensity(intensity);
      return true;
    } catch (e) {
      console.error('Failed to save animated bg intensity', e);
      return false;
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    apiKey,
    deepSeekApiKey,
    theme,
    openAiModel,
    deepSeekModel,
    animatedBgEnabled,
    animatedBgColor,
    animatedBgIntensity,
    isLoading,
    error,
    saveApiKey,
    saveDeepSeekApiKey,
    saveOpenAiModel,
    saveDeepSeekModel,
    saveTheme,
    saveAnimatedBgEnabled,
    saveAnimatedBgColor,
    saveAnimatedBgIntensity,
    reload: loadSettings,
  };
}
