import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { X } from 'lucide-react-native';

export default function CoachLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="archives" 
        options={{
          headerShown: true,
          presentation: 'card',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          title: 'Archived Conversations',
          headerBackTitle: 'Back',
          headerLeft: () => null,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
                backgroundColor: colors.glassBackgroundStrong,
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen 
        name="view" 
        options={{
          headerShown: true,
          presentation: 'card',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          title: 'Conversation',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
