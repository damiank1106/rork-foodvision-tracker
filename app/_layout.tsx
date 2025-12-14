import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { initMealsDb } from "@/services/mealsDb";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ProfileProvider } from "@/context/ProfileContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{
      animation: 'fade_from_bottom', // Smooth transition default
      contentStyle: { backgroundColor: 'transparent' }, // Avoid white flashes
      headerShown: false, // Default to no header, since we use custom headers or ScreenWrapper
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="meal/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

function RootLayoutInner() {
  const { theme, colors } = useTheme();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initMealsDb();
        console.log('Database initialized successfully');
        setDbReady(true);
        await SplashScreen.hideAsync();
      } catch (e) {
        console.error('Failed to initialize database:', e);
        setDbReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!dbReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <RootLayoutNav />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <RootLayoutInner />
      </ProfileProvider>
    </ThemeProvider>
  );
}
